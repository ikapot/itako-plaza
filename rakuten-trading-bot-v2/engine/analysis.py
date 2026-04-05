import os
import requests
import json
import logging
from config.prompts import SENTIMENT_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)

def analyze_sentiment(news_items):
    """
    OpenRouter (Gemini 1.5 Flash) を使用し、ニュースのリストを解析する。
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("❌ OPENROUTER_API_KEY が設定されていません。")
        return {"error": "Missing API Key"}

    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # ニュースタイトルの結合（制限に気をつけつつ、一つのプロンプトにまとめる）
    all_titles = "\n".join([f"- {item['title']} ({item['source']})" for item in news_items])
    
    payload = {
        "model": "google/gemini-flash-1.5",
        "messages": [
            {"role": "system", "content": SENTIMENT_ANALYSIS_PROMPT},
            {"role": "user", "content": f"以下のニュース群を統合的に解析し、BTC市場への影響を判定してください:\n\n{all_titles}"}
        ],
        "response_format": {"type": "json_object"}
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://itako-plaza.com", # 任意
        "X-Title": "Itako Trade Bot"
    }

    try:
        logger.info(f"🤖 AI感情分析を実行中 (OpenRouter)... 記事数: {len(news_items)}")
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        
        data = response.json()
        content = data['choices'][0]['message']['content']
        
        # 文字列として返ってきたJSONをパース
        analysis_result = json.loads(content)
        logger.info(f"✅ 解析完了: Tide={analysis_result.get('tide_status')} | Impact={analysis_result.get('impact')} | Decision={analysis_result.get('decision')}")
        if "scenario_prediction" in analysis_result:
            pred = analysis_result["scenario_prediction"]
            logger.info(f"🔮 3h予測: {pred.get('target_3h')} (確信度: {pred.get('confidence')}%)")
            
        return analysis_result

    except Exception as e:
        logger.error(f"❌ AI分析中にエラー発生: {e}")
        return {"error": str(e), "decision": "HOLD"} # エラー時は安全のため HOLD

if __name__ == "__main__":
    # テスト用
    logging.basicConfig(level=logging.INFO)
    test_news = [
        {"title": "米国政府がビットコイン現物ETFを公式承認、ブラックロックが主導", "source": "CoinDesk Japan"},
        {"title": "主要取引所でBTCの異例の大量流出、売り圧力が低下か", "source": "CoinPost"}
    ]
    result = analyze_sentiment(test_news)
    print(json.dumps(result, indent=2, ensure_ascii=False))
