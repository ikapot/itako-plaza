import discord
import os
import logging
import requests
from dotenv import load_dotenv

# --- 設定 ---
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.production"))
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "google/gemini-1.5-flash"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ConsultBot")

# --- システムプロンプト (Itako Plaza の文脈を注入) ---
SYSTEM_PROMPT = """
あなたは 'Itako Plaza 専属コンサルタント AI' です。
ユーザー (ikapot) が構築した仮想通貨自動売買システムの詳細をすべて把握しています。

【システム構成】
- 拠点: GitHub Actions (10分おき実行)
- 取引所: 楽天ウォレット (BTC/JPY 証拠金取引)
- 状態管理: GitHub Gist (position.json) で買付価格等を永続化
- 戦略: クオンツ決済エンジン (2%リスクルール, 分割利確, 天井反転検知, ATRストップ)
- 通知: Discord Webhook 連携

あなたはユーザーの相談に乗り、コードの解説、戦略の改善案、エラーのデバッグ、または将来的な楽天証券（株）との統合案などを親身にアドバイスしてください。
回答は常に日本語で、プロフェッショナルかつフレンドリーに行ってください。
"""

class ConsultBot(discord.Client):
    async def on_ready(self):
        logger.info(f"Logged on as {self.user}!")
        await self.change_presence(activity=discord.Game(name="Itako Plaza 相談受付中"))

    async def on_message(self, message):
        # 自分自身のメッセージは無視
        if message.author == self.user:
            return

        # メンションされたか、DMの場合に応答
        if self.user.mentioned_in(message) or isinstance(message.channel, discord.DMChannel):
            async with message.channel.typing():
                response = self.get_ai_response(message.content)
                await message.reply(response)

    def get_ai_response(self, user_text):
        try:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_text}
                ]
            }
            resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=30)
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"❌ 相談エラーが発生しました: {e}"

if __name__ == "__main__":
    if not TOKEN:
        logger.error("DISCORD_BOT_TOKEN が設定されていません。")
    else:
        intents = discord.Intents.default()
        intents.message_content = True
        client = ConsultBot(intents=intents)
        client.run(TOKEN)
