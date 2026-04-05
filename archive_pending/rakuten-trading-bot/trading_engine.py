import time
import logging
from rakuten_wallet_client import RakutenWalletClient

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TradingEngine:
    def __init__(self, dry_run=False, symbol_id=10, rsi_period=14, on_announce=None, db=None):
        self.client = RakutenWalletClient()
        self.dry_run = dry_run
        self.symbol_id = symbol_id # 10 = LTC/JPY
        self.rsi_period = rsi_period
        self.prices = []
        self.position = None # Enum: 'LONG', 'SHORT', or None
        self.entry_price = 0
        self.on_announce = on_announce # Discord への実況用コールバック
        self.db = db # Firestore Client
        
        # リスク管理設定 (LTC/0.1単位向け)
        self.stop_loss_value = 200  # 固定額(円)での損切り
        self.take_profit_ratio = 0.05 # 利確は比率(5%)
        self.amount = 0.1 # 最小注文単位

        # 稼働制限（ガードレール）
        self.is_trading_enabled = True
        self.max_daily_loss = 1000 # 2,000円から1,000円へ縮小
        self.max_daily_trades = 10
        self.daily_losses = 0
        self.daily_trades_count = 0
        self.last_reset_date = ""

        if self.db:
            self._load_state_from_firestore()

    def _load_state_from_firestore(self):
        """Firestore から状態を復元"""
        try:
            doc_ref = self.db.collection("trading_status").document("current")
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                self.prices = data.get("prices", [])
                self.position = data.get("current_position")
                self.entry_price = data.get("entry_price", 0)
                self.daily_losses = data.get("daily_losses", 0)
                self.daily_trades_count = data.get("daily_trades_count", 0)
                self.is_trading_enabled = data.get("is_trading_enabled", True)
                self.last_reset_date = data.get("last_reset_date", "")
                logger.info("✅ Firestore から状態を復元しました。")
            else:
                logger.info("ℹ️ Firestore にデータがありません。新規作成します。")
                self._save_state_to_firestore()
        except Exception as e:
            logger.error(f"❌ Firestore 読み込みエラー: {e}")

    def _save_state_to_firestore(self):
        """Firestore へ現在の状態を保存"""
        if not self.db: return
        try:
            doc_ref = self.db.collection("trading_status").document("current")
            doc_ref.set({
                "prices": self.prices[-50:], # 直近50件程度に絞って保存（RSI計算用）
                "current_position": self.position,
                "entry_price": self.entry_price,
                "daily_losses": self.daily_losses,
                "daily_trades_count": self.daily_trades_count,
                "is_trading_enabled": self.is_trading_enabled,
                "last_reset_date": self.last_reset_date,
                "updated_at": time.time()
            })
        except Exception as e:
            logger.error(f"❌ Firestore 保存エラー: {e}")


    def calculate_rsi(self):
        """RSI(相対力指数)の計算"""
        if len(self.prices) < self.rsi_period + 1:
            return None
        
        deltas = [self.prices[i+1] - self.prices[i] for i in range(len(self.prices)-1)]
        gains = [d if d > 0 else 0 for d in deltas[-(self.rsi_period):]]
        losses = [-d if d < 0 else 0 for d in deltas[-(self.rsi_period):]]
        
        avg_gain = sum(gains) / self.rsi_period
        avg_loss = sum(losses) / self.rsi_period
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def _check_and_reset_daily(self):
        """日付が変わっていたら日次統計をリセット(JSTを考慮)"""
        import datetime
        # 簡易的に UTC+9 (JST) で計算
        now_jst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
        today_str = now_jst.strftime("%Y-%m-%d")
        
        if self.last_reset_date != today_str:
            logger.info(f"📅 日付が変わりました ({today_str})。日次統計をリセットします。")
            self.daily_losses = 0
            self.daily_trades_count = 0
            self.last_reset_date = today_str
            self.is_trading_enabled = True # 制限がかかっていた場合もリセット
            self._save_state_to_firestore()

    def update_price(self):
        """最新価格の取得と保持"""
        ticker = self.client.get_ticker(self.symbol_id)
        if 'last' in ticker:
            last_price = float(ticker['last'])
            self.prices.append(last_price)
            if len(self.prices) > 100:
                self.prices.pop(0)
            
            # 定期的に保存（10回に1回程度に間引いても良いが、1分1回なら毎回でもOK）
            self._save_state_to_firestore()
            return last_price
        return None

    def execute_trade(self, side, amount=None):
        """売買の実行"""
        if amount is None: amount = self.amount

        if not self.is_trading_enabled:
            logger.warning("🚫 取引が無効化されているため、実行をスキップします。")
            return {"success": False, "message": "Trading disabled"}

        if self.daily_trades_count >= self.max_daily_trades:
            logger.warning(f"🚨 本日の最大取引回数({self.max_daily_trades})に達しました。")
            self.is_trading_enabled = False
            if self.on_announce:
                self.on_announce("LIMIT_EXCEEDED", {"reason": "trades_count", "value": self.daily_trades_count})
            return {"success": False, "message": "Trades limit reached"}

        logger.info(f"【トレード実行】 {side} {amount} units (Dry Run: {self.dry_run})")
        
        if self.on_announce:
            self.on_announce("EXEC_TRADE", {"side": side, "amount": amount, "price": self.prices[-1] if self.prices else 0})

        self.daily_trades_count += 1
        self._save_state_to_firestore()

        if self.dry_run:
            return {"success": True, "message": "Dry Run Mode"}
        
        res = self.client.place_order(self.symbol_id, side, amount)
        return res

    def tick(self):
        """1ステップの実行ロジック"""
        self._check_and_reset_daily()
        
        if not self.is_trading_enabled:
            return

        current_price = self.update_price()
        if not current_price:
            logger.error("価格取得に失敗しました。")
            return

        rsi = self.calculate_rsi()
        logger.info(f"現在価格: {current_price} | RSI: {rsi if rsi else '計算中...'}")

        # リスク管理: 損切り・利確 (既にポジションがある場合)
        if self.position == 'LONG':
            pnl = (current_price - self.entry_price) * self.amount
            
            # 固定額(200円)での損切り判定
            if pnl <= -self.stop_loss_value:
                logger.warning(f"🚨 損切り発動（LONG）: {current_price} (損失: {pnl:.1f}円)")
                self.execute_trade('SELL')
                self.position = None
                self.daily_losses += pnl
            # 利確判定 (5%等)
            elif current_price >= self.entry_price * (1 + self.take_profit_ratio):
                logger.info(f"💰 利確発動（LONG）: {current_price} (利益: {pnl:.1f}円)")
                self.execute_trade('SELL')
                self.position = None
                self.daily_losses += pnl

        # 損失制限のチェック
        if self.daily_losses <= -self.max_daily_loss:
            logger.error(f"🚨 本日の最大損失({self.max_daily_loss}円)に達しました。")
            self.is_trading_enabled = False
            if self.on_announce:
                self.on_announce("LIMIT_EXCEEDED", {"reason": "daily_loss", "value": self.daily_losses})
            self._save_state_to_firestore()
            return
        
        if rsi:
            if rsi < 30 and self.position is None:
                logger.info(f"📈 RSIが30を下回りました（買いシグナル）: {rsi}")
                if self.on_announce:
                    self.on_announce("SIGNAL_BUY", {"rsi": rsi, "price": current_price})
                res = self.execute_trade('BUY')
                if res.get('success', False) or self.dry_run:
                    self.position = 'LONG'
                    self.entry_price = current_price
            
            elif rsi > 70 and self.position == 'LONG':
                logger.info(f"📉 RSIが70を上回りました（売りシグナル）: {rsi}")
                if self.on_announce:
                    self.on_announce("SIGNAL_SELL", {"rsi": rsi, "price": current_price})
                res = self.execute_trade('SELL')
                if res.get('success', False) or self.dry_run:
                    self.position = None

    def run(self, interval=60):
        """メインループ（人間らしい「ゆらぎ」を追加）"""
        import random
        logger.info(f"自動売買エンジン始動 (Symbol: {self.symbol_id}, Dry Run: {self.dry_run}, Jitter: Enabled)")
        while True:
            try:
                self.tick()
            except Exception as e:
                logger.error(f"エラー発生: {e}")
            
            # 指定された間隔に5%程度のランダムな「ゆらぎ」を加える (例: 60秒なら 57〜63秒)
            # これにより、楽天側の機械的な巡回検知（等間隔アクセス）を回避します。
            jitter = random.uniform(-interval * 0.05, interval * 0.05)
            wait_time = max(10, interval + jitter) # 最低10秒のインターバルを確保
            time.sleep(wait_time)

if __name__ == "__main__":
    # テスト実行
    engine = TradingEngine(dry_run=True)
    engine.run(interval=10) # テスト用に短い間隔で回す
