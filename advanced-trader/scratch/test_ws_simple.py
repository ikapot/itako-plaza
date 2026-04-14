import asyncio
import sys
import os

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from lib.rakuten_ws import RakutenWebSocketClient

async def main():
    # LTC(10) を購読するクライアントを初期化
    client = RakutenWebSocketClient(symbol_id=10)
    
    # ティッカーを受け取った時の処理（マスターの案を採用）
    def handle_ticker(data):
        print(f"LTC価格受信: {data}", flush=True)

    client.on_ticker = handle_ticker
    
    # 生メッセージを確認するためのデバッグ用フック (もしあれば)
    # ここでは既存の _handle_message をラップして生出力させる
    original_handle = client._handle_message
    async def debug_handle(message):
        print(f"RAW MESSAGE: {message}", flush=True)
        await original_handle(message)
    client._handle_message = debug_handle
    
    print("WebSocket Test Starting... Connecting to server...", flush=True)
    await client.connect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test stopped.")
