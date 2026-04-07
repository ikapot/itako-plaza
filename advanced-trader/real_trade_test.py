import os
import pandas as pd
import ccxt
import logging
from dotenv import load_dotenv
from lib.rakuten_api import RakutenWalletClient
from lib.engine import RiskManager, AdvancedExitManager, preprocess_data

# --- Logger 設定 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RealTradeTest")

# --- 環境変数のロード (.env.production から認証情報を読み込む) ---
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
load_dotenv(dotenv_path=env_path)

def run_real_data_test():
    logger.info("📡 楽天ウォレット実データテスト開始...")
    
    api_key = os.getenv("WALLET_API_KEY")
    api_secret = os.getenv("WALLET_API_SECRET")
    
    if not api_key or not api_secret:
        logger.error("❌ WALLET_API_KEY または WALLET_API_SECRET が .env.production に設定されていません。")
        return

    # 1. 楽天ウォレットから現在の資産状況を取得
    client = RakutenWalletClient(api_key, api_secret)
    margin_info = client.get_margin_info()
    
    # 有効証拠金 (Equity) を取得
    equity = 0.0
    if "equity" in margin_info:
        equity = float(margin_info["equity"])
    
    btc_balance = client.get_btc_balance()
    
    logger.info(f"📊 【現在の資産】 有効証拠金: {equity:,.0f} JPY / 保有BTC: {btc_balance:.6f} BTC")

    # 2. CCXT で最新のマーケットデータを取得 (Binance の BTC/USDT を参考に使用し、JPYに換算)
    exchange = ccxt.binance()
    logger.info("🕯️ マーケットデータを取得中 (Binance BTC/USDT)...")
    try:
        ohlcv = exchange.fetch_ohlcv("BTC/USDT", timeframe="1h", limit=50)
        df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        
        # 簡易的に USDT -> JPY 換算 (150円固定) 
        usdt_jpy = 150.0
        for col in ["open", "high", "low", "close"]:
            df[col] = df[col] * usdt_jpy
        
        df = preprocess_data(df)
    except Exception as e:
        logger.error(f"❌ OHLCV取得エラー: {e}")
        return
    
    last_row = df.iloc[-1]
    current_price = last_row["close"]
    atr = last_row["ATR_22"]
    
    logger.info(f"📈 【マーケット】 現在価格: {current_price:,.0f} JPY / ATR(22): {atr:,.0f}")

    # 3. 資金管理 (RiskManager) の検証
    rm = RiskManager(risk_percent=0.02) # 資金の2%
    # 仮想損切り幅を 3 * ATR とする
    stop_loss_price = current_price - (atr * 3)
    opt_size = rm.calculate_position_size(equity, current_price, stop_loss_price)
    
    logger.info(f"🛡️ 【2%ルール】 推奨ポジションサイズ: {opt_size:.6f} BTC (損切り目安: {stop_loss_price:,.0f})")

    # 4. 決済戦略 (AdvancedExitManager) のシミュレーション
    # 仮のエントリー価格を「現在価格の 1% 下」としてシミュレート
    entry_sim = current_price * 0.99
    exit_mgr = AdvancedExitManager(entry_price=entry_sim, initial_qty=opt_size)
    
    signals = exit_mgr.get_exit_signals(df, current_price)
    
    logger.info("🏁 --- 決済予測ライン ---")
    logger.info(f"🔥 分割利確 (Scaling Out) 目標: {entry_sim + (atr * 2.0):,.0f} JPY")
    logger.info(f"🛡️ シャンデリア・ストップ (Trailing): {exit_mgr.trailing_stop_line:,.0f} JPY")
    logger.info(f"🔍 現在のシグナル: {signals}")

if __name__ == "__main__":
    run_real_data_test()
