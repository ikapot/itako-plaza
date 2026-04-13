import asyncio
import os
import logging
from browser_use import Agent, Browser
from langchain_openai import ChatOpenAI
import requests
import argparse
import sys
from dotenv import load_dotenv
from google.cloud import firestore

# 環境変数の読み込み
# ルートまたは advanced-trader フォルダ内の .env.all を優先的に探す
env_paths = [
    "advanced-trader/.env.all", 
    ".env.all", 
    os.path.join(os.path.dirname(__file__), "..", "advanced-trader", ".env.all")
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path, override=True)
        break
else:
    load_dotenv() # デフォルト

# --- logger設定 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. モデル設定 (OpenRouter 経由の Gemini 1.5 Flash) ---
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    logger.error("❌ OPENROUTER_API_KEY が設定されていません。")

from pydantic import ConfigDict

# browser-use v0.12.x 互換性のためのサブクラス
class ChatOpenAIWithProvider(ChatOpenAI):
    model_config = ConfigDict(extra='allow')
    provider: str = "openai"
    model: str = "google/gemini-1.5-flash"

llm = ChatOpenAIWithProvider(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY if OPENROUTER_API_KEY else "dummy",
    model="google/gemini-1.5-flash", 
)

# --- 2. Discord Notification ---
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
def send_discord_msg(content: str):
    if not DISCORD_WEBHOOK_URL: return
    try:
         requests.post(DISCORD_WEBHOOK_URL, json={"content": content})
    except Exception as e:
         logger.error(f"Discord通知エラー: {e}")

# --- 3. Firestore 状態管理 ---
db = None
try:
    db = firestore.Client()
    logger.info("✅ Firestore initialized.")
except Exception as e:
    logger.warning(f"⚠️ Firestore initializaton failed (2FA sync mapping will be disabled): {e}")

DOC_PATH = "bot_status/rakuten_agent"

def check_firestore_2fa_status():
    """Firestore から 2FA コードが書き込まれているか確認"""
    if db is None: return None
    try:
        doc = db.document(DOC_PATH).get()
        if doc.exists:
            data = doc.to_dict()
            if data.get("status") == "2FA_PROVIDED" and data.get("code"):
                return data.get("code")
    except Exception as e:
        logger.error(f"Firestore 読み取りエラー: {e}")
    return None

def set_firestore_status(status_str: str, extra_data=None):
    """Firestore にステータスを書き込む"""
    try:
        data = {"status": status_str, "updated_at": firestore.SERVER_TIMESTAMP}
        if extra_data:
            data.update(extra_data)
        db.document(DOC_PATH).set(data, merge=True)
    except Exception as e:
        logger.error(f"Firestore 書き込みエラー: {e}")

# --- 4. Agent メインロジック ---
async def run_order_sequence(side: str, amount: float, symbol: str = "LTC/JPY", headless=True):
    """
    ブラウザを使用して実際に注文を執行する
    """
    logger.info(f"🚀 注文執行シーケンス開始: {side} {amount} {symbol}")
    
    user_id = os.environ.get("RAKUTEN_SEC_USER_ID")
    password = os.environ.get("RAKUTEN_SEC_PASSWORD")

    # ブラウザ設定
    browser = Browser(headless=headless)

    order_task = f"""
    1. https://exchange.rakuten-wallet.co.jp にアクセス。
    2. ログイン画面が表示されたら、ログインID '{user_id}'、パスワード '{password}' でログイン。
    3. 2段階認証（ワンタイムパスワード）画面が表示されたら待機し、Discord/Firestore経由でのコード入力プロセスに移る。
    4. ログイン成功後、画面左上の銘柄プルダウンから 'LTC/JPY' を選択。
    5. 画面右側の注文パネルで以下を操作:
       - 注文種類: '成行' (またはデフォルト)
       - 売買区分: '{side}' (BUYなら買、SELLなら売)
       - 数量: '{amount}' (例: 0.1)
    6. '注文内容を確認する' または '確認画面へ' をクリックし、最終的な執行ボタンを押して完了させてください。
    7. 完了したら「注文執行完了: {side} {amount} {symbol}」と報告。
    8. 最終報告として以下の JSON 形式で出力してください: {{"status": "success", "side": "{side}", "amount": {amount}, "message": "注文完了"}}
    """

    agent = Agent(task=order_task, llm=llm, browser=browser)
    
    set_firestore_status("ORDERING", {"side": side, "amount": amount})
    result = await agent.run()
    
    # 結果のJSON出力 (Python側で読み取るため)
    print(json.dumps({"success": True, "result": str(result)}))
    await browser.stop()
    return result

async def run_status_sequence(headless=True):
    """
    ブラウザを使用して残高・ポジション情報を取得する
    """
    logger.info("🔍 資産状況確認シーケンス開始...")
    user_id = os.environ.get("RAKUTEN_SEC_USER_ID")
    password = os.environ.get("RAKUTEN_SEC_PASSWORD")
    
    browser = Browser(headless=headless)
    
    status_task = f"""
    1. https://exchange.rakuten-wallet.co.jp にアクセスし、ログイン（必要に応じて ID: '{user_id}' / PW: '{password}' / 2FA を使用）。
    2. 画面上の資産状況エリアから現在の「有効証拠金」を読み取る。
    3. 保有している建玉（特に LTC/JPY）の数量と売買区分を特定する。
    4. 以下の JSON 形式でのみ最終報告をしてください。
       JSON例: {{"equity": 10500, "positions": [{{"symbol": "LTC/JPY", "side": "BUY", "amount": 0.1}}]}}
    """
    
    agent = Agent(task=status_task, llm=llm, browser=browser)
    result = await agent.run()
    
    # 結果のJSON出力
    print(json.dumps({"success": True, "data": str(result)}))
    await browser.stop()
    return result

async def run_trading_sequence(headless=True):
    logger.info("🚀 楽天証券自動売買エージェント起動...")
    
    user_id = os.environ.get("RAKUTEN_SEC_USER_ID", "USER_ID_HERE")
    password = os.environ.get("RAKUTEN_SEC_PASSWORD", "PASSWORD_HERE")

    # ブラウザ設定
    browser = Browser(headless=headless)

    login_task = f"""
    1. https://exchange.rakuten-wallet.co.jp にアクセス。
    2. ログインフォームに ID: '{user_id}' と パスワード: '{password}' を入力してログインボタンを押す。
    3. 2段階認証（ワンタイムパスワード）の入力画面が表示されたら、そこで停止し、「2段階認証が必要です」と報告。
    4. 既にログイン済みの場合は、ダッシュボード（LTC/JPYのチャート等）が表示されていることを報告してください。
    """

    agent = Agent(
        task=login_task,
        llm=llm,
        browser=browser
    )

    set_firestore_status("LOGGING_IN")
    result = await agent.run()

    # 2FA 判定
    result_str = str(result)
    if "2段階認証" in result_str or "ワンタイムパスワード" in result_str:
        logger.info("⚠️ 2段階認証が要求されました。")
        send_discord_msg("🤖 楽天証券: 2段階認証が必要です。コードを Firestore/Discord 経由で入力してください。")
        set_firestore_status("WAITING_2FA")
        
        # 最大2分待機 (10秒おきにチェック)
        for _ in range(12):
            await asyncio.sleep(10)
            code = check_firestore_2fa_status()
            if code:
                logger.info(f"🔑 2FAコード受信: {code}")
                # 2FA入力フェーズ
                agent_2fa = Agent(
                    task=f"入力欄にコード '{code}' を入力して、認証（ログイン）を完了させてください。",
                    llm=llm,
                    browser=browser # 同じブラウザインスタンスを継続使用
                )
                await agent_2fa.run()
                set_firestore_status("LOGGED_IN", {"code": None})
                send_discord_msg("✅ ログインに成功しました。")
                break
        else:
             logger.warning("⏳ 2FAタイムアウト。")
             set_firestore_status("TIMEOUT_2FA")
             await browser.stop()
             return

    # ログイン成功後の処理（保有銘柄チェックなど）
    # ...
    
    logger.info("🏁 処理完了。")
    await browser.stop()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", type=str, choices=["order", "status", "login"], default="login")
    parser.add_argument("--side", type=str, help="BUY or SELL")
    parser.add_argument("--amount", type=float, help="Order amount (e.g. 0.1)")
    parser.add_argument("--symbol", type=str, default="LTC/JPY", help="Symbol name")
    parser.add_argument("--headless", action="store_true", default=False, help="Run in headless mode")
    
    args = parser.parse_args()
    
    # ロガーの出力を抑制して JSON だけを標準出力に出しやすくする (必要に応じて)
    if args.action != "login":
        logging.getLogger("browser_use").setLevel(logging.ERROR)

    if args.action == "order":
        asyncio.run(run_order_sequence(args.side, args.amount, args.symbol, headless=args.headless))
    elif args.action == "status":
        asyncio.run(run_status_sequence(headless=args.headless))
    else:
        asyncio.run(run_trading_sequence(headless=args.headless))
