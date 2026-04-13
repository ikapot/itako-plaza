import subprocess
import os
import sys
import json
import logging

logger = logging.getLogger(__name__)

class BrowserFacade:
    """
    楽天ウォレットの API が動作しない環境で、
    ブラウザエージェントを使用して資産確認と注文執行を代行するクラス
    """
    def __init__(self, headless=True):
        self.headless = headless
        self.agent_path = os.path.join(os.path.dirname(__file__), "..", "..", "rakuten_browser_agent", "agent.py")

    def _call_agent(self, action: str, extra_args: list = None):
        """agent.py をサブプロセスで呼び出し JSON を取得する"""
        cmd = [sys.executable, self.agent_path, "--action", action]
        if self.headless:
            cmd.append("--headless")
        if extra_args:
            cmd.extend(extra_args)
            
        try:
            logger.info(f"⏳ Browser Agent 起動中... (Action: {action})")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                # 標準出力から最後の1行（JSON）を取得
                lines = result.stdout.strip().split("\n")
                for line in reversed(lines):
                    if line.startswith("{") and line.endswith("}"):
                        return json.loads(line)
                logger.error("❌ ブラウザからの JSON 出力が見つかりません。")
                return None
            else:
                logger.error(f"❌ エージェントエラー: {result.stderr}")
                return None
        except Exception as e:
            logger.error(f"❌ 呼び出しエラー: {e}")
            return None

    def get_equity_data(self):
        """有効証拠金情報を取得"""
        res = self._call_agent("status")
        if res and res.get("success"):
            # TODO: AI の返答内容（自然言語）から数値を正規表現などで抽出する
            # 現状はログに出力して確認
            logger.info(f"📊 資産状況（生データ）: {res.get('data')}")
            return res.get("data")
        return None

    def place_order(self, side: str, amount: float, symbol: str = "LTC/JPY"):
        """注文を実行"""
        args = ["--side", side, "--amount", str(amount), "--symbol", symbol]
        res = self._call_agent("order", args)
        if res and res.get("success"):
            logger.info(f"✅ 注文成功: {res.get('result')}")
            return True, res.get("result")
        return False, "Browser Order Failed"

# シングルトン的に利用
_executor = BrowserFacade(headless=True)

def get_browser_executor():
    return _executor
