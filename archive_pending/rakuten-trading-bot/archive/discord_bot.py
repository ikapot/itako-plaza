import discord
from discord.ext import commands
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

class VerificationView(discord.ui.View):
    def __init__(self, callback_future):
        super().__init__(timeout=120.0) # 2分でタイムアウト
        self.callback_future = callback_future

    @discord.ui.button(label="Approve (承認する)", style=discord.ButtonStyle.green)
    async def approve(self, interaction: discord.Interaction, button: discord.ui.Button):
        """
        ユーザーが承認ボタンを押した時の処理
        """
        if not self.callback_future.done():
            self.callback_future.set_result(True)
            await interaction.response.send_message("✅ 2FA Authorized! Proceeding with login...", ephemeral=True)
            self.stop()
        else:
            await interaction.response.send_message("⚠️ Request already processed or timed out.", ephemeral=True)

class DiscordNotifier:
    def __init__(self, token, channel_id):
        self.token = token
        self.channel_id = int(channel_id)
        self.bot = commands.Bot(command_prefix="!", intents=discord.Intents.default())
        self.setup_bot()

    def setup_bot(self):
        @self.bot.event
        async def on_ready():
            print(f"Discord Bot Logged in as {self.bot.user}")

    async def start(self):
        """
        Botの起動 (非同期)
        """
        await self.bot.start(self.token)

    async def request_2fa_approval(self):
        """
        2FAの承認通知をチャンネルに送信し、結果を待つ
        """
        channel = self.bot.get_channel(self.channel_id)
        if not channel:
            print("Error: Discord channel not found.")
            return False

        loop = asyncio.get_event_loop()
        future = loop.create_future()
        view = VerificationView(future)

        embed = discord.Embed(
            title="楽天証券 ログイン承認要求",
            description="自動売買システムがログインのために二要素認証(2FA)を求めています。\nスマホ等で認証コードを確認し、完了したら下のボタンを押してください。",
            color=discord.Color.blue()
        )
        
        await channel.send(embed=embed, view=view)

        try:
            # ユーザーのボタン入力を待機 (タイムアウト 120秒)
            return await asyncio.wait_for(future, timeout=120.0)
        except asyncio.TimeoutError:
            print("2FA Approval Timed Out.")
            return False

if __name__ == "__main__":
    # 単体テスト用
    # notifier = DiscordNotifier(os.getenv("DISCORD_TOKEN"), os.getenv("DISCORD_CHANNEL_ID"))
    # asyncio.run(notifier.start())
    print("Discord Notifier Module Ready.")
