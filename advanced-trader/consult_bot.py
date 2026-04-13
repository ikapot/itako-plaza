import sys
import os

# Windows環境での aiodns による DNS解決エラー回避パッチ
# aiodns が存在すると aiohttp がそれを使用しようとして失敗するため、インポートをブロックする
sys.modules['aiodns'] = None

import discord
from discord.ext import commands
from discord import app_commands
import logging
import json
import socket
import aiohttp
import asyncio
import aiohttp.resolver
from datetime import datetime
from dotenv import load_dotenv

# 強制的に ThreadedResolver を使用
aiohttp.resolver.DefaultResolver = aiohttp.resolver.ThreadedResolver

# --- 追加ライブラリ (libフォルダから) ---
sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
from rakuten_api import RakutenWalletClient

# --- 設定 ---
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(env_path)

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip().strip('"')
WALLET_API_KEY = os.getenv("WALLET_API_KEY", "").strip().strip('"')
WALLET_API_SECRET = os.getenv("WALLET_API_SECRET", "").strip().strip('"')
ALLOWED_USER_ID = int(os.getenv("ALLOWED_DISCORD_USER_ID", "0"))

# キューファイルのパス
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
QUEUE_PATH = os.path.join(WORKSPACE_ROOT, "brain", "mobile_queue.json")

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("ConsultBot (Forwarder)")

class ConsultBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        
        self.wallet = RakutenWalletClient(WALLET_API_KEY, WALLET_API_SECRET) if WALLET_API_KEY else None

    async def setup_hook(self):
        resolver = aiohttp.ThreadedResolver()
        connector = aiohttp.TCPConnector(resolver=resolver, family=socket.AF_INET)
        self.session = aiohttp.ClientSession(connector=connector)
        await self.tree.sync()
        logger.info("Bot (Forwarder) initialized and synced.")

    async def on_ready(self):
        logger.info(f"🚀 Forwarder online as {self.user} (ID: {self.user.id})")
        await self.change_presence(activity=discord.Game(name="AGへの伝言受け付け中"))

    # --- Slash Commands (Stateless) ---
    @app_commands.command(name="status", description="資産概況を表示します")
    async def status(self, interaction: discord.Interaction):
        await interaction.response.defer()
        try:
            embed = discord.Embed(title="📊 ITKO System Status", color=0x325ba0)
            if self.wallet:
                res = self.wallet.get_margin_info()
                equity = res[0].get("equity", 0) if isinstance(res, list) and res else 0
                embed.add_field(name="有効証拠金", value=f"¥{equity:,.0f}", inline=True)
            embed.set_footer(text=f"Check time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            await interaction.followup.send(embed=embed)
        except Exception as e:
            await interaction.followup.send(f"❌ エラー: {e}")

    # --- DM Forwarding to AG Queue ---
    async def on_message(self, message):
        if message.author == self.user:
            return

        # ユーザー認証 & DMのみ
        is_dm = isinstance(message.channel, discord.DMChannel)
        if not is_dm or (ALLOWED_USER_ID != 0 and message.author.id != ALLOWED_USER_ID):
            return

        # 伝言板への書き込み
        try:
            os.makedirs(os.path.dirname(QUEUE_PATH), exist_ok=True)
            
            queue = []
            if os.path.exists(QUEUE_PATH):
                with open(QUEUE_PATH, "r", encoding="utf-8") as f:
                    queue = json.load(f)
            
            new_task = {
                "timestamp": datetime.now().isoformat(),
                "author": message.author.name,
                "content": message.content,
                "status": "pending"
            }
            queue.append(new_task)
            
            with open(QUEUE_PATH, "w", encoding="utf-8") as f:
                json.dump(queue, f, indent=2, ensure_ascii=False)
            
            await message.reply("📝 **Antigravityへの伝言として記録しました。**\n次回のAGセッション開始時に処理されます。")
            logger.info(f"Message from {message.author} queued: {message.content[:20]}...")
            
        except Exception as e:
            await message.reply(f"❌ 記録失敗: {e}")

bot = ConsultBot()

if __name__ == "__main__":
    if not TOKEN:
        logger.error("DISCORD_BOT_TOKEN が設定されていません。")
    else:
        bot.run(TOKEN)
