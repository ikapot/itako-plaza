import feedparser
import time
import logging

logger = logging.getLogger(__name__)

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
            feed = feedparser.parse(url)
            
            if feed.bozo:
                logger.warning(f"⚠️ 解析エラー（非致命的）: {url}")
                # bozoがTrueでもデータが取れている場合がある

            for entry in feed.entries:
                # published_parsed が無い場合はスキップ、または現在時刻を採用
                if not hasattr(entry, 'published_parsed') or not entry.published_parsed:
                    # 更新日付がないニュースは一旦無視、または「最新」として扱う（要件に応じて）
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
                        "summary": getattr(entry, 'summary', entry.title), # summaryがない場合はtitle
                        "link": entry.link,
                        "source": source_name,
                        "published_at": time.strftime('%Y-%m-%d %H:%M:%S', entry.published_parsed)
                    })
                    
        except Exception as e:
            logger.error(f"❌ ニュース取得中にエラー発生 ({url}): {e}")
            
    # 重複削除（同じニュースが複数回取得された場合）
    unique_news = {item['link']: item for item in news_items}.values()
    return list(unique_news)

if __name__ == "__main__":
    # テスト用
    logging.basicConfig(level=logging.INFO)
    items = fetch_crypto_news(3600 * 24) # 過去24時間
    for i, item in enumerate(items):
        print(f"[{i+1}] {item['source']} - {item['title']} ({item['published_at']})")
