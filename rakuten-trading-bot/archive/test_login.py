import asyncio
from playwright.async_api import async_playwright
import os
from dotenv import load_dotenv

load_dotenv()

RAKUTEN_ID = os.getenv("RAKUTEN_ID")
RAKUTEN_PW = os.getenv("RAKUTEN_PW")

async def test_login_simulation():
    print("=== 楽天証券ログイン・シミュレーション開始 ===")
    print("※ 安全のため、入力まで確認してログインボタンは押しません。")
    
    async with async_playwright() as p:
        # ブラウザを起動 (headless=True で画面を出さない)
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 1. 楽天証券のログインページへ移動
            print("\n[Step 1] ログインページを開いています...")
            await page.goto("https://www.rakuten-sec.co.jp/", timeout=30000)
            print(f"  → ページタイトル: {await page.title()}")

            # 2. ログインフォームを探す
            print("\n[Step 2] ログインフォームを探しています...")
            
            # ログインリンクやボタンを探す
            login_link = await page.query_selector('a:has-text("ログイン")')
            if login_link:
                print("  → ログインリンクを発見！クリックします...")
                await login_link.click()
                await page.wait_for_load_state("networkidle", timeout=15000)
                print(f"  → 遷移先タイトル: {await page.title()}")
            
            # 3. IDフィールドを探す
            print("\n[Step 3] IDと パスワードの入力欄を確認しています...")
            
            # 一般的な入力欄のセレクタを試す
            id_selectors = ['input[id*="login"]', 'input[id*="user"]', 'input[type="text"]', '#input-login-id']
            pw_selectors = ['input[type="password"]', 'input[id*="pass"]', '#input-login-pw']
            
            id_field = None
            for sel in id_selectors:
                id_field = await page.query_selector(sel)
                if id_field:
                    print(f"  → ID入力欄を発見: `{sel}`")
                    break
            
            pw_field = None
            for sel in pw_selectors:
                pw_field = await page.query_selector(sel)
                if pw_field:
                    print(f"  → パスワード入力欄を発見: `{sel}`")
                    break
            
            if id_field and pw_field:
                print("\n✅ 入力欄の確認完了！IDとパスワードを入力できる状態です。")
                print("   （実際の入力・送信は本番テスト時に行います）")
            else:
                print("\n⚠️  入力欄のセレクタを要調査。スクリーンショットを撮ります...")
                await page.screenshot(path="login_debug.png")
                print("   → login_debug.png に保存しました。")
            
            # 4. スクリーンショットで現在の画面を確認
            await page.screenshot(path="login_page.png")
            print("\n📸 現在の画面を login_page.png に保存しました。")

        except Exception as e:
            print(f"\n❌ エラー: {e}")
            await page.screenshot(path="login_error.png")
        finally:
            await browser.close()
    
    print("\n=== テスト完了 ===")

asyncio.run(test_login_simulation())
