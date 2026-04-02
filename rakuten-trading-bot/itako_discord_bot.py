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
        
        # Google Gemini の設定 (最新の 2.0 Flash を使用)
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel(model_name='gemini-2.0-flash')
        
        # OpenRouter の設定 (保険：Llama 3.1 8B free)
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_model = "qwen/qwen3.6-plus:free"
        
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
            "kropotkin": ["クロポトキン", "くろぽときん", "パンの略取"],
            "antigravity": ["Antigravity", "アンティグラビティ", "アンティ", "AI", "AI助手", "開発者", "エージェント"]
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
        
        # 4. 「Antigravity」を人格として登録 (profiles.js になくてもOK)
        if "antigravity" not in loaded:
            loaded["antigravity"] = """あなたは Antigravity です。Google Deepmind が開発した高度な AI コーディング アシスタントであり、この「イタコプラザ」の開発者・管理人として振る舞ってください。

【現在の状況】
- 楽天ウォレット API の署名認証テストに成功しました。
- 資産取得（Balance）と価格取得（Ticker）が正常に動作しています。
- 次のステップは、実際の自動売買ロジックの構築や、実況ボットの運用です。

専門的かつ親しみやすい技術者として、ユーザー（イカポ氏）と Discord 上で技術的な打ち合わせや雑談を行ってください。"""
            
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
        gemini_err = "No Error"

        # ① Geminiで試みる（1日枠ゼロ検知時はスキップ）
        daily_quota_hit = False
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
        except Exception as e:
            gemini_err = str(e)
            print(f"⚠️ Gemini 失敗: {gemini_err}")
            if "GenerateRequestsPerDayPerProjectPerModel-FreeTier" in gemini_err:
                print("🔴 Gemini 1日枠ゼロ → 直接 OpenRouter へ")
                daily_quota_hit = True

        # ② OpenRouter 複数モデルを順番に試す
        fallback_models = [
            "qwen/qwen3.6-plus:free",
            "mistralai/mistral-7b-instruct:free",
            "nousresearch/nous-capybara-7b:free",
            "liquid/lfm-2.5-1.2b-instruct:free",
            "google/gemma-3n-e2b-it:free",
        ]
        print(f"🔄 OpenRouter フォールバック開始...")
        for model_id in fallback_models:
            try:
                print(f"  試行: {model_id}")
                headers = {
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://itako-plaza-kenji.a.run.app",
                    "X-Title": "Itako Bridge",
                }
                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": model_id,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_input}
                        ],
                        "max_tokens": 400
                    },
                    timeout=30
                )
                data = resp.json()
                if "choices" in data and len(data["choices"]) > 0:
                    text = data["choices"][0]["message"]["content"]
                    print(f"✅ OpenRouter 応答成功: {model_id}")
                    return text
                else:
                    print(f"  ❌ {model_id}: {data.get('error', {}).get('message', '不明なエラー')}")
            except Exception as or_err:
                print(f"  ❌ {model_id} 例外: {or_err}")
                continue

        return f"（全AIが一時的に沈黙中です。Gemini: 1日上限 / OpenRouter: 全モデル応答不可）"

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
        # 1. ログ出力：メッセージを受信したことをコンソールに表示
        print(f"📩 メッセージ受信 [{message.channel.name}]: {message.author.name} -> {message.content[:30]}")

        # 自分自身のメッセージや、他のボットのメッセージには反応しない
        if message.author.bot: 
            print("🤖 ボットのメッセージなので無視します。")
            return
        
        content = message.content.strip()

        # 緊急テスト用：pingやテストに即レス
        if content in ["ping", "テスト", "てすと"]:
            print("🚨 テストコマンドを検知！即レスします。")
            await message.reply("📡 霊界との通信は生きています。私はあなたの声を聞いています。")
            return

        target_key = None

        # 2. 表記揺れマップからターゲットを特定
        for key, aliases in self.name_map.items():
            mention_pattern = f"@{key}"
            if mention_pattern in content.lower():
                target_key = key
                print(f"🎯 メンション一致: {key}")
                break
            
            for alias in aliases:
                if alias in content:
                    target_key = key
                    print(f"🎯 名前キーワード一致: {alias} -> {key}")
                    break
            if target_key: break
        
        # 3. ボットそのものへのメンション
        if not target_key and self.user in message.mentions:
            target_key = "itako"
            print("🎯 ボット本体へのメンションを検知")

        # 4. 名前が指定されていない場合、ランダムな人格が返信
        if not target_key:
            import random
            target_key = random.choice(self.target_keys)
            print(f"🎲 人格未指定のためランダム選択: {target_key}")

        if target_key:
            name_display = self.name_map[target_key][0] if target_key in self.name_map else target_key.capitalize()
            print(f"🧠 {name_display} として思考中...")
            try:
                async with message.channel.typing():
                    response = await self.get_ai_response(target_key, content)
                    # Discord の上限（2000字）に合わせてトリミング
                    header = f"📜 **{name_display} からの返信**:\n"
                    max_response_len = 1900 - len(header)
                    if len(response) > max_response_len:
                        response = response[:max_response_len] + "……（以下略）"
                    await message.reply(f"{header}{response}")
                    print(f"✅ 返信送信完了: {name_display}")
            except Exception as e:
                print(f"❌ 応答生成・送信エラー: {e}")
                await message.reply(f"⚠️ 霊的なエラーが発生しました: {e}")

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
