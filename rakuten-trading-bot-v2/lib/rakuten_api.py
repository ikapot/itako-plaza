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
    - 資産取得、レート取得、注文実行をサポート
    """
    def __init__(self):
        self.api_key = os.getenv("WALLET_API_KEY")
        self.api_secret = os.getenv("WALLET_API_SECRET")
        self.base_url = "https://exchange.rakuten-wallet.co.jp"

    def _get_signature(self, nonce, method, path, body=""):
        """
        楽天ウォレット独自の署名ロジック
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
        """現在の価格を取得 (7=BTC/JPY, 10=LTC/JPY)"""
        url = f"{self.base_url}/api/v1/ticker?symbolId={symbol_id}"
        resp = requests.get(url).json()
        if 'error' in resp:
            return resp
        # スプレッド計算用のデータを含めて返す
        # bid, ask, last 等が含まれる
        return resp

    def get_balance(self):
        """保有資産の取得"""
        return self._request("GET", "/api/v1/asset")

    def get_margin_info(self):
        """証拠金および有効証拠金(Equity)の取得"""
        return self._request("GET", "/api/v1/cfd/equitydata")

    def place_order(self, symbol_id, side, amount, order_type="MARKET", price=None):
        """注文実行"""
        body = {
            "symbolId": symbol_id,
            "side": side,
            "amount": float(amount),
            "type": order_type
        }
        if price: body["price"] = float(price)
        return self._request("POST", "/api/v1/cfd/order", body)

    def get_active_orders(self):
        """有効な注文の一覧取得"""
        return self._request("GET", "/api/v1/cfd/activeorder")
