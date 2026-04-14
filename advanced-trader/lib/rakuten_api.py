import requests
import hmac
import hashlib
import time
import json
import logging
import asyncio
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
        self._lock = asyncio.Lock()    # 追加：非同期排他制御
        self.time_offset = 0.0         # サーバーとの時刻ズレ補正
        
        # 初期化時に時刻補正を実行
        self._calibrate_time()

    def _calibrate_time(self):
        """サーバーの Date ヘッダーから時刻ズレを計算して補正する"""
        try:
            # 認証不要な GET または HEAD で Date ヘッダーを取得
            resp = requests.head(self.base_url, timeout=5)
            server_date_str = resp.headers.get('Date')
            if server_date_str:
                from email.utils import parsedate_to_datetime
                server_time = parsedate_to_datetime(server_date_str).timestamp()
                local_time = time.time()
                self.time_offset = server_time - local_time
                logger.info(f"Time calibrated. Offset: {self.time_offset:.3f}s")
        except Exception as e:
            logger.warning(f"Time calibration failed: {e}. Using local time.")

    async def _wait_for_rate_limit(self):
        """1,000ms (1秒) のリクエスト間隔を確保する (2024年11月改定対応)"""
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_request_time
            if elapsed < self._min_interval:
                wait_time = self._min_interval - elapsed
                logger.debug(f"Rate Limit Guard: Waiting {wait_time:.3f}s...")
                await asyncio.sleep(wait_time)
            self._last_request_time = time.time()

    def _get_signature(self, nonce: str, method: str, path: str, query: str = "", body_str: str = "") -> str:
        """署名の生成 (HMAC-SHA256) - 最終修正版: unhexlify シークレット & Nonce+URI"""
        import binascii
        
        if method in ["GET", "DELETE"]:
            full_uri = f"{path}?{query}" if query else path
            message = f"{nonce}{full_uri}"
        else:
            # POST/PUT の場合も path を含める仕様に合わせる (nonce + path + body)
            message = f"{nonce}{path}{body_str}"
        
        try:
            secret_bin = binascii.unhexlify(self.api_secret)
        except Exception:
            # 万が一 hex でない場合はフォールバック
            secret_bin = self.api_secret.encode('utf-8')
            
        return hmac.new(
            secret_bin,
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    async def _request(self, method: str, path: str, params: Optional[Dict] = None, body: Optional[Dict] = None) -> Union[Dict, List]:
        """非同期リクエストメソッド (自動レート制限・署名付与)"""
        await self._wait_for_rate_limit()

        query_str = ""
        if params:
            from urllib.parse import urlencode
            query_str = urlencode(params)
            
        url = self.base_url + path
        if query_str:
            url += f"?{query_str}"
            
        body_str = json.dumps(body, separators=(',', ':')) if body else ""
        # 補正済みのタイムスタンプで Nonce を生成
        nonce = str(int((time.time() + self.time_offset) * 1000))
        signature = self._get_signature(nonce, method, path, query_str, body_str)
        
        headers = {
            "API-KEY": self.api_key,
            "NONCE": nonce,
            "SIGNATURE": signature,
            "Content-Type": "application/json"
        }
        
        # 外部リクエスト自体はブロッキングだが、asyncio.to_thread を使うことも検討可能
        # ここではシンプルに sleep のみを非同期化
        resp = self.session.request(method, url, headers=headers, params=params, data=body_str, timeout=self.timeout)
        
        if resp.status_code != 200:
            error_msg = f"HTTP {resp.status_code} {resp.reason} for {path}"
            try:
                error_msg += f" | Response: {resp.json()}"
            except:
                pass
            logger.error(f"API Error: {error_msg}")
            raise Exception(error_msg)
            
        return resp.json()

    # --- Wrapper Methods ---
    async def get_balance(self):
        return await self._request("GET", "/api/v1/asset")

    async def get_margin_info(self):
        return await self._request("GET", "/api/v1/cfd/equitydata")

    async def get_cfd_positions(self, symbol_id: int = 10):
        return await self._request("GET", "/api/v1/cfd/position", params={"symbolId": symbol_id})

    async def place_cfd_order(self, symbol_id: int, side: str, amount: float, order_type: str = "MARKET", behavior: str = "NEW"):
        body = {
            "symbolId": symbol_id,
            "orderPattern": "NORMAL",
            "orderData": {
                "orderBehavior": behavior,
                "orderSide": side,
                "orderType": order_type,
                "amount": float(amount),
                "leverage": 2.0,
                "closeBehavior": "FIFO"
            }
        }
        return await self._request("POST", "/api/v1/cfd/order", body=body)

    async def get_ticker(self, symbol_id: int = 10):
        return await self._request("GET", "/api/v1/ticker", params={"symbolId": symbol_id})

    async def get_spot_balance(self) -> dict:
        """現物残高（JPY, BTC）を辞書で取得"""
        try:
            res = await self.get_balance()
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

    async def get_btc_balance(self) -> float:
        """現在のビットコイン保有量（現物・証拠金合算）を取得"""
        res = await self.get_spot_balance()
        return res.get("BTC", 0.0)

    async def place_order(self, symbol_id: int, side: str, amount: float, order_type: str = "MARKET", price: float = None) -> dict:
        """現物注文実行 (/api/v1/order)"""
        body = {
            "symbolId": symbol_id,
            "side": side,
            "amount": float(amount),
            "type": order_type
        }
        if price:
            body["price"] = float(price)
            
        return await self._request("POST", "/api/v1/order", body=body)

    async def get_active_orders(self) -> dict:
        """現物の有効な注文の一覧取得"""
        return await self._request("GET", "/api/v1/activeorder")
