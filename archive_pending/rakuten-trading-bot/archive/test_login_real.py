import asyncio
from playwright.async_api import async_playwright
import os
from dotenv import load_dotenv

load_dotenv()

RAKUTEN_ID = os.getenv("RAKUTEN_ID")
RAKUTEN_PW = os.getenv("RAKUTEN_PW")

async def test_real_login():
    print("=" * 50)
    print("  楽天証券 ログイン リハーサル (最終修正版)")
    print("=" * 50)
    print(f"  ID: {RAKUTEN_ID[:4]}****")
    print()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        page = await context.new_page()

        try:
            # 1. ログインページへ直接移動
            print("[1/5] ログインページへ移動...")
            await page.goto(
                "https://www.rakuten-sec.co.jp/ITS/V_ACT_Login.html",
                wait_until="load",
                timeout=30000
            )
            await asyncio.sleep(3)
            print(f"      URL: {page.url}")

            # 2. ID入力 - JavaScriptで直接値をセット
            print("[2/5] ログインIDを入力...")
            await page.evaluate(f"""
                var el = document.querySelector('#ratCustomerId');
                if (el) {{
                    el.value = '{RAKUTEN_ID}';
                    el.dispatchEvent(new Event('input', {{bubbles: true}}));
                    el.dispatchEvent(new Event('change', {{bubbles: true}}));
                }}
            """)
            await asyncio.sleep(0.5)
            
            # 実際にクリックして追加入力
            await page.click("#ratCustomerId")
            await page.keyboard.press("Control+a")
            await page.keyboard.type(RAKUTEN_ID, delay=50)
            
            val = await page.eval_on_selector("#ratCustomerId", "el => el.value")
            print(f"      入力値: {val[:4]}**** ({'✅ OK' if val else '❌ NG'})")

            # 3. PW入力
            print("[3/5] パスワードを入力...")
            pw_sel = "input[name='passwd']"
            # name属性でも試す
            pw_els = await page.query_selector_all("input[type='password']")
            if pw_els:
                await pw_els[0].click()
                await page.keyboard.press("Control+a")
                await page.keyboard.type(RAKUTEN_PW, delay=50)
                pw_val = await pw_els[0].input_value()
                print(f"      入力確認: {'✅ OK' if pw_val else '❌ NG'}")
            
            await page.screenshot(path="before_submit.png")
            print("      📸 before_submit.png 保存")

            # 4. 「ID・パスワードでログインする」ボタンをクリック
            print("[4/5] ログインボタンをクリック...")
            # テキストで探す
            btn = page.get_by_text("ID・パスワードでログインする")
            if await btn.count() > 0:
                await btn.first.click()
                print("      ✅ ボタンをクリックしました")
            else:
                # submitボタンを探す
                await page.locator("input[type='submit']").first.click()
                print("      ✅ submitボタンをクリックしました")
            
            await page.wait_for_load_state("domcontentloaded", timeout=20000)
            await asyncio.sleep(3)
            
            await page.screenshot(path="after_submit.png")
            print("      📸 after_submit.png 保存")
            print(f"      遷移先URL: {page.url}")

            # 5. 結果判定
            print("[5/5] 結果確認...")
            body = await page.inner_text("body")
            
            if any(k in body for k in ["確認番号", "ワンタイムパスワード", "二要素認証", "認証コード", "SMS"]):
                print("\n📱 2FA が必要です → Discord通知で対応できます ✅")
            elif any(k in body for k in ["ログアウト", "入出金", "残高", "預り金"]):
                print("\n🎉 ログイン成功！")
            elif any(k in body for k in ["エラー", "正しくない", "失敗", "ご確認"]):
                print("\n⚠️  認証エラー（ID/PW確認してください）")
            else:
                print("\n🔍 状況不明 → after_submit.png を確認")

        except Exception as e:
            print(f"\n❌ {type(e).__name__}: {e}")
            try:
                await page.screenshot(path="error_detail.png")
            except:
                pass
        finally:
            await browser.close()
    
    print("=" * 50)

asyncio.run(test_real_login())
