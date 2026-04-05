import streamlit as st
import pandas as pd
import pandas_ta as ta
import time

st.set_page_config(page_title="Rakuten Bot Dashboard", layout="wide")

st.title("📊 楽天自動売買 運用ダッシュボード")

# 1. 資産状況 (Metrics)
col1, col2, col3 = st.columns(3)
col1.metric("総資産", "10,050 JPY", "+50 JPY")
col2.metric("含み損益", "+0.5%", "Green")
col3.metric("本日トレード数", "2回", "0")

# 2. RSI チャート (Chart)
st.subheader("📈 RSI (14) 推移モニタリング")
# ダミーデータの生成
chart_data = pd.DataFrame({
    'close': [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 108]
})
chart_data.ta.rsi(length=14, append=True)

st.line_chart(chart_data['RSI_14'])
st.caption("※ RSI が 30 以下で買い、70 以上で売りのシグナルとなります。")

# 3. 直近の売買ログ (Table)
st.subheader("📜 最近の約定履歴")
log_df = pd.DataFrame([
    {"Time": "2026-03-30 10:45", "Ticker": "8501 (楽天)", "Side": "BUY", "Qty": 1, "Price": "3,450 JPY", "Status": "COMPLETED"},
    {"Time": "2026-03-30 12:15", "Ticker": "8501 (楽天)", "Side": "SELL", "Qty": 1, "Price": "3,500 JPY", "Status": "COMPLETED"},
], columns=["Time", "Ticker", "Side", "Qty", "Price", "Status"])

st.table(log_df)

# 4. システムステータス
st.sidebar.title("🤖 システム・稼働状況")
st.sidebar.success("ONLINE (GCP Run / Replit)")
st.sidebar.info("Strategy: RSI Mean Reversion")
st.sidebar.warning("2FA: IDLE")

if st.sidebar.button("Force Restart Bot"):
    st.write("Restarting Bot Engine...")

# 5. 情報更新 (Auto Refresh)
time.sleep(10)
# st.experimental_rerun()  # 10秒ごとに再描画
