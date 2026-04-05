import asyncio
import os
import json
import logging
from browser_use import Agent
from langchain_openai import ChatOpenAI # Using OpenRouter
import requests
import time

# --- 最安設計の肝: logger設定 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. 最安のモデル設定 (OpenRouter 経由の Gemini 1.5 Flash) ---
# Gemini Flash は視覚タスク（スクリーンショット解析）において、GPT-4o等の 1/10 以下のコスト。
llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY", "your_key_here"),
    model="google/gemini-1.5-flash", 
)

# --- 2. Discord Notification ユーティリティ ---
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
def send_discord_msg(content: str):
    if not DISCORD_WEBHOOK_URL: return
    try:
         requests.post(DISCORD_WEBHOOK_URL, json={"content": content})
    except Exception as e:
         logger.error(f"Discord通知エラー: {e}")

# --- 3. Firestore 状態管理 (モック) ---
# ※実装時は本物の Firestore クライアントを使用します
def check_firestore_2fa_status():
    # Firestoreの "bot_status" ドキュメントを読み込み
    # もし status が "2FA_PROVIDED" ならコードを返す、"WAITING" なら None を返す
    return None

def set_firestore_status(status_str: str):
    # Firestore に現在の状態を書き込む（例: "IDLE", "WAITING_2FA", "LOGGED_IN"）
    pass

# --- 4. Agent メインロジック (Cloud Scheduler から 30分おきに呼ばれる) ---
async def run_trading_sequence():
    """
    Cloud Scheduler等から定期実行（30分毎）されるエントリーポイント。
    Cloud Runのインスタンス起動中に短時間で以下の操作を完了させ、すぐ終了（インスタンス数を0に戻す）させる。
    """
    logger.info("🚀 自動売買エージェントが起動しました...")

    # 最安運用のため、タスク指示は極端にシンプルに（トークン消費の抑制）
    login_task = """
    1. https://www.rakuten-sec.co.jp/ にアクセス。
    2. 'ログイン'ボタンをクリックし、IDとパスワードを入力（仮: USER_ID / PASSWORD）。
    3. もし2段階認証（MFA/2FA）のコード入力画面が出たら、いったんそこで操作を止めてください。
    """

    agent = Agent(
        task=login_task,
        llm=llm,
    )

    # Agent の実行（ブラウザ操作開始）
    logger.info("ブラウザ操作を開始します...")
    result = await agent.run()

    # == ここの判定は、Agentの出力結果やDOMステータスに基づいて行います ==
    if "2段階認証" in str(result) or "ワンタイムパスワード" in str(result):
        logger.info("⚠️ 2段階認証が要求されました。")
        send_discord_msg("🤖 楽天証券から2段階認証が求められました！Discordにコードを書き込んでください。")
        set_firestore_status("WAITING_2FA")
        
        # Cloud Runの課金を抑えるため、ここで最大1分だけ待機し、来なければプロセスを終了して次回起動に回す
        for i in range(12):
            await asyncio.sleep(5)
            code = check_firestore_2fa_status()
            if code:
                logger.info("🔑 ユーザーからの2FAコードを受信しました！入力を続行します。")
                
                # 2FA入力のための追加タスク
                code_task = f"テキストボックスに '{code}' を入力し、'認証する'ボタンをクリックしてください。"
                agent_2fa = Agent(task=code_task, llm=llm)
                await agent_2fa.run()
                
                send_discord_msg("✅ ログインに成功しました。株価のチェックを実施します。")
                break
        else:
             logger.warning("⏳ 2FAの入力がタイムアウトしました。次回の起動サイクルでリトライします。")
             # インスタンスが終了し、課金はここでストップする
             return

    # ログイン成功後、実際の注文や保有チェックなどの処理を続ける
    # ...
    
    logger.info("🏁 処理が完了しました。インスタンスをシャットダウンします。")

if __name__ == "__main__":
    asyncio.run(run_trading_sequence())
