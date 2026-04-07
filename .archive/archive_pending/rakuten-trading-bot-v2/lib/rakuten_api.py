import requests
import hmac
import hashlib
import time
import json
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class RakutenWalletClient:
    """
    楽天ウォレット(証拠金取引) API クライアント
    - セッションを保持し、接続効率を最適化
    """
    def __init__(self):
        self.api_key = os.getenv("WALLET_API_KEY")
        self.api_secret = os.getenv("WALLET_API_SECRET")
        self.base_url = "https://exchange.rakuten-wallet.co.jp"
        self.session = requests.Session()
        self.timeout = 10

    def _get_signature(self, nonce, method, path, body=""):
        """署名ロジック"""
        if not self.api_secret:
            logger.error("❌ WALLET_API_SECRET が設定されていません。")
            return ""
        message = f"{nonce}{path}" if method in ["GET", "DELETE"] else f"{nonce}{body}"
        return hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

    def _request(self, method, path, body=None):
        """共通リダイレクト・認証リクエスト"""
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

    def get_ticker(self, symbol_id=7):
        """現在の価格を取得 (7=BTC/JPY)"""
        url = f"{self.base_url}/api/v1/ticker?symbolId={symbol_id}"
        try:
            resp = self.session.get(url, timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"❌ Ticker取得エラー: {e}")
            return {"error": str(e)}

    def get_balance(self):
        """保有資産の取得"""
        return self._request("GET", "/api/v1/asset")

    def get_btc_balance(self) -> float:
        """現在のビットコイン保有量を数値で取得 (冪等性チェック用)"""
        try:
            res = self.get_balance()
            if not res or "assets" not in res:
                return 0.0
            for asset in res["assets"]:
                # 証拠金取引(CFD)か現物かでキーが異なる場合があるため柔軟に対応
                if asset.get("asset") == "BTC":
                    return float(asset.get("amount", 0))
            return 0.0
        except Exception as e:
            logger.error(f"❌ BTC残高取得失敗: {e}")
            return 0.0

    def get_margin_info(self):
        """有効証拠金(Equity)の取得"""
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
