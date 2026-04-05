import time
import logging

logger = logging.getLogger(__name__)

class SafetyGuard:
    def __init__(self, max_position: float = 0.001, error_threshold: int = 3):
        self.max_position = max_position
        self.error_threshold = error_threshold
        self.consecutive_errors = 0
        self.last_api_call = 0
        self.min_interval = 2.0  # APIリクエスト間の最小秒数

    def check_rate_limit(self):
        """APIリクエスト間隔を制御"""
        now = time.time()
        elapsed = now - self.last_api_call
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            logger.info(f"⏳ Rate limit: Sleeping for {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_api_call = time.time()

    def is_order_allowed(self, current_pos: float, new_order_amount: float) -> bool:
        """最大ポジション上限を超えないかチェック"""
        potential_pos = current_pos + new_order_amount
        if potential_pos > self.max_position:
            logger.warning(f"🚫 Max position reached. Limit: {self.max_position}, Potential: {potential_pos}")
            return False
        
        if self.consecutive_errors >= self.error_threshold:
            logger.error(f"🚫 Circuit breaker ACTIVE. Consecutive errors: {self.consecutive_errors}")
            return False
            
        return True

    def report_success(self):
        """成功時にエラーカウントをリセット"""
        self.consecutive_errors = 0

    def report_error(self):
        """失敗時にエラーカウントをインクリメント"""
        self.consecutive_errors += 1
        logger.warning(f"⚠️ Error reported to SafetyGuard. Count: {self.consecutive_errors}")
