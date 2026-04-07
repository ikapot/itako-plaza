# rakuten-browser-agent/test_launch.py
import asyncio
from agent import run_trading_sequence

if __name__ == "__main__":
    print("📺 ヘッドフルモードでテストを開始します（ブラウザが立ち上がります）...")
    asyncio.run(run_trading_sequence(headless=False))
