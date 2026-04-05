import feedparser
import time
import logging
import requests

logger = logging.getLogger(__name__)

# ユーザーエージェントを模倣してブロックを回避
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def fetch_crypto_news(interval_seconds=1800):
    """
    仮想通貨関連の主要RSSフィードから最新ニュースを取得後、潮目感知用のキーワードでフィルタリングする。
    """
    feeds = [
        "https://www.coindeskjapan.com/feed/",
        "https://coinpost.jp/?feed=rss2",
        "https://cointelegraph.com/feed",
        "https://www.theblock.co/rss.xml",
        "https://www.coindesk.com/arc/outboundfeeds/rss/"
    ]
    
    # 潮目感知のための重点キーワード（ユーザー指定）
    FOCUS_KEYWORDS = [
        "中間選挙", "election", "規制", "regulation", "SEC", "金利", "FED", "FRB",
        "ホルムズ", "Hormuz", "地政学", "geopolitics", "原油", "石油", "米ドル", "USD",
        "BlackRock", "ブラックロック", "RWA", "エージェント", "決済", "インフラ", "障害"
    ]
    
    news_items = []
    now = time.time()
    
    for url in feeds:
        try:
            logger.info(f"📰 フィードを取得中: {url}")
            response = requests.get(url, headers=HEADERS, timeout=15)
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries:
                if not hasattr(entry, 'published_parsed') or not entry.published_parsed:
                    continue

                published_time = time.mktime(entry.published_parsed)
                diff = now - published_time
                
                # 指定時間内（デフォルト30分）のニュースを抽出
                if diff < interval_seconds:
                    title = entry.title
                    summary = getattr(entry, 'summary', title)
                    
                    # 重要キーワードが含まれているかチェック
                    is_focus = any(kw.lower() in (title + summary).lower() for kw in FOCUS_KEYWORDS)
                    
                    source_name = "CoinDesk JP" if "coindeskjapan" in url else \
                                  "Cointelegraph" if "cointelegraph" in url else \
                                  "The Block" if "theblock" in url else \
                                  "CoinDesk EN" if "coindesk.com" in url else "CoinPost"

                    news_items.append({
                        "title": title,
                        "summary": summary, 
                        "link": entry.link,
                        "base_source": source_name,
                        "published_at": time.strftime('%Y-%m-%d %H:%M:%S', entry.published_parsed),
                        "is_focus": is_focus
                    })
                    
        except Exception as e:
            logger.error(f"❌ ニュース取得中にエラー発生 ({url}): {e}")
            
    # 重複削除
    unique_news = {item['link']: item for item in news_items}.values()
    
    # フォーカスされている（キーワード一致した）ニュースを優先してソート
    sorted_news = sorted(unique_news, key=lambda x: x['is_focus'], reverse=True)
    
    # 解析負荷を抑えるため、最大10件に絞り込み
    return list(sorted_news)[:10]

if __name__ == "__main__":
    # テスト用
    logging.basicConfig(level=logging.INFO)
    items = fetch_crypto_news(3600 * 24) # 過去24時間
    for i, item in enumerate(items):
        print(f"[{i+1}] {item['source']} - {item['title']} ({item['published_at']})")
