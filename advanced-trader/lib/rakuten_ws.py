import asyncio
import json
import logging
import websockets
from typing import Callable, Optional

logger = logging.getLogger("RakutenWS")

class RakutenWebSocketClient:
    """
    Rakuten Wallet WebSocket Client (CFD)
    再編版: 安定性と再接続能力を強化
    """
    def __init__(self, symbol_id: int = 10, ws_url: str = "wss://exchange.rakuten-wallet.co.jp/ws"):
        self.ws_url = ws_url
        self.symbol_id = symbol_id
        self.websocket = None
        self.running = False
        self.on_ticker: Optional[Callable] = None
        
    async def connect(self):
        """WebSocket に接続し、待機ループを開始する (自動再接続付き)"""
        logger.info(f"Initializing WebSocket connection to {self.ws_url}...")
        self.running = True
        retry_delay = 1
        
        while self.running:
            try:
                async with websockets.connect(self.ws_url, ping_interval=20, ping_timeout=10) as ws:
                    self.websocket = ws
                    logger.info("WebSocket connected and active.")
                    retry_delay = 1 # 成功時にリトライ遅延をリセット
                    
                    # 購読の開始 (TICKER)
                    await self.subscribe("TICKER", self.symbol_id)
                    
                    # メッセージループ
                    async for message in ws:
                        if not self.running: break
                        await self._handle_message(message)
                        
            except (websockets.exceptions.ConnectionClosed, Exception) as e:
                if not self.running: break
                logger.warning(f"WebSocket disconnected ({e}). Reconnecting in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60) # 最大60秒まで指数バックオフ

    async def subscribe(self, channel: str, symbol_id: int):
        """特定のチャンネル (TICKER, ORDERBOOK 等) を購読する"""
        if not self.websocket: return
        payload = {
            "symbolId": symbol_id,
            "type": "subscribe",
            "data": channel
        }
        await self.websocket.send(json.dumps(payload))
        logger.info(f"Subscribed to {channel} for Symbol {symbol_id}")

    async def _handle_message(self, message: str):
        """受信した Raw メッセージの解析と配信"""
        if not message or not isinstance(message, str): return
        
        try:
            data = json.loads(message)
            # サーバーはフラットな JSON (symbolId 等を含む) を送ってくることを特定
            if "symbolId" in data and self.on_ticker:
                self.on_ticker(data)
                    
        except json.JSONDecodeError:
            pass # PONG 等の非JSONメッセージは無視
        except Exception as e:
            logger.error(f"❌ WS Message handler error: {e}")

    def stop(self):
        """クライアントの安全な停止"""
        logger.info("🛑 Stopping WebSocket client...")
        self.running = False
        # ループを抜けるためにコネクションを明示的に閉じる
        if self.websocket:
            asyncio.create_task(self.websocket.close())
