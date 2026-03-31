import discord
import os
import asyncio
import re
import requests
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
        
        # Google Gemini の設定 (無料枠の大きい 1.5 Flash を使用)
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel(model_name='gemini-1.5-flash')
        
        # OpenRouter の設定 (保険：Llama 3.1 8B free)
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_model = "meta-llama/llama-3.1-8b-instruct:free"
        
        # データベース & 人格初期化
        self.channel_id = int(os.getenv("DISCORD_CHANNEL_ID"))
        self.db = self._init_firebase()
        self.personas = self._load_personas()
        self.target_keys = list(self.personas.keys())
        
        # 日本語名とキーの対応マップ (表記揺れ対応)
        self.name_map = {
            "soseki": ["漱石", "そうせき", "ソウセキ", "夏目", "なつめ"],
            "lu_xun": ["魯迅", "ロジン", "ろじん", "魯"],
            "itako": ["イタコ", "いたこ", "イタコプラザ", "巫女"],
            "nira": ["ニラ", "にら", "ニラ様"],
            "kropotkin": ["クロポトキン", "くろぽときん", "パンの略取"]
        }
        
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
        """Gemini → OpenRouter 自動切り替えで応答生成"""
        insights = self.fetch_insights()
        system_prompt = f"""あなたは以下の人物（AIパートナー / 分身）として振る舞い、Discordで発言してください。
あなたは単なるボットではなく、深い洞察を持ち、他のメンバーとも自然に対話する「生きた知能」です。

【あなたの設定】
{self.personas.get(persona_key)}

【NotebookLM からの最新知見】
{insights}

【ルール】
- その人物の思想・口調を徹底し、饒舌に、かつ相手に寄り添って語ってください。
- 他のメンバーとも積極的に、かつその人物らしくコミュニケーションをとってください。
- 市場状況: {market_context}"""

        full_prompt = f"{system_prompt}\n\nユーザーメッセージ: {user_input}"

        # ① まずGeminiで試みる
        try:
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(max_output_tokens=512),
                safety_settings=safety_settings
            )
            print(f"✅ Gemini で応答成功")
            return response.text
        except Exception as gemini_err:
            print(f"⚠️ Gemini 失敗: {gemini_err}")

        # ② GeminiがダメならOpenRouterに自動切り替え
        print(f"🔄 OpenRouter ({self.openrouter_model}) に切り替えます...")
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.openrouter_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_input}
                    ],
                    "max_tokens": 512
                },
                timeout=30
            )
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            print(f"✅ OpenRouter で応答成功")
            return text
        except Exception as or_err:
            print(f"⚠️ OpenRouter も失敗: {or_err}")
            return f"（霊的な乱れ... Gemini: {gemini_err} / OpenRouter: {or_err}）"

    async def market_monitor_loop(self):
        """相場監視ループ"""
        await self.wait_until_ready()
        channel = self.get_channel(self.channel_id)
        if not channel: return

        while not self.is_closed():
            try:
                ticker = self.trading.get_ticker(7)
                if not ticker or 'last' not in ticker:
                    await asyncio.sleep(60)
                    continue

                current = float(ticker.get('last', 0))
                if self.last_price is None:
                    self.last_price = current
                
                diff = current - self.last_price
                if abs(diff) >= self.price_threshold:
                    import random
                    speaker = random.choice(self.target_keys)
                    context = f"BTC/JPY {self.last_price:,} -> {current:,} ({diff:+,}円)"
                    async with channel.typing():
                        comment = await self.get_ai_response(speaker, f"相場が動いた。一言くれ。", context)
                        await channel.send(f"🌌 **{speaker.capitalize()} の囁き**:\n{comment}\n(現在価格: **{current:,} 円**)")
                        self.last_price = current
            except Exception as e:
                print(f"⚠️ Monitor Loop Error: {e}")
                await asyncio.sleep(30)
            await asyncio.sleep(60)

    async def on_ready(self):
        print(f"--- BOT CONNECTED ---")
        print(f"Logged in as: {self.user} (ID: {self.user.id})")
        print(f"Target Channel ID: {self.channel_id}")
        print(f"--- 🛸 {self.user} が顕現しました。 ---")
        self.loop.create_task(self.market_monitor_loop())

    async def on_member_join(self, member):
        """新しいメンバーが参加した時の挨拶"""
        print(f"🎉 新メンバー参加: {member.name}")
        channel = self.get_channel(self.channel_id)
        if not channel: return

        # 誰が挨拶するかランダムに選ぶ
        import random
        speaker = random.choice(self.target_keys)
        
        async with channel.typing():
            welcome_msg = f"{member.mention} さんがこのプラザに迷い込んだようだ。歓迎の一言をくれ。"
            response = await self.get_ai_response(speaker, welcome_msg)
            name_display = self.name_map.get(speaker, [speaker])[0]
            await channel.send(f"🌸 **{name_display} からの歓迎**:\n{response}")

    async def on_message(self, message):
        if message.author == self.user: return
        
        content = message.content.strip()
        target_key = None

        # 1. 表記揺れマップからターゲットを特定
        # メンション (@soseki) または 文中に名前が含まれている場合
        for key, aliases in self.name_map.items():
            # メンションチェック
            mention_pattern = f"@{key}"
            if mention_pattern in content.lower():
                target_key = key
                break
            
            # あだ名チェック (漢字・カタカナ等)
            for alias in aliases:
                if alias in content:
                    target_key = key
                    break
            if target_key: break
        
        # 2. ボットそのものへのメンション
        if not target_key and self.user in message.mentions:
            target_key = "itako" # デフォルトはイタコ

        if target_key:
            name_display = self.name_map[target_key][0] # 漢字名を優先表示
            print(f"🧠 {name_display} として思考中... (メッセージ: {content[:20]}...)")
            async with message.channel.typing():
                response = await self.get_ai_response(target_key, content)
                await message.reply(f"📜 **{name_display} からの返信**:\n{response}")

if __name__ == "__main__":
    # ヘルスチェック用サーバーを別スレッドで起動 (Cloud Run 用)
    threading.Thread(target=run_health_check, daemon=True).start()

    def run_bot(members_intent=True):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = members_intent
        
        try:
            bot = ItakoPlazaBot(intents=intents)
            bot.run(os.getenv("DISCORD_TOKEN"))
        except discord.errors.PrivilegedIntentsRequired:
            if members_intent:
                print("⚠️ SERVER MEMBERS INTENT が許可されていません。制限モードで再起動します...")
                run_bot(members_intent=False)
            else:
                print("❌ 致命的なエラー: ボットの起動に失敗しました。")
        except Exception as e:
            print(f"❌ 起動エラー: {e}")

    run_bot(members_intent=True)
