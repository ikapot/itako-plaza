import os
import logging
from fastapi import FastAPI, BackgroundTasks, HTTPException
from engine.trading import NewsTradingEngine
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

# ロギング設定の初期化
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Itako News-Trade Bot V2",
    description="AIによるニュース解析に基づいた楽天ウォレット自動売買システム",
    version="2.1.0"
)

# エンジンの初期化 (設定は環境変数 DRY_RUN, TRADE_AMOUNT 等から自動取得)
engine = NewsTradingEngine()

from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

# 静的ファイルの配信
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    """ダッシュボードへ自動リダイレクト"""
    return RedirectResponse(url="/static/index.html")

@app.get("/api/status")
async def get_status():
    """現在のボットの状態、資産、価格を一括取得"""
    try:
        data = engine.get_dashboard_data()
        return data
    except Exception as e:
        import traceback
        logger.error(f"❌ APIデータ取得エラー: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trigger")
async def trigger_cycle(background_tasks: BackgroundTasks):
    """
    定期実行（Cloud Scheduler等）からのエントリポイント。
    """
    logger.info("📅 外部トリガーによりトレードサイクルを開始します。")
    background_tasks.add_task(engine.run_cycle)
    return {"message": "Trade cycle started in background"}

@app.post("/test-mock")
async def trigger_mock_cycle(background_tasks: BackgroundTasks):
    """
    検証用のモックニュースを注入してサイクルをテスト実行します。
    """
    logger.info("🧪 テストトリガーを受け取りました (Mock News)。")
    mock_news = [
        {"title": "ビットコインの機関投資家による採用が加速、現物買付が過去最高を記録", "source": "Internal Test"},
        {"title": "主要国の中央銀行がデジタル資産の準備金採用を検討開始", "source": "Internal Test"}
    ]
    background_tasks.add_task(engine.run_mock_cycle, mock_news)
    return {"message": "Mock test cycle started in background"}

@app.post("/approve")
async def approve_trade(side: str, analysis_id: str = None):
    """
    Discord等の外部インターフェースからの最終承認を受けて注文を執行します。
    """
    if side not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Invalid trade side (Must be BUY or SELL)")
    
    logger.info(f"👍 承認コマンドを受信: {side}")
    res = engine.execute_approved_trade(side, analysis_id)
    
    return {
        "status": "success" if res.get('success') else "failure",
        "execution_details": res
    }

if __name__ == "__main__":
    import uvicorn
    # Cloud Run 等の環境に合わせたポート番号で起動
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
