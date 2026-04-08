import asyncio
import os
import sys
from dotenv import load_dotenv

# プロジェクトルートをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from consult_bot import ConsultBot

async def main():
    bot = ConsultBot()
    print("--- Itako-Consult-AI 接続テスト開始 ---")
    
    # セッションの初期化
    await bot.setup_hook()
    
    test_message = "現在のシステム構成について教えてください。"
    print(f"送信メッセージ: {test_message}")
    
    response = await bot.get_ai_response(test_message)
    print("\n--- AI 応答 ---")
    print(response)
    print("----------------------------")
    
    # セッションの終了
    await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
