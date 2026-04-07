import pandas as pd
import pandas_ta as ta
from lib.engine import RiskManager, AdvancedExitManager, preprocess_data

def test_risk_manager():
    print("--- Testing RiskManager ---")
    rm = RiskManager(risk_percent=0.02) # 資金の2%リスク
    # 資金100万円, 建値100.0, 損切り98.0 -> 損失幅2.0
    # リスク額 100万 * 0.02 = 2万円
    # ポジションサイズ = 2万 / 2.0 = 10,000 units
    size = rm.calculate_position_size(1000000, 100.0, 98.0)
    print(f"Calculated Size: {size} (Expected: 10000.0)")
    assert size == 10000.0

def test_exit_logic():
    print("\n--- Testing Exit Logic ---")
    # 22日分以上のデータを準備 (ATR_22用)
    data = {
        "high":  [105.0] * 30,
        "low":   [100.0] * 30,
        "close": [102.0] * 30
    }
    df = pd.DataFrame(data)
    df = preprocess_data(df)
    
    # ATR_22 は 5.0 (High 105 - Low 100) 前後になるはず
    atr = df.iloc[-1]['ATR_22']
    print(f"Current ATR_22: {atr}")
    
    entry_price = 100.0
    exit_mgr = AdvancedExitManager(entry_price=entry_price, initial_qty=100)
    
    # 1. 正常時 (シグナルなし)
    signals = exit_mgr.get_exit_signals(df, 105.0)
    print(f"Price 105.0 Signals: {signals}")
    
    # 2. 分割利確 (ATR=5.0 なら建値 + 10.0 = 110.0)
    signals = exit_mgr.get_exit_signals(df, 110.0)
    print(f"Price 110.0 Signals: {signals} (Scale Out Expected)")
    assert signals['scale_out'] == True
    
    # 3. シャンデリア・エグジット
    # 最高値が 110 なら、ストップは 110 - (5.0 * 2.8) = 110 - 14.0 = 96.0
    # さらに価格を上げるとストップも上がる
    exit_mgr.get_exit_signals(df, 120.0) # 最高値更新
    stop_line = exit_mgr.trailing_stop_line
    print(f"Chandelier Stop Line (at High 120): {stop_line}")
    # 120 - 14.0 = 106.0
    
    signals = exit_mgr.get_exit_signals(df, 105.0) # ストップ割れ
    print(f"Price 105.0 Signals: {signals} (Chandelier Exit Expected)")
    assert signals['chandelier_exit'] == True

if __name__ == "__main__":
    try:
        test_risk_manager()
        test_exit_logic()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
