import os
import hmac
import hashlib
import time
import json
import requests
import binascii
from dotenv import load_dotenv

# .env.all からキーを読み込む
env_path = "advanced-trader/.env.all"
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("WALLET_API_KEY")
API_SECRET = os.getenv("WALLET_API_SECRET")
BASE_URL = "https://exchange.rakuten-wallet.co.jp"
PATH = "/api/v1/cfd/equitydata"

def test_pattern(name, message, secret_bin):
    nonce = str(int(time.time() * 1000))
    msg = message.replace("{nonce}", nonce)
    
    signature = hmac.new(
        secret_bin,
        msg.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json"
    }

    try:
        url = BASE_URL + PATH
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"[{name}] -> Status: {resp.status_code}, Body: {resp.text}")
        if resp.status_code == 200 or '"code":20006' in resp.text:
             print("  ✅ SUCCESS PATTERN FOUND!")
             return True
    except Exception as e:
        print(f"  Error: {e}")
    return False

if __name__ == "__main__":
    if not API_KEY or not API_SECRET:
        print("Keys not found in .env.all")
        exit()

    # Try different secret encodings
    secret_utf8 = API_SECRET.encode('utf-8')
    try:
        secret_hex = binascii.unhexlify(API_SECRET)
    except:
        secret_hex = None

    patterns = [
        "{nonce}/api/v1/cfd/equitydata",
        "{nonce}/v1/cfd/equitydata",
        "{nonce}/api/v1/asset",
    ]

    print(f"Testing with API_KEY: {API_KEY[:5]}...")
    
    for p in patterns:
        print(f"\n--- Pattern: {p} ---")
        test_pattern("UTF-8 Secret", p, secret_utf8)
        if secret_hex:
            test_pattern("Hex-Decoded Secret", p, secret_hex)

    # また、nonce を秒にしてみる
    print("\n--- Nonce as seconds test ---")
    nonce_sec = str(int(time.time()))
    test_pattern("Seconds + UTF8", patterns[0].replace("{nonce}", nonce_sec), secret_utf8)
    if secret_hex:
        test_pattern("Seconds + Hex", patterns[0].replace("{nonce}", nonce_sec), secret_hex)
