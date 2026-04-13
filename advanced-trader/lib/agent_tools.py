import os
import difflib
import logging
from playwright.async_api import async_playwright
import sys

# パス調整
sys.path.append(os.path.dirname(__file__))
from rakuten_api import RakutenWalletClient

logger = logging.getLogger("AgentTools")

class AgentTools:
    def __init__(self, wallet_client=None):
        self.wallet = wallet_client
        self.workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    def _resolve_path(self, path: str) -> str:
        """パスをワークスペース内に限定する"""
        abs_path = os.path.abspath(os.path.join(self.workspace_root, path))
        if not abs_path.startswith(self.workspace_root):
            raise PermissionError(f"Access denied for path: {path}")
        return abs_path

    def read_file(self, path: str) -> str:
        """ファイルの内容を読み取る"""
        full_path = self._resolve_path(path)
        if not os.path.exists(full_path):
            return f"Error: File not found at {path}"
        with open(full_path, "r", encoding="utf-8") as f:
            return f.read()

    def generate_diff(self, path: str, new_content: str) -> str:
        """現在の内容と新しい内容の差分を生成する"""
        old_content = self.read_file(path)
        if old_content.startswith("Error:"):
            return "New File (No previous content)"
        
        diff = difflib.unified_diff(
            old_content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{path}",
            tofile=f"b/{path}"
        )
        return "".join(diff)

    def write_file(self, path: str, content: str) -> str:
        """ファイルに内容を書き込む"""
        full_path = self._resolve_path(path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote to {path}"

    async def take_screenshot(self, url="http://localhost:5173/trade") -> str:
        """指定されたURLのスクリーンショットを撮影する"""
        path = "agent_snap.png"
        async with async_playwright() as p:
            try:
                browser = await p.chromium.launch()
                page = await browser.new_page(viewport={'width': 1280, 'height': 800})
                await page.goto(url, timeout=10000)
                await page.wait_for_timeout(2000) # アニメーション待ち
                await page.screenshot(path=path)
                await browser.close()
                return path
            except Exception as e:
                logger.error(f"Screenshot failed: {e}")
                return f"Error: {str(e)}"

    def get_status(self) -> dict:
        """システムの現在の概況を取得する"""
        status = {"timestamp": os.popen("date /t").read().strip() + " " + os.popen("time /t").read().strip()}
        if self.wallet:
            try:
                margin = self.wallet.get_margin_info()
                if isinstance(margin, list) and len(margin) > 0:
                    status["equity"] = margin[0].get("equity", 0)
                
                positions = self.wallet.get_cfd_positions()
                status["positions"] = positions
            except Exception as e:
                status["wallet_error"] = str(e)
        
        # ログファイルの一部を取得（最後10行）
        log_path = os.path.join(self.workspace_root, "test_api.log")
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8") as f:
                status["recent_logs"] = f.readlines()[-10:]
        
        return status
