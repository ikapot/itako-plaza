import requests
import time
from datetime import datetime

def check_time():
    print("--- Time Drift Check ---")
    url = "https://exchange.rakuten-wallet.co.jp/api/v1/cfd/symbol"
    
    start = time.time()
    resp = requests.head(url)
    end = time.time()
    
    server_date_str = resp.headers.get("Date")
    # Server date is like "Mon, 13 Apr 2026 22:15:00 GMT"
    if server_date_str:
        server_time = datetime.strptime(server_date_str, "%a, %d %b %Y %H:%M:%S %Z")
        server_ts = server_time.timestamp()
        
        local_ts = (start + end) / 2
        drift = server_ts - local_ts
        
        print(f"Server Time (UTC): {server_date_str}")
        print(f"Local Time (UTC):  {datetime.fromtimestamp(local_ts).strftime('%a, %d %b %Y %H:%M:%S')} GMT")
        print(f"Drift: {drift:.3f} seconds")
        
        if abs(drift) > 5.0:
            print("⚠️ WARNING: Significant time drift detected!")
            print(f"Adjusted Nonce should be: int((time.time() + {drift:.3f}) * 1000)")
    else:
        print("Failed to get server date.")

if __name__ == "__main__":
    check_time()
