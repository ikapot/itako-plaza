import streamlit as st
import json
import os
import pandas as pd
from datetime import datetime
from .config import INITIAL_CAPITAL

STATE_FILE = "trading_state.json"

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"balance": INITIAL_CAPITAL, "trade_history": []}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

st.set_page_config(page_title="Itako Trading Dashboard", layout="wide")

st.title("🏯 楽天証券 コツコツ自動売買")

state = load_state()

# 資産統計
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("現在の資産", f"{state['balance']}円", f"{state['balance'] - INITIAL_CAPITAL}円")
with col2:
    st.metric("総利益率", f"{(state['balance'] / INITIAL_CAPITAL - 1) * 100:.2f}%")
with col3:
    st.metric("取引回数", f"{len(state['trade_history'])}")

# 直近の取引履歴
st.header("取引履歴")
if state["trade_history"]:
    df = pd.DataFrame(state["trade_history"])
    st.table(df)
else:
    st.info("まだ取引履歴がありません。")

# アクション
st.header("手動アクション")
if st.button("セッションを初期化（再ログイン）"):
    if os.path.exists("rakuten_session.json"):
        os.remove("rakuten_session.json")
    st.warning("セッションを削除しました。次回の自動売買時に再ログインが実行されます。")

st.sidebar.text(f"Last updated: {datetime.now().strftime('%H:%M:%S')}")
