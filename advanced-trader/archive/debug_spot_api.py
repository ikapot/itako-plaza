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
    
    # URL 1: exchange... (Current CFD host)
    # URL 2: api... (Suspected Spot host)
    
    hosts = {
        "EXCHANGE": "https://exchange.rakuten-wallet.co.jp",
        "API": "https://api.rakuten-wallet.co.jp"
    }
    
    for name, host in hosts.items():
        print(f"\n--- Testing Host: {name} ({host}) ---")
        client = RakutenWalletClient(api_key, api_secret)
        client.base_url = host
        
        # Test Asset
        try:
            res = client._request("GET", "/api/v1/asset")
            print(f"  [PASS] /api/v1/asset: Found {len(res)} assets")
        except Exception as e:
            print(f"  [FAIL] /api/v1/asset: {e}")
            
        # Test Ticker
        try:
            # TRY IDs 1, 7, 10
            for i in [1, 7, 10]:
                try:
                    res = client._request("GET", "/api/v1/ticker", params={"symbolId": i})
                    print(f"  [PASS] /api/v1/ticker?symbolId={i}: {res}")
                except:
                    continue
        except Exception as e:
            pass

if __name__ == "__main__":
    main()
