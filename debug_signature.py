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
API_SECRET_HEX = os.getenv("WALLET_API_SECRET")
API_ID = os.getenv("RAKUTEN_API_ID")
BASE_URL = "https://exchange.rakuten-wallet.co.jp"
PATH = "/api/v1/cfd/equitydata"

print(f"Debug: API_KEY length={len(API_KEY) if API_KEY else 0}")
print(f"Debug: API_SECRET length={len(API_SECRET_HEX) if API_SECRET_HEX else 0}")

def test_signature(pattern_name, secret_as_bytes=False, remove_api=True, use_upper=True, include_api_id=False):
    print(f"\n--- Testing Pattern: {pattern_name} ---")
    nonce = str(int(time.time() * 1000))
    
    sig_path = PATH
    if remove_api and sig_path.startswith("/api"):
        sig_path = sig_path.replace("/api", "", 1)
    
    message = f"{nonce}{sig_path}"
    print(f"  Signing Message: [{message}]")
    
    # Secret handling
    if secret_as_bytes:
        secret = bytes.fromhex(API_SECRET_HEX)
    else:
        secret = API_SECRET_HEX.encode('utf-8')
    
    signature = hmac.new(
        secret,
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    if use_upper:
        signature = signature.upper()
    
    print(f"  Signature: {signature}")
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json"
    }
    if include_api_id:
        headers["API-ID"] = API_ID

    try:
        url = BASE_URL + PATH
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        if '"code":20006' in resp.text:
            print("  ✅ SIGNATURE OK (20006 found)")
            return True
        return False
    except Exception as e:
        print(f"  🔥 Error: {e}")
        return False

# テスト実行
test_signature("Literal Secret (Current)", secret_as_bytes=False, remove_api=True, use_upper=True)
test_signature("Decoded Secret (Bytes)", secret_as_bytes=True, remove_api=True, use_upper=True)
test_signature("Literal + Lower", secret_as_bytes=False, remove_api=True, use_upper=False)
test_signature("Literal + Path Including /api", secret_as_bytes=False, remove_api=False, use_upper=True)
test_signature("Literal + API-ID Header", secret_as_bytes=False, remove_api=True, use_upper=True, include_api_id=True)
