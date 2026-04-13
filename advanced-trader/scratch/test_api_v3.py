import os
import sys
import logging
import time

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from lib.rakuten_api import RakutenWalletClient
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("TestV3")

def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.all'))
    
    API_KEY = os.getenv("WALLET_API_KEY")
    API_SECRET = os.getenv("WALLET_API_SECRET")
    
    if not API_KEY or not API_SECRET:
        logger.error("❌ API_KEY or API_SECRET is missing in .env.all")
        return

    logger.info("🚀 Starting API V3 Test (NotebookLM refined logic)...")
    
    # 証拠金取引(CFD)用クライアントを初期化
    client = RakutenWalletClient(API_KEY, API_SECRET, is_spot=False)
    
    try:
        # 1. 資産残高取得 (GET)
        logger.info("📡 1. Fetching Balance (GET /api/v1/asset)...")
        balance = client.get_balance()
        logger.info(f"✅ Success: {balance}")
        
        # 2. Ticker取得 (GET with Query)
        logger.info("📡 2. Fetching LTC Ticker (GET /api/v1/ticker?symbolId=10)...")
        # レートリミッターを効かせるため連続で呼ぶ
        ticker = client.get_ticker(symbol_id=10)
        logger.info(f"✅ Success: {ticker}")
        
        logger.info("✨ API V3 Authentication Test: ALL PASSED")
        
    except Exception as e:
        logger.error(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    main()
