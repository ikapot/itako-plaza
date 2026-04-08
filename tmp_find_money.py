import os, sys
sys.path.append(os.path.join(os.getcwd(), "advanced-trader"))
from lib.rakuten_api import RakutenWalletClient
from dotenv import load_dotenv

load_dotenv(".env.production")
client = RakutenWalletClient(os.getenv("WALLET_API_KEY"), os.getenv("WALLET_API_SECRET"))
res = client.get_balance()
if isinstance(res, list):
    for a in res:
        if float(a.get("onhandAmount", 0)) > 0:
            print(f"FOUND ASSET: {a}")
else:
    print(f"NOT A LIST: {res}")
