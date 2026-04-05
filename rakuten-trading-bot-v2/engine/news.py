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
    仮想通貨関連の主要RSSフィードから最新ニュースを取得する。
    interval_seconds: 何秒前までのニュースを対象にするか (デフォルト: 30分)
    """
    feeds = [
        "https://www.coindeskjapan.com/feed/",
        "https://coinpost.jp/?feed=rss2",
        "https://www.coindesk.com/arc/outboundfeeds/rss/"
    ]
    
    news_items = []
    now = time.time()
    
    for url in feeds:
        try:
            logger.info(f"📰 フィードを取得中: {url}")
            # requests経由で取得することでタイムアウトとヘッダーを制御
            response = requests.get(url, headers=HEADERS, timeout=15)
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            if feed.bozo:
                logger.warning(f"⚠️ 解析エラー（非致命的）: {url}")

            for entry in feed.entries:
                # published_parsed が無い場合はスキップ
                if not hasattr(entry, 'published_parsed') or not entry.published_parsed:
                    # 更新日付がないニュースは一旦無視
                    continue

                published_time = time.mktime(entry.published_parsed)
                diff = now - published_time
                
                # 指定時間内のニュースのみ抽出
                if diff < interval_seconds:
                    source_name = "CoinDesk Japan" if "coindeskjapan" in url else \
                                  "CoinDesk (EN)" if "coindesk.com" in url else \
                                  "CoinPost"
                    news_items.append({
                        "title": entry.title,
                        "summary": getattr(entry, 'summary', entry.title), 
                        "link": entry.link,
                        "source": source_name,
                        "published_at": time.strftime('%Y-%m-%d %H:%M:%S', entry.published_parsed)
                    })
                    
        except requests.exceptions.Timeout:
            logger.error(f"⌛ タイムアウト発生 ({url})")
        except Exception as e:
            logger.error(f"❌ ニュース取得中にエラー発生 ({url}): {e}")
            
    # 重複削除
    unique_news = {item['link']: item for item in news_items}.values()
    return list(unique_news)

if __name__ == "__main__":
    # テスト用
    logging.basicConfig(level=logging.INFO)
    items = fetch_crypto_news(3600 * 24) # 過去24時間
    for i, item in enumerate(items):
        print(f"[{i+1}] {item['source']} - {item['title']} ({item['published_at']})")
