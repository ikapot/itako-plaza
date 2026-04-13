import os
import sys
import hmac
import hashlib
import requests
import time
import binascii
from dotenv import load_dotenv

def test_auth():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
    KEY = os.getenv("WALLET_API_KEY")
    SECRET = os.getenv("WALLET_API_SECRET")
    
    if not KEY or not SECRET:
        print("Missing API credentials.")
        return

    path = "/api/v1/asset"
    url = "https://exchange.rakuten-wallet.co.jp" + path
    
    # パターンを定義
    # 1. 署名キー: Secret そのまま vs Binary
    # 2. 署名文字列: nonce + path vs nonce + method + path vs nonce + /v1/path
    
    secrets = [
        ("StringSecret", SECRET.encode()),
        ("BinarySecret", binascii.unhexlify(SECRET))
    ]
    
    # 複数の署名対象文字列パターン
    def get_msgs(nonce, p):
        return [
            ("OriginalPath", nonce + p),                    # nonce + /api/v1/asset
            ("NoApiPath", nonce + p.replace("/api", "")),   # nonce + /v1/asset
            ("NonceMethodPath", nonce + "GET" + p),         # nonce + GET + /api/v1/asset
            ("OnlyNonce", nonce)                            # POST/PUTを想定（パスなし）
        ]

    print(f"--- Ultimate Auth Debug for {path} ---")
    
    for sec_name, sec_key in secrets:
        print(f"\n[Key Type: {sec_name}]")
        for i in range(1): # Try only once to keep it simple, use fresh nonce for each pattern loop
            nonce = str(int(time.time() * 1000))
            for pat_name, msg in get_msgs(nonce, path):
                sig = hmac.new(sec_key, msg.encode(), hashlib.sha256).hexdigest()
                
                # Test headers variations
                headers = [
                    {"API-KEY": KEY, "NONCE": nonce, "SIGNATURE": sig},
                    {"API-KEY": KEY, "NONCE": nonce, "SIGNATURE": sig, "TIMESTAMP": nonce}
                ]
                
                for idx, h in enumerate(headers):
                    try:
                        r = requests.get(url, headers=h, timeout=5)
                        print(f"  Pattern: {pat_name} | HeaderSet: {idx} | Result: {r.status_code} {r.text[:50]}")
                        if r.status_code == 200:
                            print(f"  🌟 FOUND IT! Key: {sec_name}, Msg: {pat_name}, Headers: {idx}")
                            return
                    except Exception as e:
                        print(f"  Error: {e}")
                
                time.sleep(1.2) # Interval

if __name__ == "__main__":
    test_auth()
