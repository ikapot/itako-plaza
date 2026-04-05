import asyncio
from playwright.async_api import async_playwright

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.rakuten-sec.co.jp/", timeout=30000)
        await page.wait_for_load_state("networkidle")
        
        # ログインページへ
        link = page.locator("a", has_text="ログイン").first
        await link.click()
        await page.wait_for_load_state("networkidle")
        
        print("URL:", page.url)
        
        # テキスト入力欄を全部リストアップ
        inputs = await page.query_selector_all("input")
        for i, el in enumerate(inputs):
            type_ = await el.get_attribute("type") or "text"
            name_ = await el.get_attribute("name") or ""
            id_   = await el.get_attribute("id") or ""
            print(f"  input[{i}] type={type_} name={name_} id={id_}")
        
        await page.screenshot(path="debug_login.png")
        print("スクリーンショット保存: debug_login.png")
        await browser.close()

asyncio.run(debug())
