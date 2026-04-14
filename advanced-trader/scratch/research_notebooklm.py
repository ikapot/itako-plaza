import asyncio
import os
import sys
from dotenv import load_dotenv

# プロジェクトルートとライブラリパスの追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from notebooklm import NotebookLMClient
except ImportError:
    print("Error: notebooklm module not found in the current environment.")
    sys.exit(1)

async def main():
    # .env.notebooklm から認証情報を読み込む (もしあれば)
    load_dotenv("advanced-trader/.env.notebooklm")
    
    # ユーザーの指示に基づき、特定の情報を問い合わせる
    # ノートブックIDが不明なため、まずはリストを表示させる
    client_instance = await NotebookLMClient.from_storage()
    async with client_instance as client:
        print("Connecting to NotebookLM...")
        notebooks = await client.notebooks.list()
        
        if not notebooks:
            print("No notebooks found.")
            return

        # ターゲットとなるノートブックを特定 (名前で検索)
        target_nb = None
        for nb in notebooks:
            if "楽天ウォレット" in nb.title or "Rakuten" in nb.title:
                target_nb = nb
                break
        
        if not target_nb:
            target_nb = notebooks[0] # 見つからない場合は最新を使用
            print(f"Target notebook not found. Using the first one: {target_nb.title}")
        else:
            print(f"Targeting notebook: {target_nb.title}")

        # リサーチクエリの発行
        query = (
            "楽天ウォレット API（CFD/証拠金取引）について教えてください。\n"
            "1. 署名（Signature）作成時のパラメータ連結順序を正確に教えてください。\n"
            "2. WebSocket の TICKER 構造は入れ子（channel/data）ですか、それともフラットですか？\n"
            "最新の仕様（ソース 12, 16）に基づいて回答してください。"
        )
        
        print("Thinking... Waiting for response from NotebookLM Brain...")
        result = await client.chat.ask(target_nb.id, query)
        
        print("\n--- 🧠 Research Result from NotebookLM ---")
        print(result.text)
        print("------------------------------------------\n")

if __name__ == "__main__":
    asyncio.run(main())
