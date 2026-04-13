import subprocess
import os
import sys
import logging

logger = logging.getLogger(__name__)

def execute_browser_order(side: str, amount: float, symbol: str = "LTC/JPY"):
    """
    rakuten-browser-agent/agent.py を呼び出してブラウザ注文を実行する
    """
    logger.info(f"🌐 ブラウザ執行を開始します: {side} {amount} {symbol}")
    
    # agent.py のパスを取得
    agent_path = os.path.join(os.path.dirname(__file__), "..", "..", "rakuten-browser-agent", "agent.py")
    
    # 外部コマンドとして実行 (非同期実行をサポートするために subprocess を使用、
    # または直接 import して asyncio.run する形も可能だが、
    # 既存の grid_engine が非同期ではないため一旦同期的な呼び出しを目指す)
    
    env = os.environ.copy()
    # 必要な環境変数をセット
    # RAKUTEN_SEC_USER_ID, RAKUTEN_SEC_PASSWORD は .env から読み込まれている前提
    
    # コマンドを構築
    # 本来は asyncio を使いたいが、grid_engine との兼ね合いで subprocess でスクリプトを実行
    cmd = [
        sys.executable,
        agent_path,
        "--side", side,
        "--amount", str(amount),
        "--symbol", symbol
    ]
    
    try:
        logger.info(f"⏳ エージェントを起動中... (Side: {side})")
        # 実行 (完了まで待機)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            logger.info("✅ ブラウザ注文が完了しました。")
            return True, result.stdout
        else:
            logger.error(f"❌ ブラウザ注文に失敗しました: {result.stderr}")
            return False, result.stderr
            
    except Exception as e:
        logger.error(f"❌ 執行エラー: {e}")
        return False, str(e)
