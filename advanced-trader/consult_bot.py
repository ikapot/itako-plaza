import discord
from discord.ext import commands
import os
import logging
import aiohttp
import asyncio
import socket
from dotenv import load_dotenv

# --- 設定 ---
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(env_path)

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip().strip('"')
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"')

# 現在OpenRouterで確実に「無料」かつ「有効」なモデルリスト
FALLBACK_MODELS = [
    "google/gemma-3-4b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "mistralai/mistral-7b-instruct:free"
]

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("ConsultBot")

SYSTEM_PROMPT = """
あなたは 'Itako Plaza 専属コンサルタント AI' です。
ユーザー (ikapot) が構築した仮想通貨自動売買システムの詳細をすべて把握しています。
日本語で、プロフェッショナルかつフレンドリーにアドバイスを提供してください。
"""

class ConsultBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.session = None

    async def setup_hook(self):
        connector = aiohttp.TCPConnector(family=socket.AF_INET, use_dns_cache=False)
        self.session = aiohttp.ClientSession(connector=connector)
        logger.info("Aiohttp ClientSession opened (IPv4 Forced).")

    async def on_ready(self):
        logger.info(f"🚀 Logged in as {self.user} (ID: {self.user.id})")
        await self.change_presence(activity=discord.Game(name="!help | 相談受付中"))

    async def get_ai_response(self, user_text):
        if not OPENROUTER_KEY:
            return "❌ OPENROUTER_API_KEY が設定されていません。"
        
        last_error = ""
        for model in FALLBACK_MODELS:
            try:
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://itako-plaza.vercel.app",
                    "X-Title": "Itako Plaza Consult Bot"
                }
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_text}
                    ],
                    "max_tokens": 512,
                    "temperature": 0.7
                }
                async with self.session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=30) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        error_text = await resp.text()
                        last_error = f"{model} ({resp.status})"
                        logger.warning(f"Failed with {last_error}: {error_text}")
            except Exception as e:
                last_error = f"{model} (Error: {str(e)})"
                logger.error(last_error)
        
        return f"❌ 接続エラー（残高不足またはAPI制限）。\n最終試行: {last_error}"

    async def on_message(self, message):
        if message.author == self.user:
            return
        await self.process_commands(message)
        if self.user.mentioned_in(message) or isinstance(message.channel, discord.DMChannel):
            async with message.channel.typing():
                clean_content = message.content.replace(f"<@!{self.user.id}>", "").replace(f"<@{self.user.id}>", "").strip()
                response = await self.get_ai_response(clean_content or "こんにちは")
                await message.reply(response)

bot = ConsultBot()

if __name__ == "__main__":
    if not TOKEN:
        logger.error("DISCORD_BOT_TOKEN が設定されていません。")
    else:
        bot.run(TOKEN)
