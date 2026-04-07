import requests
import json
from datetime import datetime

def send_discord(webhook_url, title, content, color=0x888888, dry_run=True):
    """
    Discord Webhook に通知を送信する
    """
    if not webhook_url:
        return None

    prefix = "🧪 [DRY RUN] " if dry_run else "💹 [LIVE] "
    
    payload = {
        "embeds": [{
            "title": f"{prefix}{title}",
            "description": content,
            "color": color,
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "Itako Plaza QuantBot v3"
            }
        }]
    }

    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        response.raise_for_status()
        return response
    except Exception as e:
        print(f"❌ Discord通知エラー: {e}")
        return None
