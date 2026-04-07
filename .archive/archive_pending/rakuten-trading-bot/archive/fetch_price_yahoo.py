import requests
from bs4 import BeautifulSoup

def get_yahoo_finance_price(ticker):
    url = f"https://finance.yahoo.com/quote/{ticker}.T"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return f"Error: Status code {response.status_code}"
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Yahoo Finance usually has price in "fin-streamer" with data-field="regularMarketPrice"
        streamer = soup.find("fin-streamer", {"data-field": "regularMarketPrice"})
        if streamer:
            return float(streamer.get("data-value") or streamer.text.replace(",", ""))
            
        # Fallback for some versions
        span = soup.find("span", {"data-testid": "qsp-price"})
        if span:
            return float(span.text.replace(",", ""))
            
        return "Error: Price element not found"
            
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    ticker = "7203"
    print(f"🔍 {ticker} (トヨタ) の価格を Yahoo Finance から取得中...")
    price = get_yahoo_finance_price(ticker)
    if isinstance(price, float):
        print(f"🎉 現在の価格: {price} 円")
    else:
        print(f"❌ 取得失敗: {price}")
