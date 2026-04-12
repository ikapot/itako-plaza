import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env.production")
load_dotenv(dotenv_path=env_path)

k = os.getenv("WALLET_API_KEY")
s = os.getenv("WALLET_API_SECRET")

if k:
    print(f"KEY: [{k[:4]}...{k[-4:]}] Len: {len(k)}")
else:
    print("KEY: None")

if s:
    print(f"SEC: [{s[:4]}...{s[-4:]}] Len: {len(s)}")
else:
    print("SEC: None")
