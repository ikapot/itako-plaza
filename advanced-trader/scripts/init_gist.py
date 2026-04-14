import os
import json
import datetime
from lib.gist_sync import GistSync

def initialize_gist():
    pat = os.environ.get("GITHUB_PAT_GIST")
    gist_id = os.environ.get("GIST_ID")
    
    if not pat or not gist_id:
        print("❌ GITHUB_PAT_GIST or GIST_ID not set in local environment.")
        return

    gist = GistSync(pat, gist_id, "trade_status.json")
    
    dummy_state = {
        "timestamp": datetime.datetime.now().isoformat(),
        "bestBid": 9500.0,
        "bestAsk": 9510.0,
        "rsi": 50.0,
        "ema_trend": "NEUTRAL",
        "price": 9505.0,
        "status": "INITIALIZING",
        "indicators": {
            "ATR": 10.0,
            "EMA_direction": "NEUTRAL",
            "RSI": 50.0,
            "Z_score": 0.0
        },
        "capital": {
            "balance": 2000.0,
            "gain_loss_percent": 0.0
        },
        "history": [],
        "ai_bias": "NEUTRAL",
        "ai_reason": "System Initializing..."
    }
    
    try:
        gist.save(dummy_state)
        print("✅ Gist initialized successfully with trade_status.json")
    except Exception as e:
        print(f"❌ Failed to initialize Gist: {e}")

if __name__ == "__main__":
    initialize_gist()
