import asyncio
import logging
import datetime
import os
import json
import google.generativeai as genai
from lib.rakuten_api import RakutenWalletClient
from lib.rakuten_ws import RakutenWebSocketClient
from lib.strategy import LtcStrategy
from lib.gist_sync import GistSync

logger = logging.getLogger("ZenGrid")

class ZenGridEngine:
    """
    Zen-Grid Engine V2.5:
    - 策略（Strategy）と執行（Execution）を分離
    - 多角的テクニカル判断に基づくエントリー
    - Gemini AI による環境認識（潮目判定）を統合
    - 状態管理は Gist へ同期
    """
    def __init__(self, rest_client: RakutenWalletClient, ws_client: RakutenWebSocketClient, symbol_id: int = 10):
        self.rest = rest_client
        self.ws = ws_client
        self.symbol_id = symbol_id
        
        # 判断エンジン (AI/Quants)
        self.strategy = LtcStrategy()
        
        # AI 配置
        self.gemini_key = os.environ.get("VITE_GEMINI_API_KEY") 
        if self.gemini_key == "PROXY_MODE": self.gemini_key = os.environ.get("GEMINI_API_KEY")
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

        # 状態管理
        self.is_running = False
        self.trade_amount = 0.1       # LTC 固定ロット
        self.ai_bias = "NEUTRAL"
        self.ai_reason = "No AI Configured"

        # Gist 連携 (ダッシュボード表示用)
        pat = os.environ.get("GITHUB_PAT_GIST")
        gist_id = os.environ.get("GIST_ID")
        self.gist = GistSync(pat, gist_id, "strategy_state.json")

    async def start(self):
        """エンジンを起動する"""
        logger.info("Zen-Grid Engine V2 starting...")
        self.is_running = True
        
        # WebSocket コールバック設定
        self.ws.on_ticker = self._on_ticker_update
        
        # WebSocket 接続（バックグラウンド）
        asyncio.create_task(self.ws.connect())
        
        # メインループ: 管理料回避 ＆ ポジション監視
        try:
            while self.is_running:
                await self._check_time_and_manage_fees()
                await asyncio.sleep(60)

                # キャンドル更新チェック (簡略化)
                self.strategy.calculate_indicators()
                # 1分おきの生存報告 (Heartbeat) & Gist 同期
                last_p = self.strategy.df.iloc[-1]['close']
                logger.info(f"Heartbeat | LTC: {last_p:.1f} | Indicators Updated")
                await self._save_strategy_state()
        except Exception as e:
            logger.error(f"Error in engine main loop: {e}")

    async def get_ai_tide_sense(self):
        """Gemini による市場の「潮目」解析"""
        if not self.model or self.strategy.df.empty:
            return
            
        try:
            # 最新の指標を文字列化
            last_stats = self.strategy.df.tail(5).to_dict(orient='records')
            prompt = f"Analyze LTC/JPY market (5m data): {json.dumps(last_stats)}. Provide 1-word bias (BULLISH, BEARISH, NEUTRAL) and a very short 1-line reason in Japanese."
            
            # 非同期で実行
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            text = response.text.strip().split("\n")
            self.ai_bias = text[0].upper()
            self.ai_reason = text[1] if len(text) > 1 else "Continuum"
            logger.info(f"🧠 AI Tide Sense: {self.ai_bias} | {self.ai_reason}")
        except Exception as e:
            logger.warning(f"AI Analysis failed: {e}")

    async def _save_strategy_state(self):
        """最新の指標データをダッシュボード用に Gist へ保存 (Hybrid 構造)"""
        if self.strategy.df.empty: return
        
        last = self.strategy.df.iloc[-1]
        
        # 資産情報の取得 (CFD 証拠金残高)
        try:
            equity_res = await self.rest.get_margin_info()
            balance = float(equity_res.get("equity", 0))
        except:
            balance = 0.0

        # 指標計算
        ema_val = last.get('EMA_20', 0)
        ema_trend = "UP" if last['close'] > ema_val else "DOWN"
        rsi_val = float(last.get('RSI_14', 0))

        state = {
            "timestamp": datetime.datetime.now().isoformat(),
            # --- フラット項目 (Step 1 対応) ---
            "bestBid": float(last['close']),
            "bestAsk": float(last['close']),
            "rsi": rsi_val,
            "ema_trend": ema_trend,
            
            # --- 入れ子項目 (アトリエ UI 継続用) ---
            "price": float(last['close']),
            "status": "ACTIVE" if self.is_running else "IDLE",
            "indicators": {
                "ATR": float(last.get('ATR_22', 0)),
                "EMA_direction": ema_trend,
                "RSI": rsi_val,
                "Z_score": float(last.get('Z_score', 0))
            },
            "capital": {
                "balance": balance,
                "gain_loss_percent": ((balance - 2000) / 2000) * 100 if balance > 0 else 0
            },
            "history": getattr(self, "history", [])[:5],
            "ai_bias": getattr(self, "ai_bias", "NEUTRAL"),
            "ai_reason": getattr(self, "ai_reason", "No AI Configured")
        }
        self.gist.save(state)

    async def _check_time_and_manage_fees(self):
        """JST 06:50 の管理料回避決済"""
        now = datetime.datetime.now()
        if now.hour == 6 and 50 <= now.minute <= 59:
            logger.warning("Fee Management window. Closing all LTC positions...")
            await self._force_close_all()

    async def _force_close_all(self):
        """全 LTC ポジションを成行決済"""
        try:
            positions = self.rest.get_cfd_positions(self.symbol_id)
            if not positions: return

            for pos in positions:
                side = pos.get("side")
                close_side = "SELL" if side == "BUY" else "BUY"
                amt = float(pos.get("amount", 0))
                
                logger.warning(f"Closing position: {side} {amt}")
                res = self.rest.place_cfd_order(self.symbol_id, close_side, amt, "MARKET", "CLOSE")
                logger.info(f"Closed: {res}")
        except Exception as e:
            logger.error(f"Force close failed: {e}")

    async def execute_grid_logic(self):
        """メインの参入ロジックループ"""
        logger.info("Strategy monitoring active...")
        while self.is_running:
            # 1. AI 判定の更新 (1時間おき想定だが、ここではループごと。実際は負荷を考慮)
            # 判定ロジックが負荷になるため、一定時間おきにするのが定石
            if datetime.datetime.now().minute % 15 == 0: 
                await self.get_ai_tide_sense()

            # 最低限のデータ（指標計算用）が溜まるまで待機
            if len(self.strategy.df) < 30:
                await asyncio.sleep(10)
                continue
                
            # Strategy からシグナルを取得
            signal = self.strategy.get_entry_signal()
            
            if signal:
                # --- AI フィルタリング ---
                if signal == "BUY" and "BEARISH" in self.ai_bias:
                    logger.info("⏸ AI BEARISH signal. Skipping BUY.")
                    continue
                if signal == "SELL" and "BULLISH" in self.ai_bias:
                    logger.info("⏸ AI BULLISH signal. Skipping SELL.")
                    continue

                logger.info(f"Signal Detected: {signal}. Checking for approval...")
                # 承認フロー連携
                from lib.trade_signal import create_signal, get_signal_status, clear_signal
                from lib.agent_notify import send_notification
                
                price = self.strategy.df.iloc[-1]['close']
                z = self.strategy.df.iloc[-1].get('Z_score', 0)
                create_signal(signal, price, z)
                
                # iPhone 通知
                asyncio.create_task(send_notification(f"LTC/JPY {signal} Signal at {price:.1f} (Z={z:.1f}). Approve?"))
                
                # 承認待機 (10分)
                approved = False
                for _ in range(60): 
                    sig = get_signal_status()
                    if sig and sig.get("status") == "approved":
                        approved = True
                        break
                    elif sig and sig.get("status") == "rejected":
                        break
                    await asyncio.sleep(10)
                
                if approved:
                    try:
                        logger.info(f"APPROVED. Executing {signal}...")
                        res = await self.rest.place_cfd_order(self.symbol_id, signal, self.trade_amount, "MARKET", "NEW")
                        logger.info(f"Success: {res}")
                        # 履歴に追加
                        self.history.insert(0, {
                            "side": signal,
                            "price": float(price),
                            "timestamp": datetime.datetime.now().isoformat(),
                            "amount": self.trade_amount
                        })
                        await self._save_strategy_state()
                    except Exception as e:
                        logger.error(f"Execution Error: {e}")
                
                clear_signal()
                await asyncio.sleep(300) # 次の判定まで5分待機
                
            await asyncio.sleep(5)
