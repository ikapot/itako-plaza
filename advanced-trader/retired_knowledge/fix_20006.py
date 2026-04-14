import os
import hmac
import hashlib
import time
import requests
import json
import binascii
from dotenv import load_dotenv

load_dotenv("advanced-trader/.env.all")
API_KEY = os.getenv("WALLET_API_KEY")
API_SECRET = os.getenv("WALLET_API_SECRET")
API_ID = os.getenv("RAKUTEN_API_ID")
BASE_URL = "https://exchange.rakuten-wallet.co.jp"
ENDPOINT = "/api/v1/cfd/equitydata"

def test(header_name):
    nonce = str(int(time.time() * 1000))
    # SUCCESS_LOG suggests we use /api/v1/... for signing
    message = f"{nonce}{ENDPOINT}"
    
    secret_bin = binascii.unhexlify(API_SECRET)
    signature = hmac.new(secret_bin, message.encode('utf-8'), hashlib.sha256).hexdigest()
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json"
    }
    if header_name:
        headers[header_name] = API_ID
        
    print(f"Testing with header: {header_name}")
    resp = requests.get(BASE_URL + ENDPOINT, headers=headers)
    print(f"  Result: {resp.status_code} | Body: {resp.text}")
    return resp.status_code == 200

if __name__ == "__main__":
    test(None)
    test("API-ID")
    test("RAKUTEN-API-ID")
