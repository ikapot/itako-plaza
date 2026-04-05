import datetime
import logging

logger = logging.getLogger(__name__)

def check_safety(ticker_data):
    """
    トレード実行前の安全確認。
    - スプレッド制限 (2.0%以内)
    - メンテナンス時間
    - 経済指標 (TODO: API連携)
    """
    # 1. スプレッドチェック
    bid = float(ticker_data.get('bid', 0))
    ask = float(ticker_data.get('ask', 0))
    
    if bid == 0 or ask == 0:
        return False, "📊 価格取得エラー (Bid/Ask が 0 です)"
    
    spread_pct = (ask - bid) / bid
    if spread_pct >= 0.02:
        return False, f"🚫 スプレッド過大: {spread_pct:.2%}"

    # 2. メンテナンス時間のチェック (JST)
    # 楽天ウォレットの一般的なメンテ例: 土曜早朝、または特定深夜
    # ここでは簡易的に 0:00〜1:00 等を避けるロジック
    now_jst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    current_hour = now_jst.hour
    current_minute = now_jst.minute
    
    # 例: 毎日 06:50〜07:10 (日次メンテ)
    if current_hour == 6 and (50 <= current_minute <= 59):
        return False, "🛠️ 日次メンテナンス時間内 (06:50-07:10)"
    if current_hour == 7 and (0 <= current_minute <= 10):
        return False, "🛠️ 日次メンテナンス時間内 (06:50-07:10)"

    # 3. 経済指標 (将来的に Yahoo Finance RSS 等から重要指標をパースする予定)
    # 現在は常に OK とする
    
    return True, "✅ 安全確認をパスしました"
