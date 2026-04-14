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
    # 成功パターンと同様に .env.all を明示的に読み込む
    load_dotenv("advanced-trader/.env.all", override=True)
    api_key = os.environ.get("WALLET_API_KEY")
    api_secret = os.environ.get("WALLET_API_SECRET")
    dry_run = os.environ.get("DRY_RUN", "true").lower() == "true"

    if not api_key or not api_secret:
        logger.error("API or Secret key not found.")
        return

    logger.info(f"Zen-LTC-Quant V2.5 [AI-Integrated] Starting... (DRY_RUN={dry_run})")
    
    # クライアントの初期化 (CFD)
    rest_client = RakutenWalletClient(api_key, api_secret, is_spot=False)
    ws_client = RakutenWebSocketClient(symbol_id=10)
    engine = ZenGridEngine(rest_client, ws_client)
    
    tasks = [
        engine.start(),
        engine.execute_grid_logic(),
        ws_client.connect()
    ]
    
    try:
        # 非同期ループが完全に回るまで僅かに待機
        await asyncio.sleep(1)
        
        # 初期バランスの確認
        balance = await rest_client.get_balance()
        logger.info(f"Current Balance: {balance}")
        
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("🛑 Stopping trader...")
        engine.is_running = False
        ws_client.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        logger.info("Finished.")

if __name__ == "__main__":
    asyncio.run(main())
