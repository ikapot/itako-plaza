import win32ui
import win32con
import time

def get_ms2_rss_price(ticker="7203"):
    """
    MarketSpeed II RSS から DDE 通信で現在値を取得する実験プログラム。
    (トヨタ: 7203, 任天堂: 7974 など)
    """
    server = "RSS"
    # MarketSpeed II の場合、トピックは '7203.T' などの銘柄コード形式
    topic = f"{ticker}.T"
    item = "現在値" # または "Last"
    
    print(f"🔍 {ticker} の株価を MarketSpeed II RSS に聞いてみます...")

    try:
        # DDE クライアントの初期化
        dde = win32ui.CreateDDEClient()
        # 通信の開始 (サーバー名: RSS, トピック: 銘柄コード)
        dde.ConnectTo(server, topic)
        
        # データの要求 (アイテム名: 現在値)
        result = dde.Request(item)
        
        # 結果の表示 (デコード)
        price = result.decode('shift-jis').strip()
        print(f"💰 {ticker} の現在価格は: {price} 円 でした！")
        return price

    except Exception as e:
        print(f"❌ 通心エラー: {e}")
        print("   ※ MarketSpeed II が起動して、RSS機能が ON になっているか確認してね！")
        return None

if __name__ == "__main__":
    # トヨタの株価を1回取得してみる
    price = get_ms2_rss_price("7203")
    if price:
        print("🎉 通信成功です！")
    else:
        print("😥 今日はもうお店が閉まっているか、設定が足りないかもしれません。")
