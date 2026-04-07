import asyncio
import os
import logging
from browser_use import Agent, BrowserConfig, Browser
from langchain_openai import ChatOpenAI
import requests
from dotenv import load_dotenv
from google.cloud import firestore

# 環境変数の読み込み
load_dotenv()

# --- logger設定 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. モデル設定 (OpenRouter 経由の Gemini 1.5 Flash) ---
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    logger.error("❌ OPENROUTER_API_KEY が設定されていません。")

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
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
db = firestore.Client()
DOC_PATH = "bot_status/rakuten_agent"

def check_firestore_2fa_status():
    """Firestore から 2FA コードが書き込まれているか確認"""
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
async def run_trading_sequence(headless=True):
    logger.info("🚀 楽天証券自動売買エージェント起動...")
    
    user_id = os.environ.get("RAKUTEN_SEC_USER_ID", "USER_ID_HERE")
    password = os.environ.get("RAKUTEN_SEC_PASSWORD", "PASSWORD_HERE")

    # ブラウザ設定
    config = BrowserConfig(headless=headless)
    browser = Browser(config=config)

    login_task = f"""
    1. https://www.rakuten-sec.co.jp/ にアクセス。
    2. ログインボタンをクリックし、ログインフォームを表示。
    3. ログインIDに '{user_id}'、パスワードに '{password}' を入力し、ログインボタンを押す。
    4. 2段階認証（ワンタイムパスワード）の入力画面が表示されたら、そこで待機し、画面の内容を報告してください。
    5. 既にログイン済みの場合は、資産合計ページが表示されていることを確認してください。
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
             await browser.close()
             return

    # ログイン成功後の処理（保有銘柄チェックなど）
    # ...
    
    logger.info("🏁 処理完了。")
    await browser.close()

if __name__ == "__main__":
    # デフォルトは headless=True (Cloud Run 向け)
    # ローカルテスト時は headless=False にすると挙動が見える
    asyncio.run(run_trading_sequence(headless=True))
