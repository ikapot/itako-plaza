import asyncio
import logging
import datetime
import json
import re
from typing import List, Dict, Optional, Deque
from collections import deque
import statistics
from lib.rakuten_api import RakutenWalletClient
from lib.rakuten_ws import RakutenWebSocketClient
# from .browser_facade import get_browser_executor  # APIへ移行するため廃止

logger = logging.getLogger("ZenGrid")

class ZenGridEngine:
    """
    Zen-Grid Strategy Engine:
    - Daily micro-profits (コツコツ)
    - Zero Management Fee (06:50 force close)
    - Dynamic Grid based on Spread
    """
    def __init__(self, rest_client: RakutenWalletClient, ws_client: RakutenWebSocketClient, symbol_id: int = 10):
        self.rest = rest_client
        self.ws = ws_client
        self.symbol_id = symbol_id
        self.last_price = 0.0
        self.last_spread = 0.0
        
        # テクニカル分析用バッファ (30分間/1分足相当の保存を想定)
        self.price_history = deque(maxlen=30)
        
        # 戦略パラメータ (NotebookLM リサーチに基づく)
        self.target_profit_jpy = 50       # 1回あたりの目標純利益
        self.min_grid_width_factor = 3.0  # スプレッドの何倍をグリッド幅にするか
        self.trade_amount = 0.1           # LTC (最小単位 0.1)

    async def start(self):
        """エンジンを起動する"""
        logger.info("🕉️ Zen-Grid Engine starting...")
        self.is_running = True
        
        # WebSocket の価格受信イベントを登録
        self.ws.on_ticker = self._on_ticker_update
        
        # WebSocket 接続をバックグラウンドで開始
        asyncio.create_task(self.ws.connect())
        
        # メインループ (管理料回避監視 ＆ ハートビート)
        while self.is_running:
            # 1分おきに心拍（Heartbeat）として価格をログに刻む
            if self.last_price > 0:
                logger.info(f"💓 Heartbeat | LTC Price: {self.last_price} | Spread: {self.last_spread:.1f}")
            
            await self._check_time_and_manage_fees()
            await asyncio.sleep(60) # 1分おきにチェック

    def _on_ticker_update(self, data: dict):
        """リアルタイム価格更新時の処理"""
        if not data: return
        self.last_price = float(data.get("bid", 0))
        # スプレッドの計算
        ask = float(data.get("ask", 0))
        bid = float(data.get("bid", 0))
        self.last_spread = ask - bid
        
        # 履歴の更新 (5秒おきに1つ保存するように間引く)
        if not hasattr(self, '_last_history_update') or (datetime.datetime.now() - self._last_history_update).seconds >= 5:
            self.price_history.append(self.last_price)
            self._last_history_update = datetime.datetime.now()
        
        logger.debug(f"💹 Price: {self.last_price} | Spread: {self.last_spread}")

    async def _check_time_and_manage_fees(self):
        """建玉管理料回避のための強制決済チェック (JST 06:50)"""
        now = datetime.datetime.now()
        # Windowsや環境によらず JST (UTC+9) に合わせる工夫が必要な場合はここで調整
        # ここでは単純に 06:50 ~ 07:00 の間を強制決済期間とする
        if now.hour == 6 and 50 <= now.minute <= 59:
            logger.warning("🕒 Fee Management Alert: Japanese market reset coming soon. Closing all positions...")
            await self._force_close_all()

    async def _force_close_all(self):
        """全ポジションの強制決済 (API経由)"""
        try:
            logger.info("🛡️ 強制決済フェーズ: APIで保有ポジションを確認します...")
            positions = self.rest.get_cfd_positions()
            
            if not positions:
                logger.info("✅ 保有ポジションは現在ありません。")
                return

            for pos in positions:
                # LTC のポジションのみを対象とする
                if int(pos.get("symbolId")) == self.symbol_id:
                    side = pos.get("side") # BUY or SELL
                    close_side = "SELL" if side == "BUY" else "BUY"
                    amount = float(pos.get("amount", 0))
                    
                    logger.warning(f"⚠️ ポジション決済開始: {side} {amount} LTC")
                    res = self.rest.place_cfd_order(
                        symbol_id=self.symbol_id,
                        side=close_side,
                        amount=amount,
                        order_type="MARKET",
                        behavior="CLOSE"
                    )
                    logger.info(f"✨ 決済完了: {res}")
            
            logger.info("✨ 全LTCポジションの強制決済シーケンスを完了しました。")
        except Exception as e:
            logger.error(f"❌ Force close error (API): {e}")

    async def execute_grid_logic(self):
        """グリッドトレードの実行ロジック"""
        logger.info("📡 Monitoring signals for Grid entry...")
        while self.is_running:
            if len(self.price_history) < 20:
                await asyncio.sleep(10)
                continue
                
            # Mean Reversion 判定 (Z-score)
            avg = statistics.mean(self.price_history)
            stdev = statistics.stdev(self.price_history)
            if stdev == 0: 
                await asyncio.sleep(10)
                continue
                
            z_score = (self.last_price - avg) / stdev
            
            # -2.0 sigma 以下（売られすぎ）なら 買グリッド 開始
            if z_score < -2.0:
                logger.info(f"📉 Mean Reversion Signal: Price is low (Z={z_score:.2f}). Requesting Approval...")
                from lib.trade_signal import create_signal, get_signal_status, clear_signal
                from lib.agent_notify import send_notification
                
                # シグナルを保留状態で作成
                create_signal("BUY", self.last_price, z_score)
                # iPhone に通知 (asyncio.create_task で非同期送信)
                asyncio.create_task(send_notification(f"📉 LTCシグナル(BUY)検知: Price={self.last_price}, Z={z_score:.2f}. 承認しますか？"))
                
                # 承認待ちループ (最大10分)
                approved = False
                for _ in range(60): # 10秒 x 60 = 600秒 (10分)
                    sig = get_signal_status()
                    if sig and sig.get("status") == "approved":
                        approved = True
                        break
                    elif sig and sig.get("status") == "rejected":
                        logger.info("❌ Trade rejected by Master.")
                        break
                    await asyncio.sleep(10)
                
                if approved:
                    logger.info("✅ Trade APPROVED. Opening Buy Grid...")
                    await self._open_grid("BUY")
                else:
                    logger.info("⌛ Trade TIMEOUT or REJECTED. Signal cleared.")
                
                clear_signal()
                await asyncio.sleep(300) # 次の判定まで5分待機
                
            # +2.0 sigma 以上（買われすぎ）なら 売グリッド 開始
            elif z_score > 2.0:
                logger.info(f"📈 Mean Reversion Signal: Price is high (Z={z_score:.2f}). Requesting Approval...")
                from lib.trade_signal import create_signal, get_signal_status, clear_signal
                from lib.agent_notify import send_notification
                
                create_signal("SELL", self.last_price, z_score)
                asyncio.create_task(send_notification(f"📈 LTCシグナル(SELL)検知: Price={self.last_price}, Z={z_score:.2f}. 承認しますか？"))
                
                approved = False
                for _ in range(60):
                    sig = get_signal_status()
                    if sig and sig.get("status") == "approved":
                        approved = True
                        break
                    elif sig and sig.get("status") == "rejected":
                        logger.info("❌ Trade rejected by Master.")
                        break
                    await asyncio.sleep(10)

                if approved:
                    logger.info("✅ Trade APPROVED. Opening Sell Grid...")
                    await self._open_grid("SELL")
                else:
                    logger.info("⌛ Trade TIMEOUT or REJECTED. Signal cleared.")
                
                clear_signal()
                await asyncio.sleep(300)
                
            await asyncio.sleep(10)

    async def _open_grid(self, side: str):
        """指定された方向にグリッド注文を複数展開する"""
        try:
            # スプレッドの3倍をグリッド間隔にする
            grid_interval = max(self.last_spread * self.min_grid_width_factor, 15000)
            
            for i in range(1, 4): # 3つのグリッドを配置
                price_offset = grid_interval * i
                target_price = self.last_price - price_offset if side == "BUY" else self.last_price + price_offset
                
                logger.info(f"📝 Placing Grid {i}: {side} at {target_price} (API Execution)")
                # REST API を使用して実注文を出す (NEW注文)
                try:
                    res = self.rest.place_cfd_order(
                        symbol_id=self.symbol_id,
                        side=side,
                        amount=self.trade_amount,
                        order_type="MARKET",
                        behavior="NEW"
                    )
                    logger.info(f"✅ Grid {i} 執行成功: {res}")
                except Exception as e:
                    logger.error(f"❌ Grid {i} 執行失敗: {e}")
                
            logger.info(f"✅ Grid of 3 {side} orders sequence completed.")
        except Exception as e:
            logger.error(f"❌ Grid opening error: {e}")
