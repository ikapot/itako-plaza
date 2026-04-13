import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
from rakuten_api import RakutenWalletClient

def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
    api_key = os.getenv("WALLET_API_KEY")
    api_secret = os.getenv("WALLET_API_SECRET")
    
    client = RakutenWalletClient(api_key, api_secret, is_spot=True)
    
    print("Testing Spot IDs for BTC/JPY...")
    # 典型的な ID (1 から 20 程度) を走査
    for i in range(1, 21):
        try:
            res = client._request("GET", "/api/v1/ticker", params={"symbolId": i})
            if res and "bid" in res:
                print(f"ID: {i} | Response: {res}")
        except:
            continue

if __name__ == "__main__":
    main()
