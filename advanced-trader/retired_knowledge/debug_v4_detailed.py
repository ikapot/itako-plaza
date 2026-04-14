import os
import hmac
import hashlib
import time
import json
import requests
from dotenv import load_dotenv

# 環境変数の読み込みと正規化
load_dotenv(dotenv_path=".env.production")

def clean_var(name):
    val = os.getenv(name)
    return val.replace('"', '').replace("'", "").strip() if val else None

API_KEY = clean_var("WALLET_API_KEY")
API_SECRET = clean_var("WALLET_API_SECRET")
API_ID = clean_var("RAKUTEN_API_ID")
BASE_URL = "https://exchange.rakuten-wallet.co.jp"

print(f"--- 🛠️  Detailed Debug Session Started ---")
print(f"API_KEY: [{API_KEY[:4]}...{API_KEY[-4:]}]")
print(f"RAKUTEN_API_ID: [{API_ID}]")

def call_api_detailed(endpoint, method="GET", include_api_id_header=None):
    nonce = str(int(time.time() * 1000))
    # 署名用パス (/apiを除外する成功パターンを使用)
    sig_path = endpoint.replace("/api", "", 1) if endpoint.startswith("/api") else endpoint
    message = f"{nonce}{sig_path}"
    
    signature = hmac.new(
        API_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest() # Lowercase hexdigest
    
    headers = {
        "API-KEY": API_KEY,
        "NONCE": nonce,
        "SIGNATURE": signature,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (AI Trading Agent; Antigravity v4)"
    }
    
    if include_api_id_header:
        headers[include_api_id_header] = API_ID

    print(f"\n📡 Request: {method} {endpoint}")
    print(f"  👉 Headers To Send: { {k: v for k, v in headers.items() if k != 'SIGNATURE'} }")
    print(f"  👉 Signing Message: [{message}]")
    
    try:
        url = BASE_URL + endpoint
        resp = requests.request(method, url, headers=headers, timeout=15)
        
        print(f"  📥 Response Status: {resp.status_code}")
        print(f"  📥 Response Headers: {json.dumps(dict(resp.headers), indent=2)}")
        print(f"  📥 Response Body: {resp.text}")
        
        return resp
    except Exception as e:
        print(f"  🔥 Error: {e}")
        return None

# --- 1. 現物口座 (Spot) のチェック ---
print("\n--- [Phase 1: checking Spot Assets] ---")
spot_resp = call_api_detailed("/api/v1/asset")

# --- 2. 証拠金口座 (CFD) のチェック (ヘッダーなし) ---
print("\n--- [Phase 2: checking CFD Equity (Standard)] ---")
cfd_resp_std = call_api_detailed("/api/v1/cfd/equitydata")

# --- 3. 証拠金口座 (CFD) のチェック (API-IDヘッダーあり) ---
print("\n--- [Phase 3: checking CFD Equity (with API-ID header)] ---")
cfd_resp_id = call_api_detailed("/api/v1/cfd/equitydata", include_api_id_header="API-ID")

# --- 4. 証拠金口座 (CFD) のチェック (RAKUTEN-API-IDヘッダーあり) ---
print("\n--- [Phase 4: checking CFD Equity (with RAKUTEN-API-ID header)] ---")
cfd_resp_rakuten_id = call_api_detailed("/api/v1/cfd/equitydata", include_api_id_header="RAKUTEN-API-ID")
