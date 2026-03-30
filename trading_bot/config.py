import os
from dotenv import load_dotenv

load_dotenv()

# 楽天証券 ログイン情報
RAKUTEN_USER_ID = os.getenv("RAKUTEN_USER_ID", "")
RAKUTEN_PASSWORD = os.getenv("RAKUTEN_PASSWORD", "")
RAKUTEN_TRADING_PASSWORD = os.getenv("RAKUTEN_TRADING_PASSWORD", "")

# 通知用設定 (Discord Webhook または LINE Notify)
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
LINE_NOTIFY_TOKEN = os.getenv("LINE_NOTIFY_TOKEN", "")

# 資金管理設定 (元手1万円、リスク1% = 100円)
INITIAL_CAPITAL = 10000
RISK_PERCENT = 0.01  # 1%
MAX_LOSS_PER_TRADE = INITIAL_CAPITAL * RISK_PERCENT # 100円

# Webhook 認証用トークン (任意)
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "itako_secret_key")
