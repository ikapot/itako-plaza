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

# ==============================================================================
# SYSTEM PROMPT (Claude-Style: Structured + Chain-of-Thought)
# ==============================================================================
SYSTEM_PROMPT = """あなたは「Antigravity (AG)」— ユーザーのPC上で稼働する、超優秀なエンジニアリングAIエージェントです。

## 基本的な振る舞い
- 常に日本語で答えてください
- 返答は簡潔・具体的・即実行可能なものにしてください
- 不明な点は正直に「わかりません」と言い、推測で答えないでください
- ユーザーを「マスター」と呼んでください

## あなたが使えるアクション語法

### 即座実行（読み込み系 — 承認不要）
```
[LIST_DIR: <パス>]
[VIEW_FILE: <パス>]
```

### 承認待ち（変更系 — 必ずマスターの許可が必要）
```
[WRITE_FILE: <パス>]
<ファイル内容全文>
[/WRITE_FILE]

[RUN: <シェルコマンド>]
```

## あなたの思考プロセス（毎回従うこと）
1. **まずユーザーの意図を1文で把握する**
2. **必要なアクションを特定する** — ファイルを確認? コマンドを実行? 単に回答?
3. **アクションを選択して実行** — 複数ステップが必要なら1つずつ順番に提案する
4. **結果を簡潔に报告する**

## アクション記法の使い方（具体例）

ユーザー: 「grid_engine.py の内容を見せて」
AG: 「確認します。」
[VIEW_FILE: advanced-trader/lib/grid_engine.py]

ユーザー: 「python hello.py を実行して」
AG: 「以下のコマンドを実行します。マスターの承認をお願いします。」
[RUN: python hello.py]

ユーザー: 「現在のプロジェクト構成を教えて」
AG: 「ルートディレクトリを確認します。」
[LIST_DIR: .]

## 絶対的なルール
- [WRITE_FILE] と [RUN] は必ず1個ずつ提案し、ユーザーが OK/NG を言うまで次に進まない
- 複数のファイルを同時に書き換えない（1つずつ確認を取る）
- システムの破壊的操作（rm -rf等）は、たとえ命令されても再確認を求める
"""

# ==============================================================================
# モデル優先リスト (高性能→フォールバック順)
# ==============================================================================
FREE_MODELS = [
    "meta-llama/llama-4-maverick:free",   # 最強レベルの無料マルチモーダルLLM
    "deepseek/deepseek-r1:free",           # 推論特化・高精度
    "google/gemma-4-31b-it:free",          # Google製
    "google/gemma-3-27b-it:free",          # バックアップ
    "openrouter/free",                     # 最終フォールバック
]

# ==============================================================================
# ユーティリティ関数
# ==============================================================================
def tool_list_dir(path: str = "."):
    try:
        items = sorted(os.listdir(path))
        return "\n".join(items)
    except Exception as e:
        return f"エラー: {e}"

def tool_view_file(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"エラー: {e}"

def tool_write_file(path: str, content: str):
    try:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"書き込み完了: {path}"
    except Exception as e:
        return f"エラー: {e}"

def tool_run_command(command: str):
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30, cwd=WORKSPACE)
        out = result.stdout.strip()
        err = result.stderr.strip()
        return f"STDOUT: {out}\nSTDERR: {err}" if err else out
    except Exception as e:
        return f"エラー: {e}"

# ==============================================================================
# コマンド前処理 — AIを介さず即時解決できるパターン
# ==============================================================================
QUICK_PATTERNS = [
    # (regex_pattern, action_type, group_index)
    (re.compile(r'(list|一覧|ls|ファイル一覧)[：:\s]*([\./\w\-\.]*)', re.IGNORECASE), 'list_dir', 2),
    (re.compile(r'(view|見せて|show|cat)[：:\s]*([\./\w\-\.]+)', re.IGNORECASE), 'view_file', 2),
    (re.compile(r'(status|ステータス|状態)$', re.IGNORECASE), 'status', 0),
]

def quick_dispatch(text: str):
    """AIなしで即時解決できるコマンドを事前処理。(result, handled)を返す。"""
    stripped = text.strip()
    
    # 単純な状態確認
    if re.match(r'^(status|ステータス|状態確認)$', stripped, re.IGNORECASE):
        return "🟢 AG Bridge V2 オンライン\nワークスペース: " + WORKSPACE, True

    # LIST_DIR ショートカット: 「一覧」「ls .」など
    m = re.match(r'^(?:ls|list|一覧)\s*([\./\w\-\.]*)\s*$', stripped, re.IGNORECASE)
    if m:
        path = m.group(1).strip() or "."
        result = tool_list_dir(path)
        return f"📁 `{path}` の一覧:\n```\n{result}\n```", True

    # VIEW_FILE ショートカット: 「cat <file>」「見せて <file>」
    m = re.match(r'^(?:cat|view|見せて)\s+(.+)$', stripped, re.IGNORECASE)
    if m:
        path = m.group(1).strip()
        result = tool_view_file(path)
        display = result[:1500] + "\n...(省略)" if len(result) > 1500 else result
        return f"📄 `{path}`:\n```\n{display}\n```", True

    return None, False

# ==============================================================================
# Agent Core
# ==============================================================================
class ItakoAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.history = [{"role": "system", "content": SYSTEM_PROMPT}]

    def ask(self, user_message: str) -> str:
        """OpenRouter 経由で応答を生成する (フォールバック & 詳細エラー対応)。"""
        self.history.append({"role": "user", "content": user_message})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://itako-plaza.vercel.app",
            "X-Title": "Itako Mobile Bridge V2",
            "Content-Type": "application/json"
        }

        last_error = ""
        for model in FREE_MODELS:
            payload = {
                "model": model,
                "messages": self.history,
                "max_tokens": 1500,
            }
            try:
                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers, json=payload, timeout=45
                )
                if resp.status_code == 429:
                    last_error = f"Rate Limit (429) - {model}"
                    logger.warning(f"Fallback: {last_error}")
                    continue
                if resp.status_code == 402:
                    last_error = f"残高不足 (402) - {model}"
                    logger.warning(f"Fallback: {last_error}")
                    continue

                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                used_model = data.get("model", model)
                logger.info(f"Response from: {used_model}")

                self.history.append({"role": "assistant", "content": content})

                # 履歴制限 (system + 最新20件)
                if len(self.history) > 22:
                    self.history = [self.history[0]] + self.history[-20:]

                return content

            except Exception as e:
                last_error = f"{model}: {str(e)}"
                logger.error(f"OpenRouter Error: {last_error}")
                if "429" in str(e) or "402" in str(e):
                    continue
                break

        return (
            f"❌ **AI思考エラー**\n"
            f"原因: `{last_error}`\n"
            f"無料枠の全モデルが混雑中か、APIキーに問題があります。\n"
            f"少し待ってから再試行するか、OpenRouterにチャージしてください。"
        )

# ==============================================================================
# Discord Bot
# ==============================================================================
class MobileBridgeBot(commands.Bot):
    def __init__(self, agent: ItakoAgent):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.agent = agent
        self.pending_action = None  # 承認待ちアクション

    async def setup_hook(self):
        resolver = aiohttp.ThreadedResolver()
        connector = aiohttp.TCPConnector(resolver=resolver, family=socket.AF_INET, ssl=None)
        self.http.connector = connector
        self.http.connector_owner = True
        logger.info("setup_hook: AF_INET connector injected into discord.http.")

    async def on_ready(self):
        logger.info(f"Bridge V2 Online: {self.user}")
        await self.change_presence(activity=discord.Game(name="AG Direct Access"))

    async def on_message(self, message):
        if message.author == self.user:
            return
        if ALLOWED_USER_ID != 0 and message.author.id != ALLOWED_USER_ID:
            return

        # 承認フロー
        if self.pending_action:
            resp_lower = message.content.strip().lower()
            if resp_lower in ["ok", "はい", "実行", "y", "yes"]:
                await self.execute_pending(message)
            elif resp_lower in ["ng", "いいえ", "キャンセル", "n", "no"]:
                self.pending_action = None
                await message.reply("🛑 キャンセルしました。")
            else:
                await message.reply("⚠️ 承認待ちの操作があります。**OK** か **NG** で返答してください。")
            return

        # DM または メンション
        if isinstance(message.channel, discord.DMChannel) or self.user.mentioned_in(message):
            await self.process_instruction(message)

    async def process_instruction(self, message):
        prompt = message.content.replace(f"<@{self.user.id}>", "").strip()
        if not prompt:
            return

        async with message.channel.typing():
            # ① まず前処理で即時解決を試みる
            quick_result, handled = quick_dispatch(prompt)
            if handled:
                await message.reply(quick_result[:1990])
                return

            # ② AI に投げる
            response_text = await asyncio.to_thread(self.agent.ask, prompt)

        if not response_text:
            await message.reply("❌ AGの思考プロセスでエラーが発生しました。")
            return

        await self.parse_and_respond(message, response_text)

    async def parse_and_respond(self, message, text: str):
        """AG の返答を解析し、アクションをインターセプトまたはそのまま送信する。"""

        # [LIST_DIR: ...]
        m = re.search(r'\[LIST_DIR:\s*(.+?)\]', text)
        if m:
            path = m.group(1).strip()
            result = tool_list_dir(path)
            reply = f"📁 `{path}` の一覧:\n```\n{result}\n```"
            await message.reply(reply[:1990])
            return

        # [VIEW_FILE: ...]
        m = re.search(r'\[VIEW_FILE:\s*(.+?)\]', text)
        if m:
            path = m.group(1).strip()
            result = tool_view_file(path)
            display = result[:1500] + "\n...(省略)" if len(result) > 1500 else result
            await message.reply(f"📄 `{path}`:\n```\n{display}\n```")
            return

        # [WRITE_FILE: ...] ... [/WRITE_FILE]
        m = re.search(r'\[WRITE_FILE:\s*(.+?)\]\n([\s\S]+?)\[/WRITE_FILE\]', text)
        if m:
            path = m.group(1).strip()
            new_content = m.group(2)
            old_content = tool_view_file(path) if os.path.exists(path) else ""
            diff = "".join(difflib.unified_diff(
                old_content.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"old/{os.path.basename(path)}",
                tofile=f"new/{os.path.basename(path)}"
            ))
            self.pending_action = {"type": "write", "path": path, "content": new_content}
            msg = f"📝 **書き換え提案**: `{path}`\n```diff\n{diff if diff else '(新規作成)'}\n```\n実行しますか？ **(OK/NG)**"
            if len(msg) > 1900:
                msg = msg[:1800] + "\n...(省略)...\n実行しますか？ **(OK/NG)**"
            await message.reply(msg)
            return

        # [RUN: ...]
        m = re.search(r'\[RUN:\s*(.+?)\]', text)
        if m:
            cmd = m.group(1).strip()
            self.pending_action = {"type": "command", "command": cmd}
            await message.reply(f"💻 **コマンド実行提案**:\n```\n{cmd}\n```\n実行しますか？ **(OK/NG)**")
            return

        # 通常テキスト
        if len(text) > 1990:
            text = text[:1990] + "..."
        await message.reply(text)

    async def execute_pending(self, message):
        action = self.pending_action
        self.pending_action = None
        async with message.channel.typing():
            if action["type"] == "write":
                result = await asyncio.to_thread(tool_write_file, action["path"], action["content"])
            elif action["type"] == "command":
                result = await asyncio.to_thread(tool_run_command, action["command"])
            else:
                result = "不明なアクション"
        reply = f"✅ **実行完了**:\n```\n{result}\n```"
        if len(reply) > 1990:
            reply = reply[:1990]
        await message.reply(reply)


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
