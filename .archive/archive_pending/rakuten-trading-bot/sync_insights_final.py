"""最後の一括知見同期スクリプト"""
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

key_path = "firebase-key.json"
if os.path.exists(key_path):
    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
else:
    if not firebase_admin._apps:
        firebase_admin.initialize_app()

db = firestore.client()

insights = [
    {"content": "【漱石：則天去私への道】夏目漱石は「自己本位」から、晩年は私心を捨て天に従う「則天去私（そくてんきょし）」へと精神を深めた。近代人が抱える孤独、エゴイズム、他者との不可能性を「古典」に閉じ込めず、現代の実存的な戦いとして捉え直すべきである。", "source": "notebooklm_sync_final"},
    {"content": "【大杉栄：生の拡充】日本のアナキスト大杉栄は、権威や慣習に盲従する「奴隷根性」を徹底的に批判した。個人の生命力を無限に拡大・躍動させる「生の拡充」を人生の根本に置き、国家の支配道具である金銭や市場の論理に囚われない自由を体現した。", "source": "notebooklm_sync_final"},
    {"content": "【金子文子：不逞なる自由】極貧と虐待の果てに「不逞（ふてい）」なる真の自己を確立した金子文子。国家や家父長制という構造的暴力に対し、自らの意志を貫く「生の拡充」を追求し、絶望的な獄中でも「虚無」という武器で支配を砕こうとした。", "source": "notebooklm_sync_final"},
    {"content": "【朱喜哲：現代的正義の実装】企業内哲学者・朱喜哲氏が説く、プラグマティズムに基づく正義。環境的正義を単なる資源配分ではなく、抑圧された人々の「承認」や「参加」を含む多元的概念と捉え、現実的な対話を通じて気候変動等の現代課題に立ち向かう。", "source": "notebooklm_sync_final"},
    {"content": "【ドイツと歴史的責任】ドイツの対イスラエル政策の根幹にある「歴史的責任」。これは単なる過去への謝罪ではなく、現代の国家安全保障や地政学的な判断に決定的な影響を与える、消えない負債と倫理的な重圧の複雑な力学である。", "source": "notebooklm_sync_final"},
    {"content": "【戦時下の表現と沈黙の抵抗】軍国主義の狂気の中で、ピカソや丸木夫妻のように芸術を通じて戦争の惨禍を可視化する。政治的抗議だけでなく、あえて語らない「沈黙」や「風刺」も、思想的独立を保つための有効な、そして強靭な抵抗の形である。", "source": "notebooklm_sync_final"},
]

collection = db.collection("notebook_accumulations")
for insight in insights:
    insight["timestamp"] = datetime.now(timezone.utc)
    collection.add(insight)

print(f"🎉 最終バッチ、全 {len(insights)} 件の書き込みが完了しました！")
