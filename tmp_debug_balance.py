import os
import json
import sys
from dotenv import load_dotenv

# Ensure the library is findable
sys.path.append(os.path.join(os.getcwd(), "advanced-trader"))
from lib.rakuten_api import RakutenWalletClient

load_dotenv(".env.production")
client = RakutenWalletClient(os.getenv("WALLET_API_KEY"), os.getenv("WALLET_API_SECRET"))

print("--- RAW API RESPONSE (get_balance) ---")
res = client.get_balance()
print(json.dumps(res, indent=2))

print("\n--- RAW API RESPONSE (get_margin_info) ---")
try:
    m = client.get_margin_info()
    print(json.dumps(m, indent=2))
except:
    print("Could not get margin info.")
