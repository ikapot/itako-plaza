import os
import sys
import time
import json
import logging
import pandas as pd
import ccxt
from datetime import datetime
from dotenv import load_dotenv
from lib.rakuten_api import RakutenWalletClient
from lib.engine import RiskManager, AdvancedExitManager, preprocess_data
from lib.utils import send_discord
from lib.gist_sync import GistSync

# --- Logger 設定 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("TradingBot_OneShot")

# --- 設定 ---
POSITION_FILE = "position.json"

# --- 環境変数のロード ---
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(dotenv_path=env_path)

# 設定の取得
DRY_RUN = os.getenv("DRY_RUN", "true").lower() == "true"
WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
GITHUB_PAT = os.getenv("GITHUB_PAT_GIST")
GIST_ID = os.getenv("GIST_ID")

def run_once():
    logger.info("🚀 楽天ウォレット・クオンツボット実行 (One-Shot Mode)")
    
    api_key = os.getenv("WALLET_API_KEY")
    api_secret = os.getenv("WALLET_API_SECRET")
    client = RakutenWalletClient(api_key, api_secret)
    exchange = ccxt.binance()
    gist = GistSync(GITHUB_PAT, GIST_ID, POSITION_FILE)

    try:
        # 1. 状態（ポジション）の読込 (Gist -> Local)
        pos = gist.load()
        if pos:
            logger.info(f"📊 ポジションデータを Gist から読込成功: {pos}")
        
        # 2. 資産状況の確認
        margin_info = client.get_margin_info()
        if "error" in margin_info:
            logger.error(f"❌ 認証エラーまたはAPIエラー: {margin_info}")
            send_discord(WEBHOOK_URL, "APIエラー", f"楽天ウォレットへの接続が失敗しました\n内容: {margin_info}", 0xff0000, DRY_RUN)
            return

        equity = float(margin_info.get("equity", 0))
        btc_balance = client.get_btc_balance()
        
        # 3. マーケットデータの取得 (Binance BTC/USDT + 150 JPY)
        ohlcv = exchange.fetch_ohlcv("BTC/USDT", timeframe="1h", limit=50)
        df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        for col in ["open", "high", "low", "close"]:
            df[col] = df[col] * 150.0  # 暫定 JPY 換算
        df = preprocess_data(df)
        current_price = df.iloc[-1]["close"]
        atr = df.iloc[-1]["ATR_22"]

        # 4. ポジション判定
        # 実残高 または 永続化されたポジションデータがある場合
        if btc_balance > 0.001 or pos:
            if not pos:
                logger.warning("📉 未知のポジションを検知。現在の価格で追跡開始。")
                pos = {"entry_price": current_price, "initial_qty": btc_balance, "scaled_out": False}
                gist.save(pos)
            
            # エグジットマネージャーの初期化
            exit_mgr = AdvancedExitManager(pos["entry_price"], pos["initial_qty"])
            if pos.get("scaled_out"):
                exit_mgr.is_half_closed = True
            
            signals = exit_mgr.get_exit_signals(df, current_price)
            
            # A. 分割利確 (Scaling Out)
            if signals["scale_out"] and not pos.get("scaled_out"):
                msg = f"🔥 分割利確 (TP1) 到達!\n価格: ¥{current_price:,.0f}\n50% ポジション決済。"
                send_discord(WEBHOOK_URL, "分割利確シグナル", msg, 0xffaa00, DRY_RUN)
                if not DRY_RUN:
                    client.place_order(7, "SELL", btc_balance / 2)
                pos["scaled_out"] = True
                gist.save(pos)

            # B. 全決済 (Peak Exit / Chandelier)
            if signals["peak_exit"] or signals["chandelier_exit"]:
                reason = "🚀 天井反転検知" if signals["peak_exit"] else "🛡️ トレーリングストップ(ATR)抵触"
                msg = f"🚨 【決済実行】 {reason}\n価格: ¥{current_price:,.0f}\n全決済完了。"
                send_discord(WEBHOOK_URL, "全ポジション決済", msg, 0xff4444, DRY_RUN)
                if not DRY_RUN:
                    client.place_order(7, "SELL", btc_balance)
                pos = None
                # Gist空ファイルにするかファイルを削除する（今回の実装では None なら削除しないが、空のJSONを保存か）
                gist.save({}) 
                return

            # C. 定時報告
            if pos:
                profit_pct = ((current_price - pos["entry_price"]) / pos["entry_price"]) * 100
                status_report = (
                    f"**BTC/JPY**: ¥{current_price:,.0f}\n"
                    f"**買付価格**: ¥{pos['entry_price']:,.0f}\n"
                    f"**損益状況**: {profit_pct:+.2f}%\n"
                    f"**決済ライン**: ATRストップ ¥{exit_mgr.trailing_stop_line:,.0f}"
                )
                send_discord(WEBHOOK_URL, "監視ステータス", status_report, 0x00ff00, DRY_RUN)

        else:
            # ポジションなし: 新規エントリー推奨サイズの算出
            rm = RiskManager(risk_percent=0.02)
            stop_loss = current_price - (atr * 3)
            opt_size = rm.calculate_position_size(equity, current_price, stop_loss)
            logger.info(f"💡 推奨ロット: {opt_size:.6f} BTC (SL: {stop_loss:,.0f})")

    except Exception as e:
        logger.error(f"❌ 実行エラー: {e}")
        send_discord(WEBHOOK_URL, "ボットエラー", f"詳細: {str(e)}", 0x333333, DRY_RUN)

if __name__ == "__main__":
    run_once()
