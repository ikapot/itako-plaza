import os
import sys
import time
import json
import logging
import pandas as pd
import ccxt
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv
from lib.rakuten_api import RakutenWalletClient
from lib.engine import RiskManager, AdvancedExitManager, TrendEntryManager, preprocess_data
from lib.utils import send_discord
from lib.gist_sync import GistSync

# --- Configuration ---
POSITION_FILE = "position.json"
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("AI_QuantsBot")

# Load environment
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(dotenv_path=env_path)

# Initialize AI
GENAI_KEY = os.getenv("VITE_GEMINI_API_KEY") # Shared with web app
if GENAI_KEY == "PROXY_MODE" or not GENAI_KEY:
    # Use fallback or specific key if available
    GENAI_KEY = os.getenv("GEMINI_API_KEY") 
if GENAI_KEY:
    genai.configure(api_key=GENAI_KEY)

class TradingBot:
    def __init__(self):
        self.dry_run = os.getenv("DRY_RUN", "true").lower() == "true"
        self.webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
        self.client = RakutenWalletClient(os.getenv("WALLET_API_KEY"), os.getenv("WALLET_API_SECRET"))
        self.gist = GistSync(os.getenv("GITHUB_PAT_GIST"), os.getenv("GIST_ID"), POSITION_FILE)
        self.entry_mgr = TrendEntryManager()
        self.exchange = ccxt.binance()
        self.symbol_id = 1001  # CFD BTC/JPY

    def get_market_data(self) -> pd.DataFrame:
        """最新のビットコイン価格（JPY換算）を取得"""
        ohlcv = self.exchange.fetch_ohlcv("BTC/USDT", timeframe="1h", limit=60)
        df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        # USD -> JPY conversion (rough 150)
        for col in ["open", "high", "low", "close"]:
            df[col] = df[col] * 150.0
        return preprocess_data(df)

    def get_ai_tide_sense(self, df: pd.DataFrame) -> str:
        """Gemini AI による市場センチメント（潮の目）の解析"""
        if not GENAI_KEY:
            return "READY (AI-Offline)"
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            last_3 = df.tail(3).to_dict(orient='records')
            prompt = f"Analyze BTC/JPY market stats: {json.dumps(last_3)}. Provide a 1-word overall bias (BULLISH, BEARISH, or NEUTRAL) and a short reason in Japanese."
            response = model.generate_content(prompt)
            return response.text.replace("\n", " ").strip()
        except Exception as e:
            logger.warning(f"AI Analysis Failed: {e}")
            return "READY (Manual Mode)"

    def execute_cycle(self):
        logger.info(f"🚀 AIクオンツボット実行開始 (DRY_RUN={self.dry_run})")
        
        try:
            # 1. データ取得
            pos = self.gist.load()
            margin_info = self.client.get_margin_info()
            df = self.get_market_data()
            
            # 証拠金情報の抽出 (CFD)
            # margin_info はリスト形式で返ることが多い
            equity = 0.0
            if isinstance(margin_info, list) and len(margin_info) > 0:
                equity = float(margin_info[0].get("equity", 0.0))
            elif isinstance(margin_info, dict):
                equity = float(margin_info.get("equity", 0.0))
            
            # 保有建玉（BTC）の確認
            positions = self.client.get_cfd_positions()
            btc = 0.0
            if isinstance(positions, list):
                for p in positions:
                    if p.get("symbolId") == self.symbol_id:
                        # 買建玉 - 売建玉
                        btc += float(p.get("amount", 0.0)) if p.get("side") == "BUY" else -float(p.get("amount", 0.0))
            
            current_price = df.iloc[-1]["close"]
            atr = df.iloc[-1]["ATR_22"]
            
            logger.info(f"💰 有効証拠金: ¥{equity:,.0f} | 保有建玉: {btc:.4f} BTC")
            
            # 2. AIによる環境認識
            ai_insight = self.get_ai_tide_sense(df)
            logger.info(f"🧠 AI Tide Sense: {ai_insight}")

            # 3. ロジック判定 (既存ポジションがある場合)
            if btc > 0.0001 or pos:
                self.handle_existing_position(pos, df, current_price, btc)
            else:
                self.handle_new_entry(df, current_price, atr, equity, ai_insight)

        except Exception as e:
            logger.error(f"❌ Cycle Error: {e}")
            send_discord(self.webhook_url, "ボット警告", f"実行エラー: {e}", 0xff0000, self.dry_run)

    def handle_existing_position(self, pos, df, current_price, btc):
        """保有ポジションの決済・追跡ロジック"""
        if not pos:
            pos = {"entry_price": current_price, "initial_qty": btc, "scaled_out": False}
        
        exit_mgr = AdvancedExitManager(pos["entry_price"], pos["initial_qty"])
        if pos.get("scaled_out"): exit_mgr.is_half_closed = True
        
        signals = exit_mgr.get_exit_signals(df, current_price)
        
        if signals["scale_out"] and not pos.get("scaled_out"):
            self.execute_trade("SELL", btc/2, "✨ 分割利確 (TP1)", behavior="CLOSE")
            pos["scaled_out"] = True
            self.gist.save(pos)

        if signals["peak_exit"] or signals["chandelier_exit"]:
            reason = "🚀 高値圏反転" if signals["peak_exit"] else "🛡️ トレーリングストップ"
            self.execute_trade("SELL", btc, f"🚨 全決済 ({reason})", behavior="CLOSE")
            self.gist.save({})
            return

        # 定時報告
        profit = (current_price - pos["entry_price"]) / pos["entry_price"] * 100
        report = f"持越中 ({profit:+.2f}%)\nPrice: ¥{current_price:,.0f}\nStop: ¥{exit_mgr.trailing_stop_line:,.0f}"
        send_discord(self.webhook_url, "監視ステータス", report, 0x00ff00, self.dry_run)

    def handle_new_entry(self, df, current_price, atr, equity, ai_insight):
        """新規参入（買い）の判定"""
        # AIによるフィルタリング (弱気局面では買いを見送る)
        if "BEARISH" in ai_insight.upper():
            logger.info("⏸ AIが弱気と判断。テクニカルを無視して買いを見送ります。")
            return

        if self.entry_mgr.get_entry_signal(df):
            rm = RiskManager(risk_percent=0.02)
            # 有効証拠金をベースにロット調整（レバレッジを考慮）
            opt_size = max(rm.calculate_position_size(equity, current_price, current_price - (atr*3)), 0.0001)
            
            # 証拠金取引なので必要証拠金（最小単位）をチェック
            if equity < 1000: # 最低1000円は必要と仮定
                logger.warning(f"証拠金不足 (有効証拠金: ¥{equity:,.0f})")
                return

            self.execute_trade("BUY", opt_size, "🔥 トレンド転換エントリー(AI要請-CFD)")
            if not self.dry_run:
                self.gist.save({"entry_price": current_price, "initial_qty": opt_size, "scaled_out": False})

    def execute_trade(self, side: str, qty: float, reason: str, behavior: str = "NEW"):
        """注文の最終執行と通知"""
        msg = f"{reason}\nSide: {side}\nQty: {qty:.6f} BTC (CFD {behavior})"
        send_discord(self.webhook_url, "トレード執行", msg, 0x00ccff, self.dry_run)
        if not self.dry_run:
            self.client.place_cfd_order(self.symbol_id, side, qty, behavior=behavior)

if __name__ == "__main__":
    bot = TradingBot()
    bot.execute_cycle()
