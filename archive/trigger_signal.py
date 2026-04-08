import os
import glob
from dotenv import load_dotenv
from lib.utils import send_discord

def trigger_signal():
    # .env.production をロード
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
    print(f"🔍 ロード対象: {env_path}")
    load_dotenv(dotenv_path=env_path)

    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    
    if not webhook_url:
        print("❌ DISCORD_WEBHOOK_URL が見つかりません。")
        return

    title = "🤝 プロトコル・インテグレーション"
    content = (
        "**🚀 [Itako Plaza] クオンツ・トレード・エンジン準備完了**\n\n"
        "模擬取引 (DRY RUN) および Discord 通知の統合に成功しました。\n"
        "これより、市場監視プロトコルをバックグラウンドで開始可能です。"
    )
    
    print(f"📡 Discord に合図を送信中... (URL末尾: ..{webhook_url[-10:] if webhook_url else 'None'})")
    res = send_discord(webhook_url, title, content, 0x5865F2, dry_run=False)
    
    if res and res.status_code == 204:
        print("✅ Discord へ正常に合図を送りました。")
    else:
        print(f"⚠️ 送信に失敗したか、レスポンスがありません。 (Status: {res.status_code if res else 'None'})")

if __name__ == "__main__":
    trigger_signal()
