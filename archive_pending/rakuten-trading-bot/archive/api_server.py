from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from strategy import StrategyManager
from rakuten_wallet_client import RakutenWalletClient
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
strategy = StrategyManager()
wallet_client = RakutenWalletClient()

class WebhookSignal(BaseModel):
    ticker: str    # BTC_JPY など
    action: str    # BUY または SELL
    price: float   # その時の価格
    rsi: float     # その時のRSI（TradingViewから送られてくる想定）

@app.get("/")
async def root():
    return {"status": "Rakuten Crypto Bot API is active"}

@app.post("/webhook")
async def receive_webhook(signal: WebhookSignal):
    """
    TradingView からのシグナル（チャンス！）を受け取る場所
    """
    print(f"💰 シグナル受信: {signal.ticker} を {signal.action} しようとしています (RSI: {signal.rsi})")

    # 1. 資金管理・リスクチェック (元手の1%ルールなど)
    # 損切り100円のルールを守っているか、strategy.pyのロジックを適用
    # ※ 本番ではここで残高取得を行い、注文量を算出
    
    # 2. 楽天ウォレットへ注文を出す
    try:
        # ここではシミュレーションとして表示のみにしています
        order_result = wallet_client.place_order(
            pair=signal.ticker,
            side=signal.action,
            amount=0.001  # 最小単位などの微調整が必要
        )
        print(f"✅ 注文結果: {order_result}")
        return {"status": "success", "order": order_result}
    except Exception as e:
        print(f"❌ 注文エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
