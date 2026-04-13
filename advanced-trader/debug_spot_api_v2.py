import os
import sys
import json
import time
import hmac
import hashlib
import requests
from dotenv import load_dotenv

# 設定の読み込み
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
API_KEY = os.getenv("WALLET_API_KEY")
API_SECRET = os.getenv("WALLET_API_SECRET")

def get_signature(secret, nonce, path, query=""):
    message = f"{nonce}{path}"
    if query:
        message += f"?{query}"
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()

def test_request(host, path_for_url, path_for_sig):
    nonce = str(int(time.time() * 1000))
    sig = get_signature(API_SECRET, nonce, path_for_sig)
    
    url = host + path_for_url
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": sig,
        "Content-Type": "application/json"
    }
    
    print(f"Testing: URL={url} | SigPath={path_for_sig}")
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"  Result: {resp.status_code} | Body: {resp.text[:100]}")
        return resp.status_code == 200
    except Exception as e:
        print(f"  Error: {e}")
        return False

def main():
    hosts = [
        "https://api.rakuten-wallet.co.jp",
        "https://exchange.rakuten-wallet.co.jp"
    ]
    
    paths = [
        "/api/v1/asset",
        "/v1/asset",
        "/api/v1/cfd/symbol" # CFD用
    ]
    
    for host in hosts:
        print(f"\n--- Host: {host} ---")
        for p in paths:
            # パターンA: URLパスと署名パスが同じ
            test_request(host, p, p)
            # パターンB: 署名パスから /api を除く
            if p.startswith("/api"):
                test_request(host, p, p.replace("/api", ""))
            time.sleep(1.1) # 間隔をあける

if __name__ == "__main__":
    main()
