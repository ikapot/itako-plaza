import asyncio
import os
import sys
from dotenv import load_dotenv

# パス修正
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from rakuten_browser_agent.agent import run_status_sequence, llm, Browser, Agent

async def main():
    # 既に修正済みの .env.all を読み込む
    load_dotenv("advanced-trader/.env.all")
    user_id = os.environ.get("RAKUTEN_SEC_USER_ID")
    password = os.environ.get("RAKUTEN_SEC_PASSWORD")

    browser = Browser(headless=True)
    
    # 楽天ウォレットの注文画面を撮影するタスク
    task = f"""
    1. https://exchange.rakuten-wallet.co.jp にアクセス。
    2. ログイン画面が出たら ID: '{user_id}' / PW: '{password}' でログイン。
    3. ログイン後、左上の銘柄選択で 'LTC/JPY' を選ぶ。
    4. 画面全体のスクリーンショットを撮影し、'operation_point.png' というファイル名で保存してください。
    5. 保存が完了したら「スクリーンショット保存完了」と報告。
    """
    
    agent = Agent(task=task, llm=llm, browser=browser)
    
    print("[INFO] Starting capture for Rakuten Wallet (LTC/JPY)...")
    await agent.run()
    print("[SUCCESS] Operation point screenshot saved.")
    await browser.stop()

if __name__ == "__main__":
    asyncio.run(main())
