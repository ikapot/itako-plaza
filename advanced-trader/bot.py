import os
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

# --- Logger 設定 ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("TradingBot")

# --- 設定 ---
LOOP_INTERVAL = 300  # 5分ごとにチェック
POSITION_FILE = "position.json"

# --- 環境変数のロード ---
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(dotenv_path=env_path)

# 設定の取得
DRY_RUN = os.getenv("DRY_RUN", "true").lower() == "true"
WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

def load_position():
    if os.path.exists(POSITION_FILE):
        with open(POSITION_FILE, "r") as f:
            try:
                return json.load(f)
            except:
                return None
    return None

def save_position(data):
    with open(POSITION_FILE, "w") as f:
        json.dump(data, f, indent=4)

def run_bot():
    logger.info("🚀 楽天ウォレット・クオンツボット起動")
    status_msg = f"モード: {'🧪 模擬取引 (DRY RUN)' if DRY_RUN else '💹 本番取引 (LIVE)'}\nチェック間隔: {LOOP_INTERVAL}s"
    send_discord(WEBHOOK_URL, "ボット起動", status_msg, 0x00ccff, DRY_RUN)

    api_key = os.getenv("WALLET_API_KEY")
    api_secret = os.getenv("WALLET_API_SECRET")
    client = RakutenWalletClient(api_key, api_secret)
    exchange = ccxt.binance()

    while True:
        try:
            # 1. 資産状況の確認
            margin_info = client.get_margin_info()
            equity = float(margin_info.get("equity", 0))
            btc_balance = client.get_btc_balance()
            
            # 2. マーケットデータの取得 (Binance BTC/USDT + 150 JPY)
            ohlcv = exchange.fetch_ohlcv("BTC/USDT", timeframe="1h", limit=50)
            df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
            for col in ["open", "high", "low", "close"]:
                df[col] = df[col] * 150.0 # 暫定 JPY 換算
            df = preprocess_data(df)
            current_price = df.iloc[-1]["close"]
            atr = df.iloc[-1]["ATR_22"]

            # 3. ポジション判定とシミュレーション
            pos = load_position()
            
            # 実残高 または 模擬ポジションがある場合
            if btc_balance > 0.001 or pos:
                if not pos:
                    # 外部 (手動等) でポジションが持たれた場合
                    logger.warning("📉 未知のポジションを検知。現在の価格で追跡を開始します。")
                    pos = {"entry_price": current_price, "initial_qty": btc_balance, "scaled_out": False, "is_mock": False}
                    save_position(pos)
                
                # エグジット判定
                exit_mgr = AdvancedExitManager(pos["entry_price"], pos["initial_qty"])
                if pos.get("scaled_out"):
                    exit_mgr.is_half_closed = True
                
                signals = exit_mgr.get_exit_signals(df, current_price)
                
                # A. 分割利確 (Scaling Out)
                if signals["scale_out"] and not pos.get("scaled_out"):
                    msg = f"🔥 分割利確 (TP1) 到達!\n価格: ¥{current_price:,.0f}\n50% のポジションを決済します。"
                    send_discord(WEBHOOK_URL, "分割利確シグナル", msg, 0xffaa00, DRY_RUN)
                    if not DRY_RUN and not pos.get("is_mock"):
                        client.place_order(7, "SELL", btc_balance / 2)
                    pos["scaled_out"] = True
                    save_position(pos)

                # B. 手仕舞い (Peak Exit / Chandelier)
                if signals["peak_exit"] or signals["chandelier_exit"]:
                    reason = "🚀 天井反転検知" if signals["peak_exit"] else "🛡️ トレーリングストップ(ATR)抵触"
                    msg = f"🚨 【決済実行】 {reason}\n価格: ¥{current_price:,.0f}\n全ポジションを解消します。"
                    send_discord(WEBHOOK_URL, "ポジション決済", msg, 0xff4444, DRY_RUN)
                    if not DRY_RUN and not pos.get("is_mock"):
                        client.place_order(7, "SELL", btc_balance)
                    if os.path.exists(POSITION_FILE):
                        os.remove(POSITION_FILE)
                    pos = None

                # C. 定時状況報告
                if pos:
                    profit_pct = ((current_price - pos["entry_price"]) / pos["entry_price"]) * 100
                    status_report = (
                        f"**BTC/JPY**: ¥{current_price:,.0f}\n"
                        f"**買付価格**: ¥{pos['entry_price']:,.0f}\n"
                        f"**損益状況**: {profit_pct:+.2f}%\n"
                        f"**決済ライン**: ATRストップ ¥{exit_mgr.trailing_stop_line:,.0f}"
                    )
                    send_discord(WEBHOOK_URL, "ポジション監視中", status_report, 0x00ff00, DRY_RUN)

            else:
                # ポジションなし: 新規エントリー推奨サイズの算出
                rm = RiskManager(risk_percent=0.02)
                stop_loss = current_price - (atr * 3)
                opt_size = rm.calculate_position_size(equity, current_price, stop_loss)
                
                # 模擬的な「買い」シークエンスの提案
                logger.info(f"💡 推奨サイズ: {opt_size:.6f} BTC (SL: {stop_loss:,.0f})")
                # (任意) ここに自動エントリーロジックを追加可能

            logger.info("💤 ループ終了。次回チェックまで 5分待機。")

        except Exception as e:
            logger.error(f"❌ ループエラー: {e}")
            send_discord(WEBHOOK_URL, "エラー発生", f"エラー内容: {str(e)}", 0x000000, DRY_RUN)

        time.sleep(LOOP_INTERVAL)

if __name__ == "__main__":
    run_bot()
