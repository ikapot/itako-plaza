import subprocess
import time
import sys
import os

def run_loop():
    print("🔄 Itako Plaza Quants Trader: Background Loop Started.")
    print("Interval: 600 seconds (10 minutes)")
    
    while True:
        try:
            print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] 🚀 Executing bot.py...")
            # .venv の python を使用
            python_exe = os.path.join(".venv", "Scripts", "python.exe")
            if not os.path.exists(python_exe):
                python_exe = "python" # fallback
                
            result = subprocess.run([python_exe, "-u", "advanced-trader/bot.py"], capture_output=True, text=True)
            
            print(result.stdout)
            if result.stderr:
                print("--- Errors ---")
                print(result.stderr)
                
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 😴 Sleeping for 10 minutes...")
            time.sleep(600)
        except KeyboardInterrupt:
            print("\n🛑 Loop stopped by user.")
            break
        except Exception as e:
            print(f"❌ Loop Error: {e}")
            time.sleep(60) # 早めにリトライ

if __name__ == "__main__":
    run_loop()
