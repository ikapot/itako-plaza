import sys
import unittest.mock as mock

# --- モック設定を先に定義 ---
mock_discord = mock.MagicMock(return_value=True)
mock_analysis = mock.MagicMock(return_value={
    "decision": "BUY",
    "sentiment_score": 0.85,
    "impact": 5,
    "reason": "強気のモックニュースに基づき買いと判定。",
    "target_price": 10500000
})
mock_ticker = mock.MagicMock(return_value={
    "last": 10000000,
    "bid": 9995000,
    "ask": 10005000,
    "symbolId": 7
})

# 実際にモジュールがロードされる前にパッチする
sys.modules['lib.discord_util'] = mock.MagicMock()
sys.modules['lib.discord_util'].send_discord_notification = mock_discord
sys.modules['lib.discord_util'].request_trade_approval = mock.MagicMock(return_value=True)

sys.modules['engine.analysis'] = mock.MagicMock()
sys.modules['engine.analysis'].analyze_sentiment = mock_analysis

# Firestore のモック化 (認証エラー回避)
sys.modules['lib.firestore'] = mock.MagicMock()
mock_state = mock.MagicMock()
mock_state.return_value.get_status.return_value = {"position": None, "entry_price": 0}
sys.modules['lib.firestore'].TradingState = mock_state

# 楽天APIクライアントのモック化
with mock.patch('lib.rakuten_api.RakutenWalletClient', mock.MagicMock()):
    # uvicorn起動前にインポート
    import uvicorn
    from main import app
    
    # 実際のリクエスト時に get_ticker が呼ばれるので、広範囲で patch する
    with mock.patch('engine.trading.RakutenWalletClient.get_ticker', mock_ticker):
        mock_news = [
            {"title": "ホルムズ海峡で緊張高まる：原油運搬船への威嚇射撃を検知、原油先物が急騰", "source": "Geo-Alert"},
            {"title": "米中間選挙を控え、次期政権の仮想通貨規制案がリーク：超党派での厳格化の動き", "source": "Policy Inside"},
            {"title": "アジア圏の主要データセンターで大規模な通信障害が発生、金融インフラに一部影響", "source": "Tech Guard"}
        ]
        print("🧪 [Mock Mode] Starting server with mocked external APIs and Firestore...")
        uvicorn.run(app, host="127.0.0.1", port=8080)
