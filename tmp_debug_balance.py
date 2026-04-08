import os
import json
import sys
from dotenv import load_dotenv

# Ensure the library is findable
sys.path.append(os.path.join(os.getcwd(), "advanced-trader"))
from lib.rakuten_api import RakutenWalletClient

load_dotenv(".env.production")
client = RakutenWalletClient(os.getenv("WALLET_API_KEY"), os.getenv("WALLET_API_SECRET"))
print(json.dumps(client.get_balance(), indent=2))
