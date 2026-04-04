import logging
import time
from lib.rakuten_api import RakutenWalletClient
from lib.firestore import TradingState
from lib.discord_util import send_discord_notification, request_trade_approval
from engine.news import fetch_crypto_news
from engine.analysis import analyze_sentiment
from engine.safety import check_safety

logger = logging.getLogger(__name__)

class NewsTradingEngine:
    def __init__(self, symbol_id=7, dry_run=True):
        self.client = RakutenWalletClient()
        self.state = TradingState()
        self.symbol_id = symbol_id
        self.dry_run = dry_run
        self.amount = 0.0001 # TODO: 設定から取得 (2,000円相当)

    def run_cycle(self):
        """1回の情報収集〜執行サイクル"""
        logger.info("🚀 サイクルを開始中...")
        
        # 1. ニュース収集
        news_items = fetch_crypto_news(60 * 30) # 直近30分
        if not news_items:
            logger.info("💤 新規ニュースなし。待機します。")
            return {"status": "no_news"}

        # 2. AI 解析
        analysis = analyze_sentiment(news_items)
        decision = analysis.get('decision', 'HOLD')
        
        if decision == 'HOLD':
            logger.info("⏸️ 判断は HOLD です。何もしません。")
            return {"status": "hold", "reason": analysis.get('reason')}

        # 3. 安全確認 & 価格取得
        ticker = self.client.get_ticker(self.symbol_id)
        is_safe, safety_msg = check_safety(ticker)
        
        if not is_safe:
            logger.warning(f"🚫 安全確認失敗: {safety_msg}")
            send_discord_notification("🚨 安全チェック失敗", f"判断: {decision}\n理由: {safety_msg}", color=0xf1c40f)
            return {"status": "safety_blocked", "reason": safety_msg}

        # 4. 通知と承認依頼 (現状は全件承認要請)
        news_titles = [item['title'] for item in news_items]
        request_trade_approval(news_titles, analysis, ticker)

        # TODO: 承認ボタンからのコールバック待機ロジック
        # 現状はここで一旦停止し、人間が手動でAPIを叩くか、DiscordからのWebhook経由で後続処理を動かす想定
        
        logger.info(f"📩 承認依頼を送信しました。判定: {decision}")
        return {"status": "sent_approval", "decision": decision, "analysis": analysis}

    def execute_approved_trade(self, side, analysis_id=None):
        """承認された取引の執行"""
        # 価格再取得
        ticker = self.client.get_ticker(self.symbol_id)
        current_price = float(ticker.get('last', 0))
        
        logger.info(f"⚡ 執行中: {side} @ {current_price}")
        
        if self.dry_run:
            logger.info("🧪 Dry Run モードのため、実際の発注は行いません。")
            res = {"success": True, "message": "Dry Run Success"}
        else:
            res = self.client.place_order(self.symbol_id, side, self.amount)
        
        if res.get('success', False) or self.dry_run:
            # 状態更新
            status = self.state.get_status()
            status["position"] = 'LONG' if side == 'BUY' else None # 簡易化
            status["entry_price"] = current_price if side == 'BUY' else 0
            self.state.update_status(status)
            
            send_discord_notification(
                "💸 注文執行完了",
                f"{side} {self.amount} BTC\n価格: {current_price} JPY",
                color=0x2ecc71
            )
            return res
        
        send_discord_notification("❌ 注文失敗", f"APIエラー: {res.get('error', '不明')}", color=0xe74c3c)
        return res
