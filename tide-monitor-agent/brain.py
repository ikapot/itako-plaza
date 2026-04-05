import os
import json
import time
import requests
import feedparser
from datetime import datetime
import pytz

# --- 設定値 ---
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
GITHUB_PAT = os.environ.get("GITHUB_PAT")
GIST_ID = os.environ.get("GIST_ID")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# --- 1. ニュース取得 ---
def fetch_news(interval_seconds=1800):
    """
    主要RSSフィードから最新ニュースを取得する。
    """
    feeds = {
        "World": "https://news.yahoo.co.jp/rss/topics/world.xml",
        "Business": "https://news.yahoo.co.jp/rss/topics/business.xml",
        "IT/Sci": "https://news.yahoo.co.jp/rss/topics/it.xml"
    }
    
    # ユーザー指定の重要コンテキストキーワード
    FOCUS_KEYWORDS = [
        "選挙", "ホルムズ", "地政学", "分断", "戦争", "紛争", "関税",
        "ドル円", "為替", "150円", "金利", "FRB", "日銀", "植田", "パウエル",
        "半導体", "AI", "NVIDIA", "エヌビディア", "TSMC", "提携", "買収",
        "規制", "独占禁", "HBM"
    ]
    
    news_items = []
    now = time.time()
    
    for category, url in feeds.items():
        try:
            print(f"📰 フィードを取得中: {category} ({url})")
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
                    # 概要が存在しない場合はタイトルを代用
                    summary = getattr(entry, 'summary', title) 
                    
                    is_focus = any(kw.lower() in (title + summary).lower() for kw in FOCUS_KEYWORDS)
                    
                    # 重要でないニュースはノイズになるためスキップ
                    if not is_focus:
                        continue
                        
                    news_items.append({
                        "category": category,
                        "title": title,
                        "link": entry.link,
                        "published_at": time.strftime('%Y-%m-%d %H:%M:%S', entry.published_parsed),
                    })
                    
        except Exception as e:
            print(f"❌ ニュース取得中にエラー発生 ({url}): {e}")
            
    # 重複削除
    unique_news = list({item['link']: item for item in news_items}.values())
    
    # 解析負荷を抑えるため、最大15件に絞り込み
    if len(unique_news) == 0:
        return ""
        
    formatted_texts = []
    for item in unique_news[:15]:
        formatted_texts.append(f"- [{item['category']}] {item['title']} ({item['published_at']})")
        
    return "\n".join(formatted_texts)


# --- 2. 状態管理 (GitHub Gist) ---
def load_state():
    if not GITHUB_PAT or not GIST_ID:
        print("⚠️ GITHUB_PAT または GIST_ID が設定されていません。初期状態を返します。")
        return {"tide": "継続", "score": 0.0, "date": ""}
        
    headers = {
        "Authorization": f"token {GITHUB_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }
    resp = requests.get(f"https://api.github.com/gists/{GIST_ID}", headers=headers)
    if resp.status_code == 200:
        files = resp.json().get("files", {})
        if "state.json" in files:
            try:
                return json.loads(files["state.json"]["content"])
            except json.JSONDecodeError:
                pass
    return {"tide": "継続", "score": 0.0, "date": ""}

def save_state(state):
    if not GITHUB_PAT or not GIST_ID:
        return
        
    headers = {
        "Authorization": f"token {GITHUB_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {
        "files": {
            "state.json": {
                "content": json.dumps(state, ensure_ascii=False, indent=2)
            }
        }
    }
    resp = requests.patch(f"https://api.github.com/gists/{GIST_ID}", headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"❌ 状態の保存に失敗しました: {resp.status_code}")

# --- 3. AI 解析ロジック ---
def analyze_tide(news_text):
    if not news_text.strip():
        # ニュースが無い場合は現状維持
        return {"tide": "継続", "score": 0.0, "summary": "直近30分での重要ニュースはありません。", "reason": "-", "hot_sectors": []}
        
    prompt = f"""
あなたは凄腕の機関投資家であり、高度な自律型ジオポリティクス・AIエージェントです。
以下の最新ニュース（過去30分以内の重要項目）を分析し、**日本株市場全体への影響**（スコアと潮目）を出力してください。

【分析要件】
1. 潮目は [継続 / 転換 / 加速 / 終焉] のいずれかを厳密に選択してください。
2. スコアは -1.0 (最悪の暴落リスク) 〜 1.0 (最高の強気相場) の数値を出力してください。
3. 地政学的リスク（中東情勢、米国政治など）、経済指標（ドル円、金利）、テクノロジー動向（半導体、AI）の文脈を深く読み取ってください。

【最新ニュース】
{news_text}

結果は必ず以下のJSONフォーマットで出力してください。Markdownのコードブロック(```json)は付けずに、純粋なJSON文字列のみを返してください。
{{
  "tide": "転換",
  "score": 0.5,
  "summary": "ニュースの全体的な概要とマクロ環境への影響を1〜2文で記述",
  "reason": "あなたがその『潮目』と『スコア』を判定した具体的な根拠",
  "hot_sectors": ["半導体", "防衛", "海運"]
}}
"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://p-ken.net/",
        "X-Title": "Itako Plaza Tide Monitor",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "google/gemini-1.5-flash",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"}
    }
    
    try:
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        resp.raise_for_status()
        raw_content = resp.json()["choices"][0]["message"]["content"]
        
        # JSONパース
        import re
        json_match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
            
    except Exception as e:
        print(f"❌ AI解析中にエラー発生: {e}")
        
    return {"tide": "継続", "score": 0.0, "summary": "分析失敗", "reason": "-", "hot_sectors": []}

# --- 4. Discord 通知 ---
def notify_discord(analysis, is_daily_summary=False, raw_news=""):
    if not DISCORD_WEBHOOK_URL:
        print("⚠️ DISCORD_WEBHOOK_URL が設定されていません。")
        return
        
    color = 0x00FF00 if analysis["score"] > 0 else 0xFF0000
    if analysis["score"] == 0: color = 0x888888
    
    title = "🎨 今日の市場の色彩と筆致（総括）" if is_daily_summary else f"🌊 潮目アラート: 【{analysis['tide']}】"
    
    # セクタを文字列に
    sectors = analysis.get("hot_sectors", [])
    if isinstance(sectors, list):
        sectors_str = ", ".join(sectors)
    else:
        sectors_str = str(sectors)
        
    embed = {
        "title": title,
        "color": color,
        "fields": [
            {"name": "市場スコア", "value": f"{analysis.get('score', 0)} (-1.0 to 1.0)", "inline": True},
            {"name": "注目セクター", "value": sectors_str or "N/A", "inline": True},
            {"name": "ニュース要約", "value": analysis.get("summary", "N/A"), "inline": False},
            {"name": "判断の根拠", "value": analysis.get("reason", "N/A"), "inline": False}
        ]
    }
    
    # ニュースのソースリンクなどを追加する場合
    if raw_news and len(raw_news) < 1024:
        embed["fields"].append({"name": "取得したヘッドライン", "value": raw_news, "inline": False})
        
    requests.post(DISCORD_WEBHOOK_URL, json={"embeds": [embed]})

# --- 実行フロー ---
def main():
    print("🚀 潮目監視エージェントを起動しました。")
    
    jst = pytz.timezone('Asia/Tokyo')
    now = datetime.now(jst)
    
    # 1日の終わりの総括タイミングか？（毎晩23:00〜23:29の間）
    is_daily_summary = (now.hour == 23 and 0 <= now.minute < 30)
    
    # ニュースの取得（通常は過去30分、総括時は長めに過去24時間を取得）
    interval = 86400 if is_daily_summary else 1800
    news_text = fetch_news(interval)
    
    if not news_text and not is_daily_summary:
        print("ℹ️ 重要ニュースがありませんでした。処理を終了します。")
        return
        
    print(f"✅ {len(news_text.splitlines())} 件の重要ニュースを抽出しました。AIに解析を依頼します...")
    
    # AI解析
    analysis = analyze_tide(news_text)
    print(f"📊 解析結果: 潮目=[{analysis.get('tide')}], スコア=[{analysis.get('score')}]")
    
    # 状態のロードと比較
    prev_state = load_state()
    current_tide = analysis.get("tide", "継続")
    
    # トリガー判定 (潮目が変わったか、または毎晩23時台のアーティスト総括)
    is_tide_changed = (current_tide != prev_state.get("tide"))
    
    if is_tide_changed or is_daily_summary:
        print("🔔 変化を検知（またはデイリー総括）！Discordへ通知します。")
        notify_discord(analysis, is_daily_summary, news_text)
        
        # 状態の更新
        new_state = {
            "tide": current_tide,
            "score": analysis.get("score", 0.0),
            "date": now.isoformat()
        }
        save_state(new_state)
    else:
        print("💤 潮目に変化はありません。通知をスキップします。")

if __name__ == "__main__":
    main()
