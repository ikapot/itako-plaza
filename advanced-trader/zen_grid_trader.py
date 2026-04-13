import asyncio
import os
import logging
from dotenv import load_dotenv
from lib.rakuten_api import RakutenWalletClient
from lib.rakuten_ws import RakutenWebSocketClient
from lib.grid_engine import ZenGridEngine

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("ZenGridTrader")

async def main():
    # 環境変数の読み込み (強制的に上書き)
    load_dotenv("advanced-trader/.env.all", override=True)
    api_key = os.environ.get("WALLET_API_KEY")
    api_secret = os.environ.get("WALLET_API_SECRET")
    dry_run = os.environ.get("DRY_RUN", "true").lower() == "true"

    if not api_key or not api_secret:
        logger.error("❌ APIキーが設定されていません。")
        return

    logger.info(f"🚀 Zen-LTC-Quant V2 Starting... (DRY_RUN={dry_run})")
    
    # クライアントの初期化 (CFD)
    rest_client = RakutenWalletClient(api_key, api_secret, is_spot=False)
    ws_client = RakutenWebSocketClient()
    
    # エンジンの初期化 (V2)
    engine = ZenGridEngine(rest_client, ws_client)
    
    # 実行タスクのリスト
    tasks = [
        engine.start(),
        engine.execute_grid_logic()
    ]
    
    try:
        # 初期バランスの確認 (テストを兼ねて)
        balance = await rest_client.get_balance()
        logger.info(f"💰 Current Balance: {balance}")
        
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("🛑 Stopping trader...")
        engine.is_running = False
        ws_client.stop()
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
    finally:
        logger.info("🏁 Finished.")

if __name__ == "__main__":
    asyncio.run(main())
