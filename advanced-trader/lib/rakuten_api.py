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
        self._last_request_time = 0.0  # レートリミット管理用
        self._min_interval = 1.05       # 1,000ms + 余裕50ms

    def _wait_for_rate_limit(self):
        """1,000ms (1秒) のリクエスト間隔を確保する (2024年11月改定対応)"""
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self._min_interval:
            wait_time = self._min_interval - elapsed
            logger.debug(f"⏳ Rate Limit Guard: Waiting {wait_time:.3f}s...")
            time.sleep(wait_time)
        self._last_request_time = time.time()

    def _get_signature(self, nonce: str, method: str, path: str, query: str = "", body_str: str = "") -> str:
        """署名の生成 (HMAC-SHA256) - NotebookLM 最新仕様"""
        # 仕様:
        # GET/DELETE: nonce + uri + ?queryString (uriは / から始まる)
        # POST/PUT: nonce + json_body
        
        if method in ["GET", "DELETE"]:
            # クエリパラメータがあれば ? を含めて連結
            full_uri = f"{path}?{query}" if query else path
            message = f"{nonce}{full_uri}"
        else:
            # POST/PUT: nonce + 厳密な JSON 文字列 (空白なし)
            message = f"{nonce}{body_str}"
        
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    @retry_request(max_retries=3)
    def _request(self, method: str, path: str, params: Optional[Dict] = None, body: Optional[Dict] = None) -> Union[Dict, List]:
        """汎用リクエストメソッド (自動リトライ・署名付与)"""
        # レートリミット待機 (1,000msの壁)
        self._wait_for_rate_limit()

        # パラメータがあればクエリ文字列に変換
        query_str = ""
        if params:
            from urllib.parse import urlencode, quote
            # NotebookLM: クエリ文字列のエンコード形式に注意 (quote_via=quote)
            query_str = urlencode(params)
            
        url = self.base_url + path
        if query_str:
            url += f"?{query_str}"
            
        # 最重要: separators=(',', ':') で空白を完全に除去 (20006エラー対策)
        body_str = json.dumps(body, separators=(',', ':')) if body else ""
        
        # 13桁（ミリ秒）の Nonce (20004エラー対策)
        nonce = str(int(time.time() * 1000))
        
        # 署名生成 (NotebookLM 仕様に合わせたメッセージ構築)
        signature = self._get_signature(nonce, method, path, query_str, body_str)
        
        # ヘッダー: ハイフン区切りの正確なキー名
        headers = {
            "API-KEY": self.api_key,
            "NONCE": nonce,
            "TIMESTAMP": nonce,  # NONCE と同値を期待
            "SIGNATURE": signature,
            "Content-Type": "application/json"
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

    def get_cfd_positions(self, symbol_id: int = 10) -> List[dict]:
        """保有している建玉（ポジション）の一覧取得 (symbolIdは必須)"""
        return self._request("GET", "/api/v1/cfd/position", params={"symbolId": symbol_id})

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
