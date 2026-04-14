import os
import sys
import hmac
import hashlib
import requests
import time
import binascii
from dotenv import load_dotenv

def test_final_auth():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
    KEY = os.getenv("WALLET_API_KEY")
    SECRET = os.getenv("WALLET_API_SECRET")
    
    # 13桁ミリ秒 Nonce
    nonce = str(int(time.time() * 1000))
    path = "/api/v1/asset"
    url = "https://exchange.rakuten-wallet.co.jp" + path
    
    # メッセージ: Nonce + Path
    message = nonce + path
    
    print(f"--- Final Binary Auth Test for {path} ---")
    
    try:
        # 重要: シークレットを 16進数からバイナリに変換
        secret_bin = binascii.unhexlify(SECRET)
        
        # 署名生成 (SHA256)
        sig = hmac.new(secret_bin, message.encode(), hashlib.sha256).hexdigest()
        
        headers = {
            "API-KEY": KEY,
            "NONCE": nonce,
            "SIGNATURE": sig
        }
        
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Result: {resp.status_code} | Body: {resp.text}")
        
    except Exception as e:
        print(f"Local Error: {e}")

if __name__ == "__main__":
    test_final_auth()
