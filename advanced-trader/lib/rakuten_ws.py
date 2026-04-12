import asyncio
import json
import logging
import websockets
from typing import Callable, Optional

logger = logging.getLogger("RakutenWS")

class RakutenWebSocketClient:
    """
    Rakuten Wallet WebSocket Client (CFD)
    """
    def __init__(self, ws_url: str = "wss://exchange.rakuten-wallet.co.jp/ws"):
        self.ws_url = ws_url
        self.websocket = None
        self.running = False
        self.on_ticker: Optional[Callable] = None
        self.on_orderbook: Optional[Callable] = None

    async def connect(self):
        """WebSocket に接続し、待機ループを開始する"""
        logger.info(f"🔌 Connecting to Rakuten WebSocket: {self.ws_url}")
        self.running = True
        
        while self.running:
            try:
                async with websockets.connect(self.ws_url) as ws:
                    self.websocket = ws
                    logger.info("✅ WebSocket connected.")
                    
                    # 購読の開始 (BTC/JPY Ticker: ID=7)
                    await self.subscribe("TICKER", 7)
                    
                    # メッセージループ
                    async for message in ws:
                        await self._handle_message(message)
                        
            except websockets.exceptions.ConnectionClosed:
                logger.warning("⚠️ WebSocket connection closed. Reconnecting...")
            except Exception as e:
                logger.error(f"❌ WebSocket error: {e}")
            
            if self.running:
                await asyncio.sleep(5)  # 再接続待機

    async def subscribe(self, channel: str, symbol_id: int):
        """特定のチャンネルを購読する"""
        if not self.websocket:
            return
        payload = {
            "action": "SUBSCRIBE",
            "channel": channel,
            "params": {"symbolId": symbol_id}
        }
        await self.websocket.send(json.dumps(payload))
        logger.info(f"📡 Subscribed to {channel} for Symbol {symbol_id}")

    async def _handle_message(self, message: str):
        """受信メッセージの振り分け"""
        try:
            data = json.loads(message)
            channel = data.get("channel")
            
            if channel == "TICKER" and self.on_ticker:
                self.on_ticker(data.get("data"))
            elif channel == "ORDERBOOK" and self.on_orderbook:
                self.on_orderbook(data.get("data"))
            else:
                logger.debug(f"📩 WS Message: {message}")
        except Exception as e:
            logger.error(f"❌ Message parsing error: {e}")

    def stop(self):
        """クライアントを停止する"""
        self.running = False
        if self.websocket:
            asyncio.create_task(self.websocket.close())
