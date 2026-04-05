import dde
import time

def get_ms2_rss_price_v2(ticker="7203"):
    """
    MarketSpeed II RSS から直接 DDE 通信でおしゃべりする実演 (Version 2)
    """
    server_name = "RSS"
    topic_name = f"{ticker}.T"
    item_name = "現在値"
    
    print(f"🔍 {ticker} の最新価格を MarketSpeed II RSS に再挑戦して聞いてみます...")

    try:
        # DDE サーバー機能を開始
        server = dde.CreateServer()
        server.Create("PythonTestClient")
        
        # 会話を開始 (接続)
        conversation = dde.CreateConversation(server)
        conversation.ConnectTo(server_name, topic_name)
        
        # データの要求
        result = conversation.Request(item_name)
        
        # 結果があれば表示
        if result:
            price = result.strip()
            print(f"💰 {ticker} の現在価格は: {price} 円 でした！")
            return price
        else:
            print("😥 お返事がありませんでした。マーケットスピードは起動していますか？")
            return None

    except Exception as e:
        print(f"❌ 通信エラー: {e}")
        return None

if __name__ == "__main__":
    price = get_ms2_rss_price_v2("7203")
    if price:
        print("🎉 やった！通信成功です！")
    else:
        print("   ※ マーケットスピードが起動して、RSSが ON になっているかもう一度チェックですね！")
