import os
import hmac
import hashlib
import time
import json
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env.production")
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("WALLET_API_KEY")
API_SECRET = os.getenv("WALLET_API_SECRET")
BASE_URL = "https://exchange.rakuten-wallet.co.jp"
PATH = "/api/v1/cfd/equitydata"

def test_pattern(name, message):
    print(f"\n--- Testing: {name} ---")
    nonce = str(int(time.time() * 1000))
    msg = message.replace("{nonce}", nonce)
    print(f"  Message: [{msg}]")
    
    signature = hmac.new(
        API_SECRET.encode('utf-8'),
        msg.encode('utf-8'),
        hashlib.sha256
    ).hexdigest() # Lowercase by default
    
    print(f"  Signature (Lower): {signature}")
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json"
    }

    try:
        url = BASE_URL + PATH
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        if '"code":20006' in resp.text:
            print("  ✅ SUCCESS (Signature Correct!)")
    except Exception as e:
        print(f"  Error: {e}")

# api/trade.js のロジックを模倣: nonce + /api/v1/... (lowercase)
test_pattern("api/trade.js logic (Full path + Lower)", "{nonce}/api/v1/cfd/equitydata")
# 前回の成功報告ロジック: nonce + /v1/... (lowercase)
test_pattern("Last session fix (No /api + Lower)", "{nonce}/v1/cfd/equitydata")
