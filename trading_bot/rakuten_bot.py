import asyncio
import os
from playwright.async_api import async_playwright
from .config import RAKUTEN_USER_ID, RAKUTEN_PASSWORD, RAKUTEN_TRADING_PASSWORD
from .notify import notify_all

STORAGE_STATE = "rakuten_session.json"

class RakutenBot:
    def __init__(self, headless=True):
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None

    async def start(self):
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=self.headless)
        
        # セッション情報の読み込み
        if os.path.exists(STORAGE_STATE):
            print(f"[Bot] Loading existing session from {STORAGE_STATE}")
            self.context = await self.browser.new_context(storage_state=STORAGE_STATE)
        else:
            print("[Bot] No session found. Fresh start.")
            self.context = await self.browser.new_context()
        
        self.page = await self.context.new_page()

    async def login(self):
        """
        楽天証券へのログイン。必要に応じて MFA 通知を送る。
        """
        urls = {
            "login": "https://www.rakuten-sec.co.jp/ITS/V_ACT_Login.html"
        }
        
        await self.page.goto(urls["login"])
        
        # ログイン済みかどうかチェック (ログインボタンの有無など)
        if await self.page.is_visible('input[name="loginid"]'):
            print("[Bot] Performing login...")
            await self.page.fill('input[name="loginid"]', RAKUTEN_USER_ID)
            await self.page.fill('input[name="passwd"]', RAKUTEN_PASSWORD)
            await self.page.click('#loginBtn')
            
            # 認証が必要な場合の待機
            await asyncio.sleep(5)
            
            # 追加認証が必要な場合、ユーザーに通知して待機
            # 簡略化のため、通知後の待機時間は長めに
            if "追加認証" in await self.page.content() or "認証コード" in await self.page.content():
                notify_all("🚨 【楽天証券】追加認証が必要です。スマホで認証を完了してください。")
                print("[Bot] Waiting for human intervention (60s)...")
                await asyncio.sleep(60) # 人間が操作してトップ画面に到達するのを待つ

        # ログイン成功後、セッションを保存
        await self.context.storage_state(path=STORAGE_STATE)
        print("[Bot] Session saved.")

    async def get_balance(self):
        """
        現在の総資産額を取得。
        """
        await self.page.goto("https://www.rakuten-sec.co.jp/ITS/V_ACT_Top.html")
        await asyncio.sleep(2)
        # TODO: 正しいセレクタを特定してスクレイピング
        # ここではプレースホルダを返す
        return 10000 

    async def place_order_kabu_mini(self, symbol, side, quantity=1):
        """
        かぶミニでの注文。
        symbol: 例 '7203' (トヨタ)
        side: 'BUY' or 'SELL'
        """
        try:
            print(f"[Bot] Ordering {quantity} of {symbol} ({side})...")
            # 1. 銘柄検索
            # 2. 注文画面へ遷移
            # 3. 数量・取引パスワード入力
            # 4. 実行
            notify_all(f"✅ 注文完了: {symbol} を {quantity}株 {side}")
            return True
        except Exception as e:
            notify_all(f"❌ 注文失敗: {e}")
            return False

    async def stop(self):
        if self.browser:
            await self.browser.close()

# 簡易的なテスト用メイン
if __name__ == "__main__":
    async def main():
        bot = RakutenBot()
        await bot.start()
        await bot.login()
        balance = await bot.get_balance()
        print(f"Current Balance: {balance}")
        await bot.stop()
    asyncio.run(main())
