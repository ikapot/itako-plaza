import os
import logging
from dotenv import load_dotenv
from lib.rakuten_api import RakutenWalletClient

# ロギング設定 (詳細デバッグ)
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("DebugConnV5")

def main():
    # .env.all or .env から読み込み
    load_dotenv(".env.all")
    api_key = os.environ.get("WALLET_API_KEY")
    api_secret = os.environ.get("WALLET_API_SECRET")

    if not api_key or not api_secret:
        logger.error("❌ WALLET_API_KEY または WALLET_API_SECRET が設定されていません。")
        return

    logger.info("🚀 楽天ウォレット API 接続テスト (V5) を開始します...")
    
    # 1. 現物 (Spot) のテスト
    logger.info("\n--- [SPOT] BTC/JPY Ticker test ---")
    spot_client = RakutenWalletClient(api_key, api_secret, is_spot=True)
    try:
        ticker = spot_client.get_ticker(symbol_id=7)
        logger.info(f"✅ Spot Ticker Success: {ticker}")
    except Exception as e:
        logger.error(f"❌ Spot Ticker Error: {e}")

    logger.info("\n--- [SPOT] Asset list test ---")
    try:
        assets = spot_client.get_balance()
        logger.info(f"✅ Spot Asset Success: {assets}")
    except Exception as e:
        logger.error(f"❌ Spot Asset Error: {e}")

    # 2. 証拠金 (CFD) のテスト
    logger.info("\n--- [CFD] Equity data test ---")
    cfd_client = RakutenWalletClient(api_key, api_secret, is_spot=False)
    try:
        equity = cfd_client.get_margin_info()
        logger.info(f"✅ CFD Equity Success: {equity}")
    except Exception as e:
        logger.error(f"❌ CFD Equity Error: {e}")

if __name__ == "__main__":
    main()
