import os
import sys
from dotenv import load_dotenv

# lib ディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
from rakuten_api import RakutenWalletClient

def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env.all"))
    api_key = os.getenv("WALLET_API_KEY")
    api_secret = os.getenv("WALLET_API_SECRET")
    
    if not api_key:
        print("Error: WALLET_API_KEY is not set.")
        return

    # is_spot=True で初期化
    client = RakutenWalletClient(api_key, api_secret, is_spot=True)
    
    # 銘柄一覧の取得
    try:
        symbols = client._request("GET", "/api/v1/symbol")
        print("--- Spot Trading Symbols ---")
        for sym in symbols:
            print(f"ID: {sym['id']} | Pair: {sym['currencyPair']} | MinAmount: {sym['minOrderAmount']}")
    except Exception as e:
        print(f"Error fetching symbols: {e}")

if __name__ == "__main__":
    main()
