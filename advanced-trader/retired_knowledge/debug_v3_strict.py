import os
import hmac
import hashlib
import time
import json
import requests
from dotenv import load_dotenv

# 極限洗浄ロジック
env_path = os.path.join(os.path.dirname(__file__), ".env.production")
load_dotenv(dotenv_path=env_path)

def clean_var(name):
    val = os.getenv(name)
    if val:
        # 引用符の除去と空白・改行の完全排除
        return val.replace('"', '').replace("'", "").strip()
    return None

API_KEY = clean_var("WALLET_API_KEY")
API_SECRET = clean_var("WALLET_API_SECRET")
API_ID = clean_var("RAKUTEN_API_ID")
BASE_URL = "https://exchange.rakuten-wallet.co.jp"

print(f"--- Secret Integrity Check ---")
print(f"SECRET: [{API_SECRET[:4]}...{API_SECRET[-4:]}] Len: {len(API_SECRET)}")
if "\r" in API_SECRET or "\n" in API_SECRET:
    print("⚠️ WARNING: Newline detected in SECRET!")

def test_sig_v3(name, uri_pattern, use_upper=True):
    print(f"\nTesting: {name}")
    nonce = str(int(time.time() * 1000))
    
    # ユーザー指摘の GET 形式: NONCE + URI + QueryString
    # 今回はクエリなしの equitydata でテスト
    message = f"{nonce}{uri_pattern}"
    
    signature = hmac.new(
        API_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    if use_upper:
        signature = signature.upper()
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json"
    }

    try:
        # 実際のリクエストパスは常にフル
        full_path = "/api/v1/cfd/equitydata"
        url = BASE_URL + full_path
        resp = requests.get(url, headers=headers, timeout=10)
        
        print(f"  Msg: [{message}]")
        print(f"  Sig: {signature}")
        print(f"  Result: {resp.status_code} - {resp.text}")
        
        if '"code":20006' in resp.text:
            print("  🌟 WINNER: SIGNATURE ACCEPTED (20006)")
            return True
        return False
    except Exception as e:
        print(f"  Error: {e}")
        return False

# 全パターン網羅
patterns = [
    ("/v1/cfd/equitydata", True),   # 1. No /api, Upper
    ("/v1/cfd/equitydata", False),  # 2. No /api, Lower
    ("/api/v1/cfd/equitydata", True), # 3. Full /api, Upper
    ("/api/v1/cfd/equitydata", False), # 4. Full /api, Lower
    ("v1/cfd/equitydata", True),    # 5. Starting with v (No /), Upper
]

for uri, upper in patterns:
    label = f"URI={uri}, Case={'Upper' if upper else 'Lower'}"
    if test_sig_v3(label, uri, upper):
        break
