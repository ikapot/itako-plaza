import sys
import os
import json
import logging
import asyncio
import difflib
import socket
import aiohttp
import aiohttp.resolver
import requests
import re
import subprocess
from datetime import datetime
from typing import Optional, Tuple, List
from dotenv import load_dotenv

# --- DNS & Windows Patch ---
# Windows環境での非同期挙動の安定化
try:
    sys.modules['aiodns'] = None
except Exception:
    pass
aiohttp.resolver.DefaultResolver = aiohttp.resolver.ThreadedResolver

import discord
from discord.ext import commands

# ==============================================================================
# 1. CONFIGURATION
# ==============================================================================
class Config:
    """環境変数および定数管理クラス"""
    load_dotenv(".env.production")
    
    TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip().strip('"')
    API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"')
    ALLOWED_USER_ID = int(os.getenv("ALLOWED_DISCORD_USER_ID", "0"))
    WORKSPACE = os.path.abspath(os.path.dirname(__file__))
    
    # AIモデル優先リスト
    FREE_MODELS = [
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemma-4-31b-it:free",
        "openrouter/free",
    ]
    
    # 応答制限
    MAX_DISCORD_MSG = 1950
    HISTORY_LIMIT = 20

# --- Logger ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("MobileBridgeV2")

# ==============================================================================
# 2. TOOLS
# ==============================================================================
class BridgeTools:
    """PC上の各種操作を行う静的メソッド群"""
    
    @staticmethod
    def list_dir(path: str = ".") -> str:
        try:
            return "\n".join(sorted(os.listdir(path)))
        except Exception as e:
            return f"Error: {e}"

    @staticmethod
    def view_file(path: str) -> str:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            return f"Error: {e}"

    @staticmethod
    def write_file(path: str, content: str) -> str:
        try:
            full_path = os.path.abspath(path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            return f"Success: Written to {path}"
        except Exception as e:
            return f"Error: {e}"

    @staticmethod
    def run_command(command: str) -> str:
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True, 
                timeout=45, cwd=Config.WORKSPACE
            )
            out = result.stdout.strip()
            err = result.stderr.strip()
            return f"OUT: {out}\nERR: {err}" if err else out
        except Exception as e:
            return f"Error: {e}"

# ==============================================================================
# 3. AGENT CORE
# ==============================================================================
SYSTEM_PROMPT = """あなたは「Antigravity (AG)」— エンニアリングAIです。
[LIST_DIR: <path>], [VIEW_FILE: <path>], [WRITE_FILE: <path>]<content>[/WRITE_FILE], [RUN: <cmd>] 
の記法を用いてPCを操作してください。常に日本語で簡潔に答え、実行を伴う変更は必ず承認を求めてください。"""

class ItakoAgent:
    def __init__(self):
        self.history = [{"role": "system", "content": SYSTEM_PROMPT}]

    def ask(self, user_message: str) -> str:
        self.history.append({"role": "user", "content": user_message})
        
        headers = {
            "Authorization": f"Bearer {Config.API_KEY}",
            "HTTP-Referer": "https://itako-plaza.vercel.app",
            "X-Title": "Itako Mobile Bridge V2",
        }

        last_err = ""
        for model in Config.FREE_MODELS:
            try:
                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json={"model": model, "messages": self.history, "max_tokens": 1500},
                    timeout=50
                )
                if resp.status_code in [429, 402]:
                    last_err = f"{model} status {resp.status_code}"
                    continue
                
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
                self.history.append({"role": "assistant", "content": content})
                
                # 履歴の切り詰め
                if len(self.history) > Config.HISTORY_LIMIT + 2:
                    self.history = [self.history[0]] + self.history[-(Config.HISTORY_LIMIT):]
                
                return content
            except Exception as e:
                last_err = f"{model} error: {e}"
                if resp.status_code == 429: continue
                break

        return f"❌ AIエラー: {last_err}\n無料枠が混雑しています。"

# ==============================================================================
# 4. DISCORD BOT
# ==============================================================================
class MobileBridgeBot(commands.Bot):
    def __init__(self, agent: ItakoAgent):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.agent = agent
        self.pending = None

        # 正規表現のプリコンパイル
        self.re_list = re.compile(r'\[LIST_DIR:\s*(.+?)\]')
        self.re_view = re.compile(r'\[VIEW_FILE:\s*(.+?)\]')
        self.re_write = re.compile(r'\[WRITE_FILE:\s*(.+?)\]\n([\s\S]+?)\[/WRITE_FILE\]')
        self.re_run = re.compile(r'\[RUN:\s*(.+?)\]')

    async def setup_hook(self):
        connector = aiohttp.TCPConnector(resolver=aiohttp.ThreadedResolver(), family=socket.AF_INET)
        self.http.connector = connector
        self.http.connector_owner = True

    async def on_ready(self):
        logger.info(f"Bot Online: {self.user}")

    async def on_message(self, message):
        if message.author == self.user: return
        if Config.ALLOWED_USER_ID != 0 and message.author.id != Config.ALLOWED_USER_ID: return

        # 1. 承認待ちの処理
        if self.pending:
            ans = message.content.strip().lower()
            if ans in ["ok", "はい", "y", "yes"]:
                await self.execute_pending(message)
            elif ans in ["ng", "キャンセル", "n", "no"]:
                self.pending = None
                await message.reply("🛑 キャンセルしました。")
            return

        # 2. 指示の処理
        if isinstance(message.channel, discord.DMChannel) or self.user.mentioned_in(message):
            await self.handle_instruction(message)

    async def handle_instruction(self, message):
        prompt = message.content.replace(f"<@{self.user.id}>", "").strip()
        if not prompt: return

        async with message.channel.typing():
            # 前処理 (AIなし)
            if re.match(r'^(ls|list|一覧)\s*([\./\w]*)$', prompt, re.I):
                p = re.match(r'^(ls|list|一覧)\s*([\./\w]*)$', prompt, re.I).group(2) or "."
                await message.reply(f"📁 `{p}`:\n```\n{BridgeTools.list_dir(p)}\n```")
                return

            # AI思考
            resp = await asyncio.to_thread(self.agent.ask, prompt)
            if not resp:
                await message.reply("❌ 思考エラーが発生しました。")
                return

        await self.process_actions(message, resp)

    async def process_actions(self, message, text: str):
        # Read Actions (即時)
        if m := self.re_list.search(text):
            p = m.group(1).strip()
            await message.reply(f"📁 `{p}`:\n```\n{BridgeTools.list_dir(p)}\n```")
            return
        if m := self.re_view.search(text):
            p = m.group(1).strip()
            res = BridgeTools.view_file(p)
            await message.reply(f"📄 `{p}`:\n```\n{res[:1800]}\n```")
            return

        # Write/Run Actions (承認待ち)
        if m := self.re_write.search(text):
            p, content = m.group(1).strip(), m.group(2)
            old = BridgeTools.view_file(p) if os.path.exists(p) else ""
            diff = "".join(difflib.unified_diff(old.splitlines(1), content.splitlines(1)))
            self.pending = {"type": "write", "path": p, "content": content}
            await message.reply(f"📝 **書き換え提案**: `{p}`\n```diff\n{diff if diff else '(New)'}\n```\n実行しますか？ (OK/NG)")
            return
        if m := self.re_run.search(text):
            cmd = m.group(1).strip()
            self.pending = {"type": "command", "cmd": cmd}
            await message.reply(f"💻 **コマンド実行提案**:\n`{cmd}`\n実行しますか？ (OK/NG)")
            return

        # 通常返答
        await message.reply(text[:Config.MAX_DISCORD_MSG])

    async def execute_pending(self, message):
        p = self.pending
        self.pending = None
        async with message.channel.typing():
            if p["type"] == "write": res = BridgeTools.write_file(p["path"], p["content"])
            else: res = BridgeTools.run_command(p["cmd"])
        await message.reply(f"✅ **完了**:\n```\n{res[:Config.MAX_DISCORD_MSG]}\n```")

if __name__ == "__main__":
    if not Config.TOKEN or not Config.API_KEY:
        print("Error: Missing DISCORD_BOT_TOKEN or OPENROUTER_API_KEY")
        sys.exit(1)
    asyncio.run(MobileBridgeBot(ItakoAgent()).start(Config.TOKEN))
