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
        msg = f"Initializing WebSocket connection to {self.ws_url}..."
        logger.info(msg)
        print(f"[WS_DIAG] {msg}") # GitHub Actions での表示用
        self.running = True
        retry_delay = 1
        
        while self.running:
            try:
                # 403 Forbidden 回避のために Origin ヘッダーを指定
                headers = {"Origin": "https://exchange.rakuten-wallet.co.jp"}
                # websockets 14.0+ では additional_headers を使用
                async with websockets.connect(
                    self.ws_url, 
                    ping_interval=20, 
                    ping_timeout=10, 
                    open_timeout=15, # 接続タイムアウト
                    additional_headers=headers
                ) as ws:
                    self.websocket = ws
                    msg_ok = "WebSocket connected and active."
                    logger.info(msg_ok)
                    print(f"[WS_DIAG] {msg_ok}")
                    
                    retry_delay = 1 # 成功時にリトライ遅延をリセット
                    
                    # 購読の開始 (TICKER)
                    await self.subscribe("TICKER", int(self.symbol_id)) # 念のため int キャスト
                    
                    # メッセージループ
                    async for message in ws:
                        if not self.running: break
                        await self._handle_message(message)
                        
            except Exception as e:
                if not self.running: break
                err_msg = f"WebSocket error/disconnected ({type(e).__name__}: {e}). Reconnecting in {retry_delay}s..."
                logger.warning(err_msg)
                print(f"[WS_DIAG] {err_msg}")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60) # 最大60秒まで指数バックオフ

    async def subscribe(self, channel: str, symbol_id: int):
        """特定のチャンネル (TICKER, ORDERBOOK 等) を購読する"""
        if not self.websocket: return
        payload = {
            "symbolId": int(symbol_id), # 整数型を厳守
            "type": "subscribe",
            "data": channel
        }
        await self.websocket.send(json.dumps(payload))
        msg = f"Subscribed to {channel} for Symbol {symbol_id}"
        logger.info(msg)
        print(f"[WS_DIAG] {msg}")

    async def _handle_message(self, message: str):
        """受信した Raw メッセージの解析と配信"""
        if not message: return
        
        try:
            # PONG 等の非JSONメッセージを判別
            data = json.loads(message)
            
            # デバッグ用: 初回のみ内容を表示
            if not hasattr(self, "_first_msg_seen"):
                print(f"[WS_DIAG] First message received: {message[:200]}")
                self._first_msg_seen = True

            # サーバーはフラットな JSON (symbolId 等を含む) を送ってくることを特定
            if "symbolId" in data and self.on_ticker:
                self.on_ticker(data)
                    
        except json.JSONDecodeError:
            # 頻繁に出る場合はここを調整
            # logger.debug(f"Non-JSON message: {message}")
            pass 
        except Exception as e:
            logger.error(f"❌ WS Message handler error: {e}")
            print(f"[WS_DIAG] Handler error: {e}")

    def stop(self):
        """クライアントの安全な停止"""
        logger.info("🛑 Stopping WebSocket client...")
        self.running = False
        # ループを抜けるためにコネクションを明示的に閉じる
        if self.websocket:
            asyncio.create_task(self.websocket.close())
