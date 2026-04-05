import os
import requests
import json
import logging
from lib.rakuten_api import RakutenWalletClient
from lib.firestore import TradingState

logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """
あなたは現代アーティストの専属キュレーター兼、金融市場の翻訳家です。
今日のトレード結果と市場のニュース、そして「潮目」の変化を統合し、アーティストであるユーザーに向けて「1枚の抽象画」としての総括を提示してください。

## 入力データ例
- 収支: +500 JPY
- 潮目: 転換から加速へ
- 主なトピック: ホルムズ海峡の緊張、ブラックロックのRWA参入

## 出力形式
1. **今日のキャンバス**: 市場全体の空気感を一言で。
2. **色彩と筆致**: どのような色が使われ、どのような筆致（激しい、繊細、静謐など）で描かれるべきか。
3. **キュレーターの添え書き**: 市場の本質を突く、アーティストへのメッセージ。

芸術的で刺激的な言葉を用いて、日本語で出力してください。
"""

def generate_daily_summary():
    """1日のトレードとニュースを振り返り、芸術的な総括を生成する"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    client = RakutenWalletClient()
    state = TradingState()
    
    # 実際には Firestore の履歴から本日のデータを取得すべきだが、
    # プロトタイプとして現在のステータスと価格情報を使用
    status = state.get_status()
    ticker = client.get_ticker(7)
    
    # 解析用メッセージの構築
    summary_input = f"""
    - 現在のポジション: {status.get('position', 'なし')}
    - エントリ価格: {status.get('entry_price', 0)}
    - 現在価格: {ticker.get('last', 0)}
    - 地政学的コンテキスト: 最近の潮目感知サイクルに基づく
    """
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "google/gemini-flash-1.5",
        "messages": [
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "user", "content": f"本日の総括をお願いします:\n{summary_input}"}
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        logger.info("🎨 芸術的な日次総括を生成中...")
        resp = requests.post(url, headers=headers, data=json.dumps(payload))
        resp.raise_for_status()
        
        content = resp.json()['choices'][0]['message']['content']
        return content
    except Exception as e:
        logger.error(f"❌ 総括生成エラー: {e}")
        return "本日のキャンバスは、まだ白紙です。(エラーにより生成失敗)"
