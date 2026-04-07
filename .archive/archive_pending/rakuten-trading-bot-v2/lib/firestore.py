import logging
from google.cloud import firestore

logger = logging.getLogger(__name__)

class TradingState:
    def __init__(self, collection_name="trading_v2"):
        self.db = firestore.Client()
        self.collection = self.db.collection(collection_name)
        self.doc_id = "current_status"

    def get_status(self):
        """現在のポジション・損益・最終取引価格を取得"""
        try:
            doc = self.collection.document(self.doc_id).get()
            if doc.exists:
                return doc.to_dict()
            return {
                "position": None, # 'LONG', 'SHORT', or None
                "entry_price": 0,
                "total_pnl": 0,
                "last_news_id": None,
                "is_trading_enabled": True
            }
        except Exception as e:
            logger.error(f"❌ Firestore 読み込みエラー: {e}")
            return None

    def update_status(self, data):
        """状態を更新"""
        try:
            self.collection.document(self.doc_id).set(data, merge=True)
            logger.info("✅ Firestore 状態を更新しました。")
            return True
        except Exception as e:
            logger.error(f"❌ Firestore 更新エラー: {e}")
            return False

    def log_trade(self, trade_data):
        """取引履歴を保存"""
        try:
            self.collection.document("history").collection("trades").add({
                **trade_data,
                "timestamp": firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            logger.error(f"❌ 取引ログ保存エラー: {e}")
            return False
