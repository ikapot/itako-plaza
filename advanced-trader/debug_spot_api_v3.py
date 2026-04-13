import os
import sys
import json
import time
import hmac
import hashlib
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
API_KEY = os.getenv("WALLET_API_KEY")
API_SECRET = os.getenv("WALLET_API_SECRET")

def send_request(method, path, msg_pattern):
    nonce = str(int(time.time() * 1000))
    
    # 署名対象文字列の生成パターン
    if msg_pattern == "NONCE_PATH":
        message = nonce + path
    elif msg_pattern == "NONCE_METHOD_PATH":
        message = nonce + method + path
    elif msg_pattern == "NONCE_PATH_QUERY":
        message = nonce + path # queryなし
    elif msg_pattern == "NONCE_METHOD_PATH_NO_API":
        message = nonce + method + path.replace("/api", "")
    else:
        message = nonce + path
        
    sig = hmac.new(API_SECRET.encode(), message.encode(), hashlib.sha256).hexdigest()
    
    url = "https://exchange.rakuten-wallet.co.jp" + path
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": sig,
        "Content-Type": "application/json"
    }
    
    resp = requests.request(method, url, headers=headers, timeout=5)
    return resp.status_code, resp.text, message

def main():
    patterns = ["NONCE_PATH", "NONCE_METHOD_PATH", "NONCE_METHOD_PATH_NO_API"]
    
    print(f"--- Debugging Private Endpoint: /api/v1/asset ---")
    for pat in patterns:
        print(f"Testing Pattern: {pat}")
        status, text, msg = send_request("GET", "/api/v1/asset", pat)
        print(f"  String used: {msg}")
        print(f"  Result: {status} | Body: {text[:100]}")
        if status == 200:
            print(f"  🌟 WINNER! Found the correct pattern: {pat}")
            break
        time.sleep(1.2)

if __name__ == "__main__":
    main()
