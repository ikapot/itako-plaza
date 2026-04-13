import asyncio
import logging
from lib.grid_engine import ZenGridEngine
from lib.rakuten_api import RakutenWalletClient
from lib.rakuten_ws import RakutenWebSocketClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HITL_Sim")

async def simulate():
    # ダミークライアント
    rest = RakutenWalletClient("dummy", "dummy")
    ws = RakutenWebSocketClient()
    
    # エンジン初期化
    engine = ZenGridEngine(rest, ws)
    engine.is_running = True
    
    # 擬似的な価格履歴（急落を演出、偏差が出るように少し揺らす）
    engine.price_history.extend([19900, 20100] * 10) # 平均20000付近だが偏差あり
    engine.last_price = 15000 # 20000から急落 -> Z-scoreは大幅マイナス
    
    logger.info("🎬 Simulation: Faking a market crash to trigger BUY signal...")
    
    # ロジックの実行
    # 注: execute_grid_logic は無限ループなので、バックグラウンドで回す
    task = asyncio.create_task(engine.execute_grid_logic())
    
    await asyncio.sleep(5)
    logger.info("ℹ️ Check your iPhone for the notification.")
    
    # 1分待機してシミュレーション終了
    await asyncio.sleep(60)
    engine.is_running = False
    await task

if __name__ == "__main__":
    asyncio.run(simulate())
