import requests
from .config import DISCORD_WEBHOOK_URL, LINE_NOTIFY_TOKEN

def send_discord_notification(message: str):
    """
    Discord Webhook を使用して通知を送信。
    """
    if not DISCORD_WEBHOOK_URL:
        print("[Warning] DISCORD_WEBHOOK_URL is not set.")
        return
    
    data = {"content": message}
    try:
        response = requests.post(DISCORD_WEBHOOK_URL, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"[Error] Failed to send Discord notification: {e}")

def send_line_notification(message: str):
    """
    LINE Notify を使用して通知を送信。
    """
    if not LINE_NOTIFY_TOKEN:
        print("[Warning] LINE_NOTIFY_TOKEN is not set.")
        return
    
    url = "https://notify-api.line.me/api/notify"
    headers = {"Authorization": f"Bearer {LINE_NOTIFY_TOKEN}"}
    data = {"message": message}
    try:
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
    except Exception as e:
        print(f"[Error] Failed to send LINE notification: {e}")

def notify_all(message: str):
    """
    設定されているすべてのチャンネルに通知。
    """
    print(f"[Notify] {message}")
    send_discord_notification(message)
    send_line_notification(message)
