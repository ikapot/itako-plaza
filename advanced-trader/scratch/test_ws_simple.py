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
        # データの構造に合わせて抽出
        price = data.get('last', data.get('bid'))
        print(f"📡 LTC価格受信: {price} JPY")

    client.on_ticker = handle_ticker
    
    print("🚀 WebSocket Test Starting... (Press Ctrl+C to stop)")
    await client.connect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test stopped.")
