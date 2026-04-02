from rakuten_wallet_client import RakutenWalletClient
import json

def test_api():
    client = RakutenWalletClient()
    
    print("--- 1. Ticker (パブリックAPI) テスト ---")
    ticker = client.get_ticker(7) # 7 = BTC/JPY
    print(f"BTC/JPY Ticker: {ticker}")
    
    print("\n--- 2. Balance (署名が必要なAPI) テスト ---")
    balance = client.get_balance()
    print(f"Asset Balance: {json.dumps(balance, indent=2, ensure_ascii=False)}")
    
    if "error" in balance or (isinstance(balance, dict) and balance.get("success") is False):
         print("\n❌ 署名または認証に問題がある可能性があります。")
    else:
         print("\n✅ 署名認証に成功しました！")

if __name__ == "__main__":
    test_api()
