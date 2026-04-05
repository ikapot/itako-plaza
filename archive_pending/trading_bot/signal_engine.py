import time
import asyncio
import pandas as pd
import pandas_ta as ta
import yfinance as yf
import ccxt
from datetime import datetime
from .config import INITIAL_CAPITAL
from .rakuten_bot import RakutenBot
from .notify import notify_all

# 設定
TARGET_TYPE = "STOCK" # "STOCK" or "CRYPTO"
SYMBOL = "7203.T"    # Stocks: "7203.T" (Toyota), Crypto: "BTC/JPY"
INTERVAL = "1h"      # Time interval: "1h", "1d"
RSI_PERIOD = 14
RSI_BUY_LEVEL = 30
RSI_SELL_LEVEL = 70

async def get_stock_data(symbol, interval="1h"):
    """
    yfinance を使って株価データを取得
    """
    df = yf.download(symbol, period="5d", interval=interval, progress=False)
    return df

async def get_crypto_data(symbol, interval="1h"):
    """
    ccxt を使って仮想通貨データを取得 (例: bitflyer, coincheck など)
    """
    exchange = ccxt.rakutenwallet() # または別取引所
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe=interval, limit=100)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    return df

def calculate_rsi(df):
    """
    RSI を計算
    """
    df['RSI'] = ta.rsi(df['Close'] if 'Close' in df else df['close'], length=RSI_PERIOD)
    return df.iloc[-1]['RSI']

async def check_signals_and_trade():
    """
    メインのループ処理
    """
    print(f"[SignalEngine] Checking {SYMBOL} at {datetime.now()}")
    
    try:
        if TARGET_TYPE == "STOCK":
            df = await get_stock_data(SYMBOL, INTERVAL)
        else:
            df = await get_crypto_data(SYMBOL, INTERVAL)
            
        current_rsi = calculate_rsi(df)
        current_price = df.iloc[-1]['Close'] if 'Close' in df else df.iloc[-1]['close']
        
        print(f"[SignalEngine] Current RSI: {current_rsi:.2f}, Price: {current_price:.2f}")

        # 売買ロジック
        bot = RakutenBot()
        if current_rsi < RSI_BUY_LEVEL:
            notify_all(f"📈 【シグナル】RSIが {current_rsi:.2f} です。逆張り買いのチャンス！")
            await bot.start()
            await bot.login()
            await bot.place_order_kabu_mini(SYMBOL.split('.')[0], "BUY", 1)
            await bot.stop()
        elif current_rsi > RSI_SELL_LEVEL:
            notify_all(f"📉 【シグナル】RSIが {current_rsi:.2f} です。利確を検討しましょう。")
            await bot.start()
            await bot.login()
            await bot.place_order_kabu_mini(SYMBOL.split('.')[0], "SELL", 1)
            await bot.stop()

    except Exception as e:
        print(f"[Error] Signal Engine error: {e}")

async def run_engine():
    """
    無限ループで監視
    """
    print("🚀 Itako Signal Engine Started (Polling Mode)")
    while True:
        await check_signals_and_trade()
        # 次のチェックまで待機 (例: 1時間ごとに1回)
        await asyncio.sleep(3600 if INTERVAL == "1h" else 86400)

if __name__ == "__main__":
    asyncio.run(run_engine())
