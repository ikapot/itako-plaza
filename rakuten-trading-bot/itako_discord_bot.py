import discord
import os
import asyncio
import re
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai
from rakuten_wallet_client import RakutenWalletClient
from fastapi import FastAPI
import uvicorn
import threading

app = FastAPI()

@app.get("/")
async def health_check():
    return {"status": "ok", "bot": "Itako Bridge"}

def run_health_check():
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

# 設定の読み込み
load_dotenv()

class ItakoPlazaBot(discord.Client):
    """
    イタコプラザ & 楽天ウォレット 統合Discordボット (Google Gemini直結版)
    - NotebookLM知見 (Firestore) 同期
    - 5人の人格による相場実況
    - Google Gemini 1.5 Flash (無料枠) で稼働
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # クライアント初期化
        self.trading = RakutenWalletClient()
        
        # Google Gemini の設定
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-flash-lite-latest')
        
        # データベース & 人格初期化
        self.db = self._init_firebase()
        self.personas = self._load_personas()
        self.target_keys = list(self.personas.keys())
        
        # 状態管理
        self.last_price = None
        self.price_threshold = 10000 # 1万円動いたら叫ぶ設定

    def _init_firebase(self):
        """Firebase Admin SDKの初期化"""
        try:
            key_path = "firebase-key.json"
            if os.path.exists(key_path):
                if not firebase_admin._apps:
                    cred = credentials.Certificate(key_path)
                    firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK: 接続成功 (Key file)")
            else:
                # Cloud Run 等の環境ではデフォルトの認証情報を使用
                if not firebase_admin._apps:
                    firebase_admin.initialize_app()
                print("✅ Firebase Admin SDK: 接続成功 (Default Credentials)")
            return firestore.client()
        except Exception as e:
            print(f"⚠️ Firebase初期化失敗: {e}")
        return None

    def _load_personas(self):
        """profiles.js から人格抽出"""
        # コンテナ内では ./src/data/profiles.js 、
        # ローカル開発環境では ../src/data/profiles.js にある可能性があるため両方チェック
        paths = [
            os.path.abspath(os.path.join(os.getcwd(), "src", "data", "profiles.js")),
            os.path.abspath(os.path.join(os.getcwd(), "..", "src", "data", "profiles.js"))
        ]
        
        path = None
        for p in paths:
            if os.path.exists(p):
                path = p
                break
        
        if not path:
            print(f"❌ プロフィールファイルが見つかりません。探索パス: {paths}")
            return {}

        loaded = {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                # オブジェクト内のすべてのキーを抽出
                # 形式: key: `value`
                matches = re.finditer(r"(\w+):\s*`([^`]*)` samples?", content, re.DOTALL)
                # re.finditer を使って全体から抽出
                # profiles.js は export const CHARACTER_PROFILES = { ... } の形式
                matches = re.finditer(r"(\w+):\s*`([^`]*)`", content, re.DOTALL)
                for m in matches:
                    loaded[m.group(1)] = m.group(2).strip()
            
            print(f"✅ 人格同期成功 ({len(loaded)}名): {path}")
        except Exception as e:
            print(f"❌ プロフィール読み込みエラー: {e}")
        return loaded

    def fetch_insights(self):
        """Firestoreから最新NotebookLM知見を取得"""
        if not self.db: return ""
        try:
            docs = self.db.collection("notebook_accumulations")\
                          .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                          .limit(5).stream()
            return "\n".join([d.to_dict().get("content", "") for d in docs])
        except:
            return ""

    async def get_ai_response(self, persona_key, user_input, market_context=""):
        """Google Gemini APIで応答生成 (無料枠)"""
        insights = self.fetch_insights()
        system_prompt = f"""
あなたは以下の人物になりきり、Discordで発言してください。
設定: {self.personas.get(persona_key)}

【NotebookLM からのあなたの最新知見】
{insights}

【ルール】
- その人物の思想・口調を徹底し、200文字程度で深く饒舌に語ってください。
- 市場状況: {market_context}
- 最新知見を反映しつつ、あなたの思想で語ってください。
"""
        # クォータ制限(429)対策：リトライループ
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # 安全フィルターを「ブロックなし」に設定 (思想・哲学を遮断しないため)
                safety_settings = [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
                
                # Geminiにプロンプトを送信 (軽量版モデルに変更)
                full_prompt = f"{system_prompt}\n\nユーザーメッセージ: {user_input}"
                response = self.model.generate_content(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(max_output_tokens=512),
                    safety_settings=safety_settings
                )
                return response.text
            except Exception as e:
                # 429 (Quota Exceeded) の場合は少し待って再試行
                if "429" in str(e) and attempt < max_retries - 1:
                    print(f"📡 Quota limit hit (429). Retrying in 5s... (Attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(5)
                    continue
                print(f"⚠️ Gemini Error: {e}")
                return f"（霊的な乱れ... {e}）"

    async def market_monitor_loop(self):
        """相場監視ループ"""
        await self.wait_until_ready()
        channel = self.get_channel(self.channel_id)
        if not channel: return

        while not self.is_closed():
            try:
                ticker = self.trading.get_ticker(7)
                if not ticker or 'last' not in ticker:
                    print(f"⚠️ Ticker取得失敗（APIエラー等）")
                    await asyncio.sleep(60)
                    continue

                current = float(ticker.get('last', 0))
                
                if self.last_price is None:
                    self.last_price = current
                    print(f"📡 相場監視開始: 現在価格 {current:,} 円")
                
                diff = current - self.last_price
                if abs(diff) >= self.price_threshold:
                    import random
                    speaker = random.choice(self.target_keys)
                    context = f"BTC/JPY {self.last_price:,} -> {current:,} ({diff:+,}円)"
                    
                    print(f"📢 動向検知: {context} - {speaker} が発言準備中...")
                    async with channel.typing():
                        comment = await self.get_ai_response(speaker, f"相場が動いた。一言くれ。", context)
                        await channel.send(f"🌌 **{speaker.capitalize()} の囁き**:\n{comment}\n(現在価格: **{current:,} 円**)")
                        self.last_price = current
                        print(f"✅ 発言完了")
                
            except Exception as e:
                print(f"⚠️ Monitor Loop Error: {e}")
                # 重大なエラー（接続切れ等）の場合は少し長めに待機
                await asyncio.sleep(30)
            await asyncio.sleep(60)

    async def on_ready(self):
        print(f"🛸 {self.user} (イタコ・ブリッジ：Gemini版) が顕現しました。")
        self.loop.create_task(self.market_monitor_loop())

    async def on_message(self, message):
        if message.author == self.user: return
        
        content = message.content.strip()
        target = None

        # 1. 直接名前を呼ばれたかチェック（例: @soseki 今日はどう？）
        for key in self.target_keys:
            if content.lower().startswith(f"@{key.lower()}"):
                target = key
                # @名前 の部分を削る
                content = content[len(key)+1:].strip()
                break
        
        # 2. ボットそのものが呼ばれたかチェック
        if not target and self.user in message.mentions:
            target = next((k for k in self.target_keys if k in content.lower()), "kropotkin")
        
        if target:
            print(f"🧠 チャネリング開始: {target} (メッセージ: {content[:20]}...)")
            async with message.channel.typing():
                response = await self.get_ai_response(target, content)
                await message.reply(f"📜 **{target.capitalize()} からの返信**:\n{response}")

if __name__ == "__main__":
    # ヘルスチェック用サーバーを別スレッドで起動 (Cloud Run 用)
    threading.Thread(target=run_health_check, daemon=True).start()

    intents = discord.Intents.default()
    intents.message_content = True
    bot = ItakoPlazaBot(intents=intents)
    bot.run(os.getenv("DISCORD_TOKEN"))
