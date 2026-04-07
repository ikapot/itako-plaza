import pandas as pd
import pandas_ta as ta
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

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    テクニカル指標の計算（pandas_ta 使用）
    """
    # 既存の DataFrame に指標を追加
    df.ta.ema(length=20, append=True)
    df.ta.rsi(length=14, append=True)
    df.ta.atr(length=22, append=True)
    
    # 列名の正規化（pandas_ta のデフォルト名に対応）
    df.rename(columns={
        'EMA_20': 'EMA_20',
        'RSI_14': 'RSI_14',
        'ATRr_22': 'ATR_22'
    }, inplace=True)
    
    return df

# --- 使用例 (ボットへの組み込みイメージ) ---
if __name__ == "__main__":
    # モックデータの作成
    data = {
        "close": [100, 102, 105, 110, 115, 120, 118, 115],
        "high":  [101, 103, 106, 112, 118, 122, 120, 118],
        "low":   [99, 101, 104, 108, 112, 117, 116, 114]
    }
    df = pd.DataFrame(data)
    df = preprocess_data(df) # 実際はより長い期間の OHLCV が必要

    # 1. 資金管理
    rm = RiskManager(risk_percent=0.02)
    pos_size = rm.calculate_position_size(total_equity=1000000, entry_price=100.0, stop_loss_price=95.0)
    
    # 2. 決済管理
    exit_mgr = AdvancedExitManager(entry_price=100.0, initial_qty=pos_size)
    
    # ループ内での判定イメージ
    current_market_price = 115.0 
    signals = exit_mgr.get_exit_signals(df, current_market_price)
    
    if signals["scale_out"]:
        print(">>> 50% 利確を実行し、ストップロスを建値に移動します。")
    if signals["peak_exit"] or signals["chandelier_exit"]:
        print(">>> 全ポジションを決済します。")
