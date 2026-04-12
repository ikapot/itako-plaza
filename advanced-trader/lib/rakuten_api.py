import requests
import hmac
import hashlib
import time
import json
import logging
from typing import Dict, List, Optional, Any, Union
from functools import wraps

# --- Logger ---
logger = logging.getLogger("RakutenWallet")

def retry_request(max_retries: int = 3, delay: float = 2.0):
    """リクエスト失敗時に指数バックオフでリトライするデコレータ"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    error_msg = str(e)
                    # 特定の致命的なエラーの場合はリトライせず即死させる（デバッグ効率化）
                    if "401" in error_msg or "403" in error_msg:
                        logger.error(f"❌ Authentication Error: {error_msg}")
                        raise e
                    if retries >= max_retries:
                        logger.error(f"❌ Max retries reached for {func.__name__}: {e}")
                        raise e
                    wait_time = delay * (2 ** (retries - 1))
                    logger.warning(f"⚠️ Request failed ({e}). Retrying in {wait_time}s... ({retries}/{max_retries})")
                    time.sleep(wait_time)
            return None
        return wrapper
    return decorator

class RakutenWalletClient:
    """
    Rakuten Wallet API Client (Spot/CFD Unified)
    Optimization: Enhanced reliability and structured outputs.
    """
    def __init__(self, api_key: str, api_secret: str, is_spot: bool = False):
        if not api_key or not api_secret:
            raise ValueError("API Key and Secret are required.")
        self.api_key = api_key.strip()
        self.api_secret = api_secret.strip()
        # NotebookLM 仕様: Spot と CFD でベースURLが異なる
        if is_spot:
            self.base_url = "https://api.rakuten-wallet.co.jp"
        else:
            self.base_url = "https://exchange.rakuten-wallet.co.jp"
            
        self.session = requests.Session()
        self.timeout = 15

    def _get_signature(self, nonce: str, method: str, path: str, query: str = "", body: str = "") -> str:
        """署名の生成 (HMAC-SHA256) - NotebookLM の仕様に基づく"""
        # 仕様:
        # GET/DELETE: NONCE + URI + query
        # POST/PUT: NONCE + body
        
        # URI の調整 (冒頭のスラッシュを含む、/api を含むか含まないかは API 側の期待値に合わせる)
        # 以前のコードでは /api を削除していましたが、NotebookLM 調査結果に基づきまずはパス全体で試行
        
        if method in ["GET", "DELETE"]:
            # クエリパラメータがある場合は path?query になる
            full_uri = f"{path}?{query}" if query else path
            message = f"{nonce}{full_uri}"
        else:
            # POST/PUT: NONCE + body (JSON)
            message = f"{nonce}{body}"
        
        logger.debug(f"🔑 Signing Message: [{message}]")
        
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    @retry_request(max_retries=3)
    def _request(self, method: str, path: str, params: Optional[Dict] = None, body: Optional[Dict] = None) -> Union[Dict, List]:
        """汎用リクエストメソッド (自動リトライ・署名付与)"""
        # パラメータがあればクエリ文字列に変換
        query_str = ""
        if params:
            from urllib.parse import urlencode
            query_str = urlencode(params)
            
        url = self.base_url + path
        if query_str:
            url += f"?{query_str}"
            
        body_str = json.dumps(body, separators=(',', ':')) if body else ""
        
        # 13桁（ミリ秒）の Nonce
        nonce = str(int(time.time() * 1000))
        
        # 署名生成 (クエリパラメータを渡す)
        signature = self._get_signature(nonce, method, path, query_str, body_str)
        
        # NotebookLM 仕様: TIMESTAMP ヘッダーの存在（NONCEと同じ値）
        headers = {
            "API-KEY": self.api_key,
            "NONCE": nonce,
            "TIMESTAMP": nonce,
            "SIGNATURE": signature,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        logger.debug(f"📡 Request: {method} {url} | Nonce: {nonce}")

        resp = self.session.request(method, url, headers=headers, params=params, data=body_str, timeout=self.timeout)
        
        if resp.status_code != 200:
            error_data = {"error": f"{resp.status_code} {resp.reason} for {url}", "status_code": resp.status_code}
            try:
                error_data["raw"] = resp.json()
            except:
                pass
            raise Exception(f"HTTP Error: {error_data}")
            
        return resp.json()

    def get_balance(self) -> dict:
        """保有資産(現物・証拠金)の取得"""
        return self._request("GET", "/api/v1/asset")

    def get_margin_info(self) -> dict:
        """有効証拠金(Equity)データの取得"""
        # CFD APIでは /api/v1/cfd/equitydata
        return self._request("GET", "/api/v1/cfd/equitydata")

    def get_cfd_positions(self) -> List[dict]:
        """保有している建玉（ポジション）の一覧取得"""
        return self._request("GET", "/api/v1/cfd/position")

    def place_cfd_order(self, symbol_id: int, side: str, amount: float, order_type: str = "MARKET", behavior: str = "NEW") -> dict:
        """
        証拠金取引（CFD）注文実行 (/api/v1/cfd/order)
        """
        # CFD独自の構造: symbolId, orderPattern, orderData の入れ子
        body = {
            "symbolId": symbol_id,
            "orderPattern": "NORMAL",
            "orderData": {
                "orderBehavior": behavior,      # NEW or CLOSE
                "orderSide": side,             # BUY or SELL
                "orderType": order_type,       # MARKET, LIMIT etc.
                "amount": float(amount),
                "leverage": 2.0,               # デフォルト2倍
                "closeBehavior": "FIFO"        # 両建てなし（古い順から決済）
            }
        }
        return self._request("POST", "/api/v1/cfd/order", body)

    def get_spot_balance(self) -> dict:
        """現物残高（JPY, BTC）を辞書で取得"""
        try:
            res = self.get_balance()
            balances = {"JPY": 0.0, "BTC": 0.0}
            if not res or not isinstance(res, list):
                return balances
            for asset in res:
                cur = asset.get("currency")
                amt = asset.get("onhandAmount", 0)
                if cur in ["JPY", "BTC"]:
                    balances[cur] = float(amt)
            return balances
        except Exception as e:
            logger.error(f"❌ 現物残高取得失敗: {e}")
            return {"JPY": 0.0, "BTC": 0.0}

    def get_btc_balance(self) -> float:
        """現在のビットコイン保有量（現物・証拠金合算）を取得"""
        return self.get_spot_balance().get("BTC", 0.0)

    def get_ticker(self, symbol_id: int = 7) -> dict:
        """現在の価格を取得 (7=BTC/JPY)"""
        # クエリパラメータ付きのリクエストテスト
        return self._request("GET", "/api/v1/ticker", params={"symbolId": symbol_id})

    def place_order(self, symbol_id: int, side: str, amount: float, order_type: str = "MARKET", price: float = None) -> dict:
        """
        現物注文実行 (/api/v1/order)
        """
        body = {
            "symbolId": symbol_id,
            "side": side,
            "amount": float(amount),
            "type": order_type
        }
        if price:
            body["price"] = float(price)
            
        return self._request("POST", "/api/v1/order", body)

    def get_active_orders(self) -> dict:
        """現物の有効な注文の一覧取得"""
        return self._request("GET", "/api/v1/activeorder")
