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
    潮目感知AIによる解析結果とトレード承認依頼を Discord に送る。
    """
    decision = analysis_result.get('decision', 'HOLD')
    tide = analysis_result.get('tide_status', '不明')
    impact = analysis_result.get('impact', 0)
    reason = analysis_result.get('reason', 'N/A')
    
    div = analysis_result.get('divergence_check', {})
    pred = analysis_result.get('scenario_prediction', {})
    
    # 彩色決定
    color = 0x2ecc71 if decision == 'BUY' else 0xe74c3c if decision == 'SELL' else 0x95a5a6
    if impact >= 8: color = 0x9b59b6 # 重大インパクトは紫
    
    fields = [
        {"name": "🌊 潮目判定", "value": f"**`{tide}`**", "inline": True},
        {"name": "🤖 意思決定", "value": f"`{decision}`", "inline": True},
        {"name": "💥 衝撃度", "value": f"{impact}/10", "inline": True},
        {"name": "⚖️ 市場の乖離", "value": f"Score: {div.get('score', 0)}\n*{div.get('comment', '特になし')}*", "inline": False},
        {"name": "🔮 3hシナリオ予測", "value": f"**{pred.get('target_3h', '不明')}**\n(確信度: {pred.get('confidence', 0)}%)", "inline": False},
        {"name": "📖 戦略的背景", "value": reason, "inline": False},
        {"name": "📰 監視センサー検知", "value": "\n".join([f"• {t}" for t in news_titles[:5]]), "inline": False}
    ]
    
    message = "🌊 **世界の潮目に変化を検知しました。戦略的エントリを承認しますか？**"
    
    return send_discord_notification("🛰️ 潮目感知・承認リクエスト", message, color=color, fields=fields)
