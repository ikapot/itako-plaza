import requests
import hmac
import hashlib
import time
import json
import os
from dotenv import load_dotenv

load_dotenv()

class RakutenWalletClient:
    """
    楽天ウォレット(証拠金取引) API クライアント
    - 公式REST APIを使用した資産取得・注文実行
    """
    def __init__(self):
        self.api_key = os.getenv("WALLET_API_KEY")
        self.api_secret = os.getenv("WALLET_API_SECRET")
        self.base_url = "https://exchange.rakuten-wallet.co.jp"

    def _get_signature(self, nonce, method, path, body=""):
        """
        楽天ウォレット独自の署名ロジック
        - POST時はパスを含めず、NONCEとBODYのみで署名
        """
        message = f"{nonce}{path}" if method in ["GET", "DELETE"] else f"{nonce}{body}"
        return hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

    def _request(self, method, path, body=None):
        """共通リクエストメソッド"""
        url = self.base_url + path
        body_str = json.dumps(body, separators=(',', ':')) if body else ""
        nonce = str(int(time.time() * 1000))
        
        headers = {
            "API-KEY": self.api_key,
            "NONCE": nonce,
            "SIGNATURE": self._get_signature(nonce, method, path, body_str),
            "Content-Type": "application/json"
        }
        
        try:
            resp = requests.request(method, url, headers=headers, data=body_str if body else None)
            return resp.json()
        except Exception as e:
            return {"error": str(e)}

    def get_ticker(self, symbol_id=7):
        """現在の価格を取得 (7=BTC/JPY)"""
        # TickerはパブリックAPIなので署名不要
        url = f"{self.base_url}/api/v1/ticker?symbolId={symbol_id}"
        return requests.get(url).json()

    def get_balance(self):
        """保有資産の取得"""
        return self._request("GET", "/api/v1/asset")

    def get_margin_info(self):
        """証拠金情報の取得"""
        return self._request("GET", "/api/v1/cfd/equitydata")

    def place_order(self, symbol_id, side, amount, price=None):
        """注文実行 (MARKET or LIMIT)"""
        body = {
            "symbolId": symbol_id,
            "side": side,
            "amount": amount,
            "type": "MARKET" if price is None else "LIMIT"
        }
        if price: body["price"] = price
        return self._request("POST", "/api/v1/cfd/order", body)
