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
from datetime import datetime
from dotenv import load_dotenv

# --- DNS & Windows Patch ---
try:
    sys.modules['aiodns'] = None
except Exception:
    pass
aiohttp.resolver.DefaultResolver = aiohttp.resolver.ThreadedResolver

import discord
from discord.ext import commands

# --- Load Config ---
dotenv_path = ".env.production"
load_dotenv(dotenv_path)

DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip().strip('"')
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"')
ALLOWED_USER_ID = int(os.getenv("ALLOWED_DISCORD_USER_ID", "0"))
WORKSPACE = os.path.abspath(os.path.dirname(__file__))

# --- Logger ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("MobileBridgeV2")

# --- Tool Definitions for Gemini ---

def list_dir(path: str = "."):
    """Lists files and directories in the specified path."""
    try:
        items = os.listdir(path)
        return json.dumps(items, ensure_ascii=False)
    except Exception as e:
        return str(e)

def view_file(path: str):
    """Reads the content of a file."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return str(e)

def write_file(path: str, content: str):
    """Writes content to a file. (This will be intercepted for approval in the agent logic)"""
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully written to {path}"
    except Exception as e:
        return str(e)

def run_command(command: str):
    """Executes a shell command. (This will be intercepted for approval)"""
    try:
        import subprocess
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        return f"STDOUT: {result.stdout}\nSTDERR: {result.stderr}"
    except Exception as e:
        return str(e)

# --- Agent Core (OpenRouter 経由) ---

SYSTEM_PROMPT = """あなたは 'Antigravity (AG)' と呼ばれる高度なエンジニアリングAIです。
Discord 経由でマスター（ユーザー）から指示を受け、PC上のファイルを操作したり、システムの状態を報告したりします。
あなたは以下の「アクション」語法を使って操作を要求できます。

**読み込み系（即座実行）:**
- [LIST_DIR: <パス>] -> ディレクトリの一覧を表示
- [VIEW_FILE: <パス>] -> ファイルの内容を表示

**変更系（承認待ち）:**
- [WRITE_FILE: <パス>]\n<内容全文>[/WRITE_FILE] -> ファイルを書き換え (差分を提示します)
- [RUN: <コマンド>] -> シェルコマンドを実行 (内容を提示します)

これらの記法を正確に使ってください。アクションが不要な場合は普通の日本語で回答してください。"""

class ItakoAgent:
    def __init__(self, api_key):
        self.api_key = api_key
        self.history = [{"role": "system", "content": SYSTEM_PROMPT}]

    def ask(self, user_message: str) -> str:
        """OpenRouter 経由で応答を生成する。"""
        self.history.append({"role": "user", "content": user_message})
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://itako-plaza.vercel.app",
            "X-Title": "Itako Mobile Bridge V2",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "google/gemma-4-31b-it:free",
            "messages": self.history
        }
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers, json=payload, timeout=30
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            self.history.append({"role": "assistant", "content": content})
            # 履歴が長すぎる場合は古いメッセージを切り捨てる・systemは常に保持
            if len(self.history) > 21:
                self.history = [self.history[0]] + self.history[-20:]
            return content
        except Exception as e:
            logger.error(f"OpenRouter Error: {e}")
            return None

# --- Discord Bot ---

class MobileBridgeBot(commands.Bot):
    def __init__(self, agent: ItakoAgent):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.agent = agent
        self.pending_action = None # { "type": "write", "path": "...", "content": "..." }

    async def setup_hook(self):
        """discord.py の内部 HTTP クライアントに IPv4 強制コネクターを適用する。"""
        resolver = aiohttp.ThreadedResolver()
        connector = aiohttp.TCPConnector(
            resolver=resolver,
            family=socket.AF_INET,
            ssl=None
        )
        # discord.py v2 の内部 http オブジェクトへコネクターを注入
        self.http.connector = connector
        self.http.connector_owner = True
        logger.info("setup_hook: AF_INET connector injected into discord.http.")

    async def on_ready(self):
        logger.info(f"✅ Bridge V2 Online: {self.user}")
        await self.change_presence(activity=discord.Game(name="AG Direct Access"))

    async def on_message(self, message):
        if message.author == self.user:
            return
        
        # ユーザー制限
        if ALLOWED_USER_ID != 0 and message.author.id != ALLOWED_USER_ID:
            return

        # 承認待ち状態の処理
        if self.pending_action:
            if message.content.lower() in ["ok", "はい", "実行", "y"]:
                await self.execute_pending(message)
            elif message.content.lower() in ["ng", "いいえ", "キャンセル", "n"]:
                self.pending_action = None
                await message.reply("🛑 操作をキャンセルしました。")
            else:
                await message.reply("⚠️ 現在承認待ちの操作があります。「OK」か「NG」で答えてください。")
            return

        # 通常の指示処理
        if isinstance(message.channel, discord.DMChannel) or self.user.mentioned_in(message):
            await self.process_ag_instruction(message)

    async def process_ag_instruction(self, message):
        async with message.channel.typing():
            prompt = message.content.replace(f"<@{self.user.id}>", "").strip()
            response_text = await asyncio.to_thread(self.agent.ask, prompt)
            
            if not response_text:
                await message.reply("❌ AGの思考プロセスでエラーが発生しました。")
                return

            await self.parse_and_execute(message, response_text)

    async def parse_and_execute(self, message, text: str):
        """AG の返答を解析し、アクションがあればインターセプトする。"""
        import re

        # [LIST_DIR: ...] の処理
        m = re.search(r'\[LIST_DIR:\s*(.+?)\]', text)
        if m:
            path = m.group(1).strip()
            result = list_dir(path)
            reply = f"📁 `{path}` の内容:\n```\n{result}\n```"
            # 長すぎる場合は切り詰める
            if len(reply) > 1900: reply = reply[:1900] + "\n...(省略)"
            await message.reply(reply)
            return

        # [VIEW_FILE: ...] の処理
        m = re.search(r'\[VIEW_FILE:\s*(.+?)\]', text)
        if m:
            path = m.group(1).strip()
            result = view_file(path)
            reply = f"📄 `{path}`:\n```\n{result}\n```"
            if len(reply) > 1900: reply = reply[:1800] + "\n...(省略)"
            await message.reply(reply)
            return

        # [WRITE_FILE: ...] ... [/WRITE_FILE] の処理
        m = re.search(r'\[WRITE_FILE:\s*(.+?)\]\s*\n([\s\S]+?)\[/WRITE_FILE\]', text)
        if m:
            path = m.group(1).strip()
            new_content = m.group(2)
            old_content = view_file(path) if os.path.exists(path) else ""
            diff = "".join(difflib.unified_diff(
                old_content.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f'old/{os.path.basename(path)}',
                tofile=f'new/{os.path.basename(path)}'
            ))
            self.pending_action = {"type": "write", "path": path, "content": new_content}
            msg = f"📝 **書き換え提案:** `{path}`\n```diff\n{diff if diff else '(新規作成)'}\n```\n実行してよろしいですか？ **(OK/NG)**"
            if len(msg) > 1900: msg = msg[:1800] + "\n...(省略)...\n実行してよろしいですか？ **(OK/NG)**"
            await message.reply(msg)
            return

        # [RUN: ...] の処理
        m = re.search(r'\[RUN:\s*(.+?)\]', text)
        if m:
            cmd = m.group(1).strip()
            self.pending_action = {"type": "command", "command": cmd}
            await message.reply(f"💻 **コマンド実行提案:**\n`{cmd}`\n実行してよろしいですか？ **(OK/NG)**")
            return

        # 通常テキスト返答
        if len(text) > 1900: text = text[:1900] + "..."
        await message.reply(text)

    async def handle_gemini_response(self, message, response):
        # Function Calling のチェック
        for part in response.candidates[0].content.parts:
            if fn := part.function_call:
                # ツール呼び出しをインターセプト
                if fn.name == "write_file":
                    args = fn.args
                    path = args['path']
                    new_content = args['content']
                    
                    old_content = ""
                    if os.path.exists(path):
                        with open(path, "r", encoding="utf-8") as f:
                            old_content = f.read()
                    
                    # Diff 生成
                    diff = "".join(difflib.unified_diff(
                        old_content.splitlines(keepends=True),
                        new_content.splitlines(keepends=True),
                        fromfile=f'old/{os.path.basename(path)}',
                        tofile=f'new/{os.path.basename(path)}'
                    ))
                    
                    self.pending_action = {"type": "write", "path": path, "content": new_content, "fn_id": "temp"}
                    
                    msg = f"📝 **ファイルの書き換え提案:** `{path}`\n```diff\n{diff if diff else '(新規作成)'}\n```\n実行してよろしいですか？ (OK/NG)"
                    # Discord の 2000文字制限対策
                    if len(msg) > 1900:
                        msg = msg[:1800] + "\n... (Diff too long) ...\n実行してよろしいですか？ (OK/NG)"
                    await message.reply(msg)
                    return
                
                elif fn.name == "run_command":
                    cmd = fn.args['command']
                    self.pending_action = {"type": "command", "command": cmd, "fn_id": "temp"}
                    await message.reply(f"💻 **コマンド実行提案:**\n`{cmd}`\n実行してよろしいですか？ (OK/NG)")
                    return
                
                else:
                    # 読み込み系はそのまま実行
                    result = self.execute_tool_immediately(fn.name, fn.args)
                    # 結果をAGに戻して続きを聞く
                    next_resp = self.agent.chat.send_message(
                        genai.types.Content(
                            parts=[genai.types.Part(
                                function_response=genai.types.FunctionResponse(name=fn.name, response={'result': result})
                            )]
                        )
                    )
                    await self.handle_gemini_response(message, next_resp)
                    return

        # ツール呼び出しが無ければテキスト返答
        await message.reply(response.text)

    def execute_tool_immediately(self, name, args):
        if name == "list_dir": return list_dir(**args)
        if name == "view_file": return view_file(**args)
        return "Unknown tool"

    async def execute_pending(self, message):
        action = self.pending_action
        self.pending_action = None
        try:
            if action['type'] == "write":
                res = write_file(action['path'], action['content'])
            elif action['type'] == "command":
                res = run_command(action['command'])
            else:
                res = "Unknown action"
            reply = f"✅ **実行完了:**\n{res}"
            if len(reply) > 1900: reply = reply[:1900]
            await message.reply(reply)
        except Exception as e:
            await message.reply(f"❌ 実行エラー: {e}")

async def main():
    agent = ItakoAgent(OPENROUTER_API_KEY)
    bot = MobileBridgeBot(agent)
    async with bot:
        await bot.start(DISCORD_TOKEN)

if __name__ == "__main__":
    if not DISCORD_TOKEN or not OPENROUTER_API_KEY:
        print("Error: DISCORD_BOT_TOKEN and OPENROUTER_API_KEY must be set in .env.production")
        sys.exit(1)

    asyncio.run(main())
