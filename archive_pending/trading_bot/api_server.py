from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel
import asyncio
import os
from .config import WEBHOOK_SECRET, MAX_LOSS_PER_TRADE
from .rakuten_bot import RakutenBot
from .notify import notify_all

app = FastAPI(title="Itako Trading Webhook")

class Signal(BaseModel):
    symbol: str        # 銘柄コード '7203' など
    side: str          # 'BUY' または 'SELL'
    price: float       # 現在価格（リスク計算用）
    action: str        # 'OPEN' または 'CLOSE'
    secret: str        # 簡易認証用

@app.get("/")
async def root():
    return {"status": "running"}

@app.post("/webhook")
async def handle_webhook(signal: Signal):
    """
    TradingView 等からの Webhook を受信。
    """
    # 認証チェック
    if signal.secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    print(f"[Webhook] Received: {signal}")
    
    # 1% リスク管理ロジック (100円以内の損失に抑える)
    # かぶミニ（1株投資）の場合、1株の価格にかかわらず最大損失は100円
    # 1株だけ買うなら、株価が0円になっても損失は「株価そのもの」
    # もし株価が10,000円なら、1%の損切り（100円）で撤退する必要がある。
    
    # 注文数計算 (かぶミニなので 1株固定で開始)
    quantity = 1
    
    # 非同期で Bot 実行 (順次実行が好ましい)
    # 本来はキューイングすべきだが、小規模運用のため await で対応
    bot = RakutenBot()
    try:
        await bot.start()
        await bot.login()
        success = await bot.place_order_kabu_mini(signal.symbol, signal.side, quantity)
        if success:
            return {"message": "Order processed", "symbol": signal.symbol, "quantity": quantity}
        else:
            return {"message": "Order failed"}
    except Exception as e:
        print(f"[Error] {e}")
        notify_all(f"🚨 Webhook 処理中にエラー発生: {e}")
        return {"message": "Error occurred"}
    finally:
        await bot.stop()

# 実行方法: uvicorn trading_bot.api_server:app --host 0.0.0.0 --port 8000
