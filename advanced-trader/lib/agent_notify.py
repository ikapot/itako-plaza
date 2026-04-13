import sys
import os

# Windows環境での aiodns による DNS解決エラー回避パッチ
sys.modules['aiodns'] = None

import aiohttp
import aiohttp.resolver
import asyncio
from dotenv import load_dotenv

# 強制的に ThreadedResolver を使用
aiohttp.resolver.DefaultResolver = aiohttp.resolver.ThreadedResolver

# 設定の読み込み
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.production")
load_dotenv(env_path)

WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "").strip().strip('"')

async def send_notification(message: str, file_path: str = None):
    """Discord Webhookを通じてiPhoneへメッセージを送信する"""
    if not WEBHOOK_URL:
        print("Error: DISCORD_WEBHOOK_URL is not set.")
        return

    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field('content', message)
        
        if file_path and os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                data.add_field('file', f, filename=os.path.basename(file_path))

        async with session.post(WEBHOOK_URL, data=data) as resp:
            if resp.status in [200, 204]:
                # Windowsコンソールでの文字化け(UnicodeEncodeError)を避けるため、表示用のみエンコード可能な文字に制限
                try:
                    print(f"Notification sent: {message[:30]}...")
                except UnicodeEncodeError:
                    print("Notification sent successfully (log contains unencodable characters)")
            else:
                print(f"Failed to send: {resp.status} - {await resp.text()}")

if __name__ == "__main__":
    import sys
    msg = sys.argv[1] if len(sys.argv) > 1 else "AGからの定期連絡です。"
    asyncio.run(send_notification(msg))
