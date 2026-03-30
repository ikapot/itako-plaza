import pandas as pd
import pandas_ta as ta

class StrategyManager:
    def __init__(self, initial_capital=10000, risk_ratio=0.01):
        self.initial_capital = initial_capital
        self.risk_amount = initial_capital * risk_ratio  # 10,000 * 0.01 = 100 JPY
        self.rsi_period = 14
        self.buy_threshold = 30
        self.sell_threshold = 70

    def calculate_rsi(self, df):
        """
        価格データ(DataFrame)からRSIを計算する
        df: ['close'] カラムを持つDataFrame
        """
        if len(df) < self.rsi_period:
            return None
        
        df.ta.rsi(length=self.rsi_period, append=True)
        return df

    def check_signals(self, df):
        """
        売買シグナルの判定
        """
        if df is None or f'RSI_{self.rsi_period}' not in df.columns:
            return "HOLD"
        
        latest_rsi = df[f'RSI_{self.rsi_period}'].iloc[-1]
        
        if latest_rsi < self.buy_threshold:
            return "BUY"
        elif latest_rsi > self.sell_threshold:
            return "SELL"
        
        return "HOLD"

    def validate_risk(self, entry_price, current_price, quantity):
        """
        1%損切りルールのバリデーション
        損失額が 100円 (risk_amount) を超えそうな場合に True (要損切り) を返す
        """
        potential_loss = (entry_price - current_price) * quantity
        if potential_loss >= self.risk_amount:
            return True  # 損切り実行
        return False

    def get_position_size(self, stock_price):
        """
        元手1万円に合わせたポジションサイズ（株数）の計算
        ※小資本のため単元未満株(1株)を想定
        """
        if stock_price <= 0:
            return 0
        
        # 最大購入可能額を2,000円程度に制限する（分散のため、または1万円の1/5）
        max_investment = self.initial_capital * 0.2
        quantity = int(max_investment // stock_price)
        return max(1, quantity) if stock_price < max_investment else 0

if __name__ == "__main__":
    # テスト用
    sm = StrategyManager()
    print(f"Initial Risk Amount: {sm.risk_amount} JPY")
    
    # サンプルデータでの動作確認
    data = {'close': [100, 102, 101, 98, 95, 92, 90, 88, 85, 84, 83, 82, 81, 80, 79, 78]}
    df = pd.DataFrame(data)
    df = sm.calculate_rsi(df)
    signal = sm.check_signals(df)
    print(f"Latest RSI: {df[f'RSI_{sm.rsi_period}'].iloc[-1]:.2f}")
    print(f"Signal: {signal}")
