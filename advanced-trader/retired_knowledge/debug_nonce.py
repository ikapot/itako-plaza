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
# API_SECRET = API_SECRET.strip() # 気休め

BASE_URL = "https://exchange.rakuten-wallet.co.jp"
PATH = "/api/v1/cfd/equitydata"

def test_nonce(name, nonce_type):
    print(f"\n--- Testing Nonce: {name} ---")
    if nonce_type == "ms":
        nonce = str(int(time.time() * 1000))
    else:
        nonce = str(int(time.time()))
    
    sig_path = "/v1/cfd/equitydata"
    message = f"{nonce}{sig_path}"
    
    signature = hmac.new(
        API_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest().upper()
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json"
    }

    try:
        url = BASE_URL + PATH
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"  Nonce: {nonce}")
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
    except Exception as e:
        print(f"  Error: {e}")

test_nonce("Milliseconds (13 digits)", "ms")
test_nonce("Seconds (10 digits)", "s")
