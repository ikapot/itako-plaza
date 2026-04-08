import requests
import hmac
import hashlib
import time
import json
import os
import logging

# --- Logger 設定 ---
logger = logging.getLogger("RakutenWallet")

class RakutenWalletClient:
    """
    楽天ウォレット(証拠金取引) API クライアント
    """
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://exchange.rakuten-wallet.co.jp"
        self.session = requests.Session()
        self.timeout = 10

    def _get_signature(self, nonce: str, method: str, path: str, body: str = "") -> str:
        """署名生成 (HMAC-SHA256)"""
        if not self.api_secret:
            return ""
        # 楽天ウォレットの仕様: nonce + path (GET) または nonce + body (POST)
        message = f"{nonce}{path}" if method in ["GET", "DELETE"] else f"{nonce}{body}"
        return hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest().upper()

    def _request(self, method: str, path: str, body: dict = None) -> dict:
        """汎用リクエストメソッド"""
        url = self.base_url + path
        body_str = json.dumps(body, separators=(',', ':')) if body else ""
        nonce = str(int(time.time() * 1000))
        
        headers = {
            "API-KEY": self.api_key or "",
            "NONCE": nonce,
            "SIGNATURE": self._get_signature(nonce, method, path, body_str),
            "Content-Type": "application/json"
        }
        
        try:
            resp = self.session.request(
                method, url, headers=headers, 
                data=body_str if body else None, 
                timeout=self.timeout
            )
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"❌ HTTP Error ({path}): {e.response.text}")
            return {"error": str(e), "status_code": e.response.status_code}
        except Exception as e:
            logger.error(f"❌ API Request Error ({path}): {e}")
            return {"error": str(e)}

    def get_balance(self) -> dict:
        """保有資産(現物・証拠金)の取得"""
        return self._request("GET", "/api/v1/asset")

    def get_margin_info(self) -> dict:
        """有効証拠金(Equity)データの取得"""
        return self._request("GET", "/api/v1/cfd/equitydata")

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
        url = f"{self.base_url}/api/v1/ticker?symbolId={symbol_id}"
        try:
            resp = self.session.get(url, timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"❌ Ticker取得エラー: {e}")
            return {"error": str(e)}

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
