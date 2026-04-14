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

# Auto-calibrate time drift (HEAD request)
def get_offset():
    resp = requests.head(BASE_URL, timeout=5)
    from email.utils import parsedate_to_datetime
    server_time = parsedate_to_datetime(resp.headers.get('Date')).timestamp()
    return server_time - time.time()

OFFSET = get_offset()
print(f"Calibrated Offset: {OFFSET:.3f}s")

def test(name, path_for_signing, header_name):
    nonce = str(int((time.time() + OFFSET) * 1000))
    message = f"{nonce}{path_for_signing}"
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
        
    resp = requests.get(BASE_URL + ENDPOINT, headers=headers)
    print(f"[{name}] (Header: {header_name}) -> Status: {resp.status_code}, Body: {resp.text}")

if __name__ == "__main__":
    # Test Path with /api
    test("Full Path", "/api/v1/cfd/equitydata", None)
    test("Full Path", "/api/v1/cfd/equitydata", "RAKUTEN-API-ID")
    test("Full Path", "/api/v1/cfd/equitydata", "API-ID")
    
    # Test Path without /api
    test("Stripped Path", "/v1/cfd/equitydata", None)
    test("Stripped Path", "/v1/cfd/equitydata", "RAKUTEN-API-ID")
    test("Stripped Path", "/v1/cfd/equitydata", "API-ID")
