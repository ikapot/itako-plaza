import asyncio
import os
import sys
from dotenv import load_dotenv

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from lib.rakuten_api import RakutenWalletClient

async def main():
    load_dotenv("advanced-trader/.env.all", override=True)
    api_key = os.environ.get("WALLET_API_KEY")
    api_secret = os.environ.get("WALLET_API_SECRET")
    
    if not api_key or not api_secret:
        print("Error: API Keys not found in .env.all")
        return

    print("Starting API Connectivity Test (Balance check)...")
    client = RakutenWalletClient(api_key, api_secret, is_spot=False)
    
    try:
        balance = await client.get_balance()
        print(f"Success! Balance: {balance}")
    except Exception as e:
        print(f"❌ API Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
