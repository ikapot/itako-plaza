import os
import sys
import json
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
from rakuten_api import RakutenWalletClient

def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
    api_key = os.getenv("WALLET_API_KEY")
    api_secret = os.getenv("WALLET_API_SECRET")
    
    if not api_key:
        print("Error: WALLET_API_KEY is not set.")
        return

    client = RakutenWalletClient(api_key, api_secret, is_spot=False)
    
    print("--- Testing Private CFD Endpoint: /api/v1/cfd/equitydata ---")
    try:
        res = client._request("GET", "/api/v1/cfd/equitydata")
        print(f"Success! Result: {json.dumps(res, indent=2)}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()
