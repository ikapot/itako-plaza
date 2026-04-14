import asyncio
import logging
import datetime
from lib.rakuten_api import RakutenWalletClient
from lib.rakuten_ws import RakutenWebSocketClient
from lib.strategy import LtcStrategy
from lib.gist_sync import GistSync

logger = logging.getLogger("ZenGrid")

class ZenGridEngine:
    """
    Zen-Grid Engine V2:
    - 策略（Strategy）と執行（Execution）を分離
    - 多角的テクニカル判断に基づくエントリー
    - 動的トレイリングストップによる利益最大化
    """
    def __init__(self, rest_client: RakutenWalletClient, ws_client: RakutenWebSocketClient, symbol_id: int = 10):
        self.rest = rest_client
        self.ws = ws_client
        self.symbol_id = symbol_id
        
        # 判断エンジン (AI/Quants)
        self.strategy = LtcStrategy()
        
        # 状態管理
        self.is_running = False
        self.trade_amount = 0.1       # LTC 固定ロット

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
        while self.is_running:
            await self._check_time_and_manage_fees()
            await asyncio.sleep(60)

            if is_new_candle:
                self.strategy.calculate_indicators()
                # 1分おきの生存報告 (Heartbeat) & Gist 同期
                last_p = self.strategy.df.iloc[-1]['close']
                logger.info(f"Heartbeat | LTC: {last_p:.1f} | Indicators Updated")
                self._save_strategy_state()
        except Exception as e:
            logger.error(f"Error in ticker update flow: {e}")

    def _save_strategy_state(self):
        """最新の指標データをダッシュボード用に Gist へ保存"""
        if self.strategy.df.empty: return
        
        last = self.strategy.df.iloc[-1]
        state = {
            "timestamp": datetime.datetime.now().isoformat(),
            "price": float(last['close']),
            "EMA_20": float(last.get('EMA_20', 0)),
            "RSI_14": float(last.get('RSI_14', 0)),
            "ATR_22": float(last.get('ATR_22', 0)),
            "Z_score": float(last.get('Z_score', 0)),
            "signal": self.strategy.get_entry_signal() or "WAIT"
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
            # 最低限のデータ（指標計算用）が溜まるまで待機
            if len(self.strategy.df) < 30:
                await asyncio.sleep(10)
                continue
                
            # Strategy からシグナルを取得
            signal = self.strategy.get_entry_signal()
            
            if signal:
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
                    logger.info(f"APPROVED. Executing {signal}...")
                    try:
                        res = self.rest.place_cfd_order(self.symbol_id, signal, self.trade_amount, "MARKET", "NEW")
                        logger.info(f"Success: {res}")
                    except Exception as e:
                        logger.error(f"Error: {e}")
                
                clear_signal()
                await asyncio.sleep(300) # 次の判定まで5分待機
                
            await asyncio.sleep(5)
