import os
import logging
from fastapi import FastAPI, BackgroundTasks, HTTPException, Header
from engine.trading import NewsTradingEngine
from dotenv import load_dotenv

load_dotenv()

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Itako News-Trade Bot V2")
engine = NewsTradingEngine(dry_run=True) # 本番は False に変更するか環境変数で制御

@app.get("/")
def read_root():
    return {"status": "running", "engine": "Itako News-Trade Bot V2"}

@app.post("/trigger")
def trigger_cycle(background_tasks: BackgroundTasks):
    """
    Cloud Scheduler から 15〜30分おきに呼び出されるエンドポイント。
    """
    logger.info("📅 サイクル実行がトリガーされました。")
    
    # バックグラウンドでトレードサイクルを回す (HTTP 200を先に返してタイムアウトを回避)
    background_tasks.add_task(engine.run_cycle)
    
    return {"message": "Cycle started in background"}

@app.post("/approve")
def approve_trade(side: str, analysis_id: str = None):
    """
    Discord からの承認を受け取り、実際の注文を執行する。
    """
    if side not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Invalid trade side")
    
    logger.info(f"👍 承認を受け取りました: {side}")
    res = engine.execute_approved_trade(side, analysis_id)
    
    return {"status": "executed" if res.get('success') else "failed", "details": res}

if __name__ == "__main__":
    import uvicorn
    # ローカル起動用
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
