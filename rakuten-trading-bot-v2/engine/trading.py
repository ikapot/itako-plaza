import logging
import time
import os
from typing import Dict, List, Optional, Any
from engine.risk import SafetyGuard
from lib.rakuten_api import RakutenWalletClient
from lib.firestore import TradingState
from lib.discord_util import send_discord_notification, request_trade_approval
from engine.news import fetch_crypto_news
from engine.analysis import analyze_sentiment
from engine.safety import check_safety

logger = logging.getLogger(__name__)

class NewsTradingEngine:
    """
    ニュースベースの自動売買エンジン
    """
    def __init__(self, symbol_id: int = 7):
        self.client = RakutenWalletClient()
        self.state = TradingState()
        self.symbol_id = symbol_id
        
        # 環境変数から設定を読み込み
        self.dry_run = os.getenv("DRY_RUN", "True").lower() == "true"
        self.amount = float(os.getenv("TRADE_AMOUNT", "0.0001")) # デフォルト 0.0001 BTC
        
        # リスク管理レイヤーの導入
        self.guard = SafetyGuard(
            max_position=float(os.getenv("MAX_POSITION", "0.001")),
            error_threshold=int(os.getenv("ERROR_THRESHOLD", "3"))
        )
        
        logger.info(f"⚙️ Engine Initialized: Symbol={symbol_id}, DryRun={self.dry_run}, Amount={self.amount}")

    def run_cycle(self) -> Dict[str, Any]:
        """1回の情報収集〜解析〜通知サイクルを実行"""
        logger.info("🚀 潮目感知サイクルを開始...")
        
        # 0. 既存ポジションの損切り・利確チェック (自律ガードレール)
        exit_res = self.check_and_execute_pnl_exit()
        if exit_res.get("executed"):
            return {"status": "pnl_exit_executed", "result": exit_res}

        # 1. ニュース収集 (直近30分)
        news_items = fetch_crypto_news(interval_seconds=1800)
        if not news_items:
            logger.info("💤 新規ニュースはありません。")
            return {"status": "no_news"}

        return self.process_news(news_items)

    def run_mock_cycle(self, mock_news: List[Dict[str, str]]) -> Dict[str, Any]:
        """検証用のニュースを注入してプロセスを開始"""
        logger.info("🧪 モックニュースによる検証サイクルを実行...")
        return self.process_news(mock_news)

    def process_news(self, news_items: List[Dict[str, str]]) -> Dict[str, Any]:
        """ニュースの解析から承認依頼送信までのメインロジック"""
        # 2. AI 解析
        analysis = analyze_sentiment(news_items)
        decision = analysis.get('decision', 'HOLD')
        
        if decision == 'HOLD':
            logger.info(f"⏸️ 判断は HOLD です。理由: {analysis.get('reason')}")
            return {"status": "hold", "reason": analysis.get('reason')}

        # 3. 安全確認 (スプレッド / メンテナンス時間)
        ticker = self.client.get_ticker(self.symbol_id)
        if "error" in ticker:
            logger.error(f"❌ 価格取得失敗。サイクルを中断します: {ticker['error']}")
            return {"status": "error", "message": "Failed to fetch ticker"}

        is_safe, safety_msg = check_safety(ticker)
        if not is_safe:
            logger.warning(f"🚫 安全チェックによりブロックされました: {safety_msg}")
            send_discord_notification("⚠️ 安全チェックによる待機", f"判定: {decision}\n理由: {safety_msg}", color=0xf1c40f)
            return {"status": "safety_blocked", "reason": safety_msg}

        # 4. Discordへの承認依頼
        news_titles = [item['title'] for item in news_items]
        request_trade_approval(news_titles, analysis, ticker)
        
        logger.info(f"📩 承認依頼を送信しました。判定: {decision}")
        return {"status": "sent_approval", "decision": decision, "analysis": analysis}

    def check_and_execute_pnl_exit(self) -> Dict[str, Any]:
        """ポジションの損益を確認し、-3% または +2% で自律決済する"""
        status = self.state.get_status()
        if not status or status.get("position") != 'LONG':
            return {"executed": False}

        entry_price = status.get("entry_price", 0)
        if entry_price <= 0:
            return {"executed": False}

        # 現在価格の取得
        ticker = self.client.get_ticker(self.symbol_id)
        current_price = float(ticker.get('last', 0))
        if current_price <= 0:
            return {"executed": False}

        pnl_rate = (current_price - entry_price) / entry_price
        logger.info(f"📈 ポジション監視中: Entry={entry_price}, Current={current_price}, PnL={pnl_rate:.2%}")

        # 損切り (-3%) または 利確 (+2%) の判定
        reason = ""
        if pnl_rate <= -0.03:
            reason = "🚨 損切りアラート (-3%到達)"
        elif pnl_rate >= 0.02:
            reason = "💰 利確アラート (+2%到達)"

        if reason:
            logger.warning(f"⚡ {reason} 自律決済を実行します。")
            send_discord_notification(reason, f"Entry: {entry_price}\nExit: {current_price}\nPnL: {pnl_rate:.2%}\n自動決済を開始します。", color=0xe74c3c if pnl_rate < 0 else 0x2ecc71)
            # 承認なしで決済実行
            res = self.execute_approved_trade(side='SELL')
            return {"executed": True, "reason": reason, "result": res}

        return {"executed": False}

    def execute_approved_trade(self, side: str, analysis_id: Optional[str] = None) -> Dict[str, Any]:
        """人間による承認後の実注文執行 (三段階冪等性チェック)"""
        # 最新価格と「発注前の残高」を取得
        ticker = self.client.get_ticker(self.symbol_id)
        current_price = float(ticker.get('last', 0))
        before_bal = self.client.get_btc_balance()
        
        if current_price == 0:
            logger.error("❌ 執行時の価格取得に失敗しました。")
            return {"success": False, "error": "Invalid current price"}

        # 1. 安全チェック (リスク管理レイヤー)
        current_pos_status = self.state.get_status().get("position_amount", 0)
        self.guard.check_rate_limit()
        if not self.guard.is_order_allowed(current_pos_status, self.amount):
            logger.warning("🚫 注文はリスク制限により拒否されました。")
            return {"success": False, "error": "Risk limit exceeded"}

        # 2. 注文執行
        logger.info(f"🚀 発注開始: {side} {self.amount} BTC @ {current_price} (Before Bal: {before_bal})")
        
        balance_changed = False
        if self.dry_run:
            logger.info("🧪 [PAPER TRADING] 実際の発注は行わず、成功として扱います。")
            res = {"success": True, "message": "Dry Run", "price": current_price}
            balance_changed = True # 擬似的に成功扱い
        else:
            res = self.client.place_order(self.symbol_id, side, self.amount)
            # APIのラグを考慮し、再度残高を確認して約定を確定させる
            time.sleep(2) # システムラグ待機
            after_bal = self.client.get_btc_balance()
            # 残高に変化があれば、APIレスポンスに関わらず「約定成功」とみなす（冪等性確保）
            if abs(after_bal - before_bal) >= (self.amount * 0.9): # 誤差を考慮
                logger.info(f"✨ 残高変化を検知しました (After Bal: {after_bal})。取引を成功として確定します。")
                balance_changed = True

        # 3. 確定後の処理
        if res.get('success', False) or balance_changed:
            self.guard.report_success()
            try:
                status = self.state.get_status() or {}
                # 正確な現在残高をベースにステータスを更新
                actual_bal = self.client.get_btc_balance() if not self.dry_run else (before_bal + self.amount if side == 'BUY' else before_bal - self.amount)
                status["position_amount"] = actual_bal
                status["position"] = 'LONG' if actual_bal > 0.00001 else None
                status["entry_price"] = res.get('price', current_price) if side == 'BUY' else 0
                status["last_updated"] = time.time()
                self.state.update_status(status)
                logger.info(f"✅ 状態管理を更新しました: Position={status['position']}, Amount={actual_bal}")
            except Exception as e:
                logger.error(f"⚠️ 状態更新失敗: {e}")

            send_discord_notification(
                "💸 取引完了通知",
                f"**結果**: {'成功 (約定確定)' if balance_changed else '成功'}\n**Side**: {side}\n**Amount**: {self.amount} BTC\n**Price**: {current_price} JPY\nMode: {'Paper' if self.dry_run else 'Live'}",
                color=0x2ecc71
            )
            return {"success": True, "price": current_price}
        
        # 失敗時
        self.guard.report_error()
        err_msg = res.get('error', 'API通信エラーまたは約定未確認')
        logger.error(f"❌ 注文失敗: {err_msg}")
        send_discord_notification("🚨 注文執行エラー", f"理由: {err_msg}", color=0xe74c3c)
        return {"success": False, "error": err_msg}
    def get_dashboard_data(self) -> Dict[str, Any]:
        """ダッシュボード表示用の統合データを取得 (堅牢なフォールバック付き)"""
        try:
            ticker = self.client.get_ticker(self.symbol_id)
            balance = self.client.get_balance()
            margin = self.client.get_margin_info()
            status = self.state.get_status() or {}

            # 型チェックと安全な値の抽出 (APIがリストやエラー文字列を返す可能性を考慮)
            def safe_get(data, key, default):
                if isinstance(data, dict):
                    return data.get(key, default)
                return default

            return {
                "mode": "本番 (Live)" if not self.dry_run else "模擬 (DryRun)",
                "symbol": "BTC/JPY",
                "last_price": safe_get(ticker, "last", 0),
                "ask": safe_get(ticker, "ask", 0),
                "bid": safe_get(ticker, "bid", 0),
                "balance": safe_get(balance, "assets", []),
                "equity": safe_get(margin, "equity", 0),
                "margin_usage": safe_get(margin, "marginUsageRate", 0),
                "position": status.get("position", "なし"),
                "entry_price": status.get("entry_price", 0),
                "last_updated": status.get("last_updated", time.time())
            }
        except Exception as e:
            logger.error(f"❌ ダッシュボードデータ構築中に予期せぬエラー: {e}")
            return {
                "mode": "ERROR",
                "symbol": "BTC/JPY",
                "last_price": 0,
                "error": str(e)
            }
