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
    def __init__(self, symbol_id: int = 10, ws_url: str = "wss://exchange.rakuten-wallet.co.jp/ws"):
        self.ws_url = ws_url
        self.symbol_id = symbol_id
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
                    
                    # 購読の開始
                    await self.subscribe("TICKER", self.symbol_id)
                    
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
        # 正確な仕様に基づいたフラットな JSON 構造
        payload = {
            "symbolId": symbol_id,
            "type": "subscribe",
            "data": channel  # channel は "TICKER", "ORDERBOOK", "TRADES"
        }
        await self.websocket.send(json.dumps(payload))
        logger.info(f"📡 Subscribed to {channel} for Symbol {symbol_id}")

    async def _handle_message(self, message: str):
        """受信メッセージの振り分け"""
        if not message or message.strip() == "":
            return # 空メッセージは無視
            
        try:
            data = json.loads(message)
            channel = data.get("channel")
            
            if channel == "TICKER" and self.on_ticker:
                self.on_ticker(data.get("data"))
            elif channel == "ORDERBOOK" and self.on_orderbook:
                self.on_orderbook(data.get("data"))
            else:
                logger.debug(f"📩 WS Message: {message}")
        except json.JSONDecodeError:
            # JSON ではないメッセージ（接続確認など）はデバッグログに留める
            logger.debug(f"📩 Non-JSON Message: {message}")
        except Exception as e:
            logger.error(f"❌ Message processing error: {e}")

    def stop(self):
        """クライアントを停止する"""
        self.running = False
        if self.websocket:
            asyncio.create_task(self.websocket.close())
