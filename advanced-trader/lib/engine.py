import pandas as pd
import ccxt
import logging
from typing import Dict, Optional, Tuple

# --- Logger 設定 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QuantTrader")

class RiskManager:
    """
    資金管理エンジン: 2%ルールに基づいたポジションサイジングを担当
    """
    def __init__(self, risk_percent: float = 0.02):
        self.risk_percent = risk_percent

    def calculate_position_size(
        self, 
        total_equity: float, 
        entry_price: float, 
        stop_loss_price: float
    ) -> float:
        """
        1回のトレードの最大損失を資金の2%に抑えるためのポジションサイズを算出する。
        
        Args:
            total_equity: 現在の口座総資金 (例: 1,000,000 JPY)
            entry_price: エントリー予定価格 (例: 10,000,000 JPY/BTC)
            stop_loss_price: 初期損切り価格 (例: 9,800,000 JPY/BTC)
            
        Returns:
            position_size: エントリーすべき数量 (BTC単位)
        """
        if entry_price <= stop_loss_price:
            logger.warning("Invalid Stop Loss: SL must be lower than Entry for Long.")
            return 0.0

        # リスク許容額 (資金の2%)
        risk_amount = total_equity * self.risk_percent
        
        # 1ユニットあたりの損失幅
        loss_per_unit = abs(entry_price - stop_loss_price)
        
        if loss_per_unit == 0:
            return 0.0
            
        # ポジションサイズ = リスク許容額 / 1ユニットあたりの損失幅
        position_size = risk_amount / loss_per_unit
        
        logger.info(f"Risk Amount: {risk_amount}, Calculated Size: {position_size}")
        return position_size

class AdvancedExitManager:
    """
    決済（エグジット）エンジン: 分割利確、天井離脱、動的トレイリングストップを担当
    """
    def __init__(self, entry_price: float, initial_qty: float):
        self.entry_price = entry_price
        self.current_qty = initial_qty
        self.highest_price = entry_price
        self.is_scaled_out = False # 分割利確済みフラグ
        self.trailing_stop_line = 0.0

    def update_highest_price(self, current_price: float):
        """保有期間中の最高値を更新（ラチェット機構）"""
        if current_price > self.highest_price:
            self.highest_price = current_price

    def get_exit_signals(self, df: pd.DataFrame, current_price: float) -> Dict[str, bool]:
        """
        現在の市場データから決済シグナルを判定する
        
        Args:
            df: OHLCVデータ（Pandas DataFrame）。EMA, RSI, ATRが計算されていること。
            current_price: 現在の市場価格
            
        Returns:
            signals: {'scale_out': bool, 'peak_exit': bool, 'chandelier_exit': bool}
        """
        self.update_highest_price(current_price)
        last_row = df.iloc[-1]
        
        # 指標の取得
        atr = last_row['ATR_22']
        rsi = last_row['RSI_14']
        ema_20 = last_row['EMA_20']
        
        signals = {
            "scale_out": False,
            "peak_exit": False,
            "chandelier_exit": False
        }

        # 1. 分割利確 (Scaling Out) / リスクフリー化
        # 条件: 価格が エントリー + 2.0*ATR に到達
        if not self.is_scaled_out:
            tp1_target = self.entry_price + (atr * 2.0)
            if current_price >= tp1_target:
                signals["scale_out"] = True
                self.is_scaled_out = True
                logger.info(f"🚀 Scaling Out Triggered at {current_price}")

        # 2. 天井離脱 (Peak Exit / Mean Reversion)
        # 条件A: EMA(20) から +4.0% 以上の乖離
        ema_deviation = (current_price - ema_20) / ema_20
        # 条件B: RSI(14) が 75 超えの過熱後、70 を下回る (簡易化のため直近クロスダウン判定)
        rsi_exhaustion = rsi < 70 and df.iloc[-2]['RSI_14'] >= 70 and df['RSI_14'].tail(5).max() > 75
        
        if ema_deviation >= 0.04 or rsi_exhaustion:
            signals["peak_exit"] = True
            logger.info(f"💥 Peak Exit Triggered. Dev: {ema_deviation:.2%}, RSI: {rsi:.1f}")

        # 3. シャンデリア・エグジット (Chandelier Exit)
        # 計算: 最高値 - (ATR * 2.8)
        self.trailing_stop_line = max(self.trailing_stop_line, self.highest_price - (atr * 2.8))
        if current_price <= self.trailing_stop_line:
            signals["chandelier_exit"] = True
            logger.info(f"🛡️ Chandelier Exit Triggered at {current_price} (Stop: {self.trailing_stop_line})")

        return signals

# import pandas_ta as ta  # 3.14 非対応のため手動計算に切り替え

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    テクニカル指標の計算 (手動実装版)
    """
    # EMA 20
    df['EMA_20'] = df['close'].ewm(span=20, adjust=False).mean()
    
    # RSI 14
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI_14'] = 100 - (100 / (1 + rs))
    
    # ATR 22
    high_low = df['high'] - df['low']
    high_close = abs(df['high'] - df['close'].shift())
    low_close = abs(df['low'] - df['close'].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    df['ATR_22'] = true_range.rolling(window=22).mean()
    
    return df

class TrendEntryManager:
    """
    エントリー（参入）エンジン: EMAとRSIを組み合わせたトレンドフォロー戦略
    """
    def __init__(self):
        pass

    def get_entry_signal(self, df: pd.DataFrame) -> bool:
        """
        ゴールデンクロスまたはEMAトレンド継続を判定
        """
        last_row = df.iloc[-1]
        prev_row = df.iloc[-2]
        
        close = last_row['close']
        ema_20 = last_row['EMA_20']
        rsi = last_row['RSI_14']
        
        # 条件1: 価格がEMA20を上抜けている（トレンド方向）
        trend_up = close > ema_20
        # 条件2: 前回はEMAの下だったか、あるいは価格がEMAに向かって反発している（押し目）
        breakout = trend_up and prev_row['close'] <= prev_row['EMA_20']
        # 条件3: RSIが55以上（勢いがあるが買われすぎではない）
        momentum = rsi > 55 and rsi < 75
        
        if trend_up and (breakout or momentum):
            logger.info(f"✨ Entry Signal Detected: Price({close:.0f}) > EMA20({ema_20:.0f}), RSI({rsi:.1f})")
            return True
        return False
