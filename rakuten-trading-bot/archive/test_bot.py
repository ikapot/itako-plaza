import discord
import os
import asyncio
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
CHANNEL_ID = os.getenv("DISCORD_CHANNEL_ID")

class TestBot(discord.Client):
    async def on_ready(self):
        print(f'Logged in as {self.user} (ID: {self.user.id})')
        print('------')
        
        channel = self.get_channel(int(CHANNEL_ID))
        if channel:
            await channel.send("🎉 **テスト成功！**\n楽天自動売買ボットの「声」が届きました！\n接続はバッチリです。次は証券サイトとの連携テストに進みましょう！")
            print("Message sent successfully!")
        else:
            print(f"Error: Could not find channel with ID {CHANNEL_ID}")
        
        await self.close()

async def main():
    if not TOKEN or not CHANNEL_ID:
        print("Error: DISCORD_TOKEN or DISCORD_CHANNEL_ID is missing in .env")
        return

    intents = discord.Intents.default()
    bot = TestBot(intents=intents)
    async with bot:
        await bot.start(TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"An error occurred: {e}")
