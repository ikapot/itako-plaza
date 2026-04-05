import asyncio
from playwright.async_api import async_playwright
import os
from dotenv import load_dotenv

load_dotenv()

class RakutenClient:
    def __init__(self, headless=True):
        self.headless = headless
        self.login_url = "https://www.rakuten-sec.co.jp/"
        self.is_2fa_approved = asyncio.Event()

    async def login(self, user_id, password):
        """
        楽天証券へのログイン + 2FA検知
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = await context.new_page()

            try:
                # 1. トップページへ遷移
                print("[1/5] 楽天証券トップページへ移動...")
                await page.goto(self.login_url, timeout=30000)
                await page.wait_for_load_state("networkidle", timeout=15000)

                # 2. ログインリンクをクリック
                print("[2/5] ログインページへ移動...")
                login_link = page.locator('a:has-text("ログイン")').first
                await login_link.click()
                await page.wait_for_load_state("networkidle", timeout=15000)
                print(f"      現在のURL: {page.url}")

                # 3. IDとパスワードを入力
                print("[3/5] ID・パスワードを入力...")
                
                # IDフィールドへ入力（楽天証券の正しいセレクタ）
                await page.locator('[id="ratCustomerId"]').fill(user_id)
                await asyncio.sleep(0.5)
                
                # パスワードフィールドへ入力
                await page.locator('input[type="password"]').first.fill(password)
                await asyncio.sleep(0.5)
                
                print("      ✅ 入力完了")
                await page.screenshot(path="before_login.png")
                print("      📸 ログイン前スクリーンショット保存: before_login.png")

                # 4. ログインボタンをクリック
                print("[4/5] ログインボタンを押します...")
                login_btn = page.locator('button:has-text("ログイン"), input[type="submit"]').first
                await login_btn.click()
                await page.wait_for_load_state("networkidle", timeout=20000)
                
                await page.screenshot(path="after_login.png")
                print("      📸 ログイン後スクリーンショット保存: after_login.png")

                # 5. 2FA画面の検知
                print("[5/5] 二要素認証(2FA)の確認...")
                is_2fa = await self._check_2fa_needed(page)

                if is_2fa:
                    print("      ⚠️  2FA が必要です！ Discord に通知を送ります...")
                    return "2FA_REQUIRED", page
                
                # 6. ログイン成功の確認
                if await self._check_login_success(page):
                    print("\n✅ ログイン成功！")
                    return "SUCCESS", page
                else:
                    print(f"\n⚠️  ログイン結果が不明です。URL: {page.url}")
                    return "UNKNOWN", page

            except Exception as e:
                await page.screenshot(path="login_error.png")
                print(f"\n❌ エラー: {e}")
                return "ERROR", None
            finally:
                # ブラウザはすぐ閉じず、呼び出し元に結果を返す
                await asyncio.sleep(2)
                await browser.close()

    async def _check_2fa_needed(self, page):
        """2FA画面かどうかを判定"""
        indicators = [
            'text=確認番号',
            'text=ワンタイムパスワード',
            'text=二要素認証',
            'text=認証コード',
            'input[id*="otp"]',
        ]
        for sel in indicators:
            el = await page.query_selector(sel)
            if el:
                print(f"      → 2FA検知セレクタ: `{sel}`")
                return True
        return False

    async def _check_login_success(self, page):
        """ログイン成功を確認"""
        success_indicators = [
            'text=ログアウト',
            'text=お客様情報',
            '.header-member',
            'a:has-text("入出金")',
        ]
        for sel in success_indicators:
            el = await page.query_selector(sel)
            if el:
                return True
        return False
