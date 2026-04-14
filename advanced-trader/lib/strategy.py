import pandas as pd
import numpy as np
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("LtcStrategy")

class LtcStrategy:
    """
    LTC/JPY 専用のクオンツ戦略クラス:
    - 1分足の OHLCV データを内部保持
    - EMA, RSI, ATR, Z-score を計算
    - 多角的パラメータによるエントリー・イグジット判断
    """
    def __init__(self, history_len: int = 100):
        self.history_len = history_len
        # OHLCV の初期化
        self.df = pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        self.last_candle_time = None
        
        # パラメータ
        self.ema_span = 20
        self.rsi_period = 14
        self.atr_period = 22
        
        # 内部状態
        self.highest_price = 0.0
        self.is_scaled_out = False

    def update_ticker(self, ticker_data: dict) -> bool:
        """
        Ticker データを受け取り、1分足を更新する。
        新しい足が確定した場合は True を返す。
        """
        try:
            bid = float(ticker_data.get("bestBid", ticker_data.get("bid", 0)))
            ask = float(ticker_data.get("bestAsk", ticker_data.get("ask", 0)))
            price = (bid + ask) / 2.0
            ts_ms = ticker_data.get("timestamp", datetime.now().timestamp() * 1000)
            # ミリ秒を秒へ、さらに1分単位へ切り捨てる
            ts_dt = datetime.fromtimestamp(ts_ms / 1000.0)
            candle_time = ts_dt.replace(second=0, microsecond=0)

            if price <= 0: return False

            if self.last_candle_time is None or candle_time > self.last_candle_time:
                # 新しいキャンドルの開始
                new_row = {
                    'timestamp': candle_time,
                    'open': price,
                    'high': price,
                    'low': price,
                    'close': price,
                    'volume': 0.0 # Tickerからは正確な出来高は取れないためダミー
                }
                self.df = pd.concat([self.df, pd.DataFrame([new_row])], ignore_index=True)
                self.last_candle_time = candle_time
                
                # 履歴制限
                if len(self.df) > self.history_len:
                    self.df = self.df.iloc[-self.history_len:].reset_index(drop=True)
                
                logger.debug(f"⏰ New Candle Started: {candle_time}")
                return True # 新しい足が始まったことを通知
            else:
                # 既存キャンドルの更新
                idx = self.df.index[-1]
                self.df.at[idx, 'close'] = price
                if price > self.df.at[idx, 'high']: self.df.at[idx, 'high'] = price
                if price < self.df.at[idx, 'low']: self.df.at[idx, 'low'] = price
                return False

        except Exception as e:
            logger.error(f"Error updating ticker in strategy: {e}")
            return False

    def calculate_indicators(self):
        """テクニカル指標の計算"""
        if len(self.df) < 5: return

        # EMA
        self.df['EMA_20'] = self.df['close'].ewm(span=self.ema_span, adjust=False).mean()
        
        # RSI
        delta = self.df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_period).mean()
        # ゼロ除算回避
        loss = loss.apply(lambda x: max(x, 0.0001))
        rs = gain / loss
        self.df['RSI_14'] = 100 - (100 / (1 + rs))
        
        # ATR
        high_low = self.df['high'] - self.df['low']
        high_close = abs(self.df['high'] - self.df['close'].shift())
        low_close = abs(self.df['low'] - self.df['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        self.df['ATR_22'] = ranges.max(axis=1).rolling(window=self.atr_period).mean()
        
        # Z-score (直近 30 分の平均回帰指標)
        window = 30
        if len(self.df) >= window:
            rolling_mean = self.df['close'].rolling(window=window).mean()
            rolling_std = self.df['close'].rolling(window=window).std()
            self.df['Z_score'] = (self.df['close'] - rolling_mean) / rolling_std

    def get_entry_signal(self) -> Optional[str]:
        """
        参入判断:
        - BUY: Z-score < -2.0 (売られすぎ) 且つ RSI > 30 (反発開始兆候)
        - SELL: Z-score > 2.0 (買われすぎ) 且つ RSI < 70 (下落開始兆候)
        """
        if len(self.df) < 30 or 'Z_score' not in self.df.columns: return None
        
        last = self.df.iloc[-1]
        z = last['Z_score']
        rsi = last['RSI_14']
        
        if z < -2.0 and rsi > 30:
            return "BUY"
        elif z > 2.0 and rsi < 70:
            return "SELL"
        return None

    def get_exit_signals(self, current_price: float, side: str) -> bool:
        """
        決済判断: トレイリングストップまたはターゲット到達
        """
        if len(self.df) < 22 or 'ATR_22' not in self.df.columns: return False
        
        last = self.df.iloc[-1]
        atr = last['ATR_22']
        
        # 最高値更新 (BUYの時)
        if side == "BUY":
            if current_price > self.highest_price:
                self.highest_price = current_price
            
            # シャンデリア・エグジット的なトレイリングストップ
            stop_line = self.highest_price - (atr * 2.5)
            if current_price <= stop_line:
                logger.info(f"🛡️ Trail Stop Triggered: Price({current_price}) <= StopLine({stop_line:.1f})")
                return True
        elif side == "SELL":
            # SELLの場合は最低値を追うロジックが必要だが、ここでは簡略化
            if self.highest_price == 0 or current_price < self.highest_price:
                self.highest_price = current_price
            
            stop_line = self.highest_price + (atr * 2.5)
            if current_price >= stop_line:
                logger.info(f"🛡️ Trail Stop Triggered (Short): Price({current_price}) >= StopLine({stop_line:.1f})")
                return True
                
        return False
