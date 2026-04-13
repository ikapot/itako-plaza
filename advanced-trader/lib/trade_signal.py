import os
import json
import logging
from datetime import datetime

logger = logging.getLogger("TradeSignal")

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SIGNAL_FILE = os.path.join(WORKSPACE_ROOT, "brain", "trade_approval.json")

def create_signal(side: str, price: float, z_score: float):
    """新しいトレードシグナルを Pending 状態で保存する"""
    signal = {
        "id": f"sig_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "timestamp": datetime.now().isoformat(),
        "side": side,
        "price": price,
        "z_score": round(z_score, 2),
        "status": "pending"
    }
    
    os.makedirs(os.path.dirname(SIGNAL_FILE), exist_ok=True)
    with open(SIGNAL_FILE, "w", encoding="utf-8") as f:
        json.dump(signal, f, indent=2, ensure_ascii=False)
    
    logger.info(f"📡 New Signal Created: {side} at {price} (Z={z_score:.2f}) - Status: Pending")
    return signal

def get_signal_status():
    """現在のシグナルの承認状態を取得する"""
    if not os.path.exists(SIGNAL_FILE):
        return None
    
    try:
        with open(SIGNAL_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading signal file: {e}")
        return None

def update_signal_status(status: str):
    """シグナルの状態（approved | rejected）を更新する"""
    signal = get_signal_status()
    if not signal:
        return False
    
    signal["status"] = status
    signal["updated_at"] = datetime.now().isoformat()
    
    with open(SIGNAL_FILE, "w", encoding="utf-8") as f:
        json.dump(signal, f, indent=2, ensure_ascii=False)
    
    logger.info(f"🔄 Signal {signal['id']} updated to: {status}")
    return True

def clear_signal():
    """処理が終わったシグナルを削除またはクリアする"""
    if os.path.exists(SIGNAL_FILE):
        os.remove(SIGNAL_FILE)
        logger.info("🧹 Signal file cleared.")
