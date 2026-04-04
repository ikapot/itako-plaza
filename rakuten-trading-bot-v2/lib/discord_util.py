import os
import requests
import json
import logging

logger = logging.getLogger(__name__)

def send_discord_notification(title, message, color=0x3498db, fields=None):
    """
    Discord Webhook を介して通知を送る。
    fields: [{"name": "Label", "value": "Value", "inline": True}]
    """
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        logger.warning("⚠️ DISCORD_WEBHOOK_URL が設定されていません。")
        return False

    payload = {
        "embeds": [{
            "title": title,
            "description": message,
            "color": color,
            "fields": fields or [],
            "footer": {"text": "Itako News-Trade Bot"}
        }]
    }

    try:
        resp = requests.post(webhook_url, data=json.dumps(payload), headers={"Content-Type": "application/json"})
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"❌ Discord 通知送信エラー: {e}")
        return False

def request_trade_approval(news_titles, analysis_result, ticker_data):
    """
    トレードの承認を依頼するための特殊な通知。
    """
    decision = analysis_result.get('decision', 'HOLD')
    reason = analysis_result.get('reason', 'N/A')
    score = analysis_result.get('sentiment_score', 0)
    impact = analysis_result.get('impact', 0)
    
    color = 0x2ecc71 if decision == 'BUY' else 0xe74c3c if decision == 'SELL' else 0x95a5a6
    
    fields = [
        {"name": "🤖 AI 判定", "value": f"`{decision}` (Score: {score})", "inline": True},
        {"name": "💥 インパクト", "value": str(impact), "inline": True},
        {"name": "💰 現在価格", "value": f"{ticker_data.get('last', 'N/A')} JPY", "inline": True},
        {"name": "📖 理由", "value": reason, "inline": False},
        {"name": "📰 ニュースソース", "value": "\n".join([f"• {t}" for t in news_titles]), "inline": False}
    ]
    
    message = "⚠️ **AIが売買判断を下しました。承認しますか？**\n(現状は手動実行、または別途ボットでの承認ボタン待ちとなります)"
    
    return send_discord_notification("🚀 トレード承認リクエスト", message, color=color, fields=fields)
