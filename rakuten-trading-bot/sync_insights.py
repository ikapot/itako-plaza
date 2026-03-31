"""NotebookLMから取得した知見をFirestoreに書き込むスクリプト"""
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

# NotebookLMから取得した深い知見
insights = [
    {
        "content": "【森戸事件と学問の自由】1920年、東京帝国大学の森戸辰男がクロポトキンの社会思想を研究した論文を発表し、新聞紙法違反で起訴された。日本の学問史において大学の自治と言論の自由が厳しく制限された象徴的事件。権力への抵抗と知の自由は永遠のテーマである。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【相互扶助論と進化論の再構築】クロポトキンはダーウィンの進化論を弱肉強食と捉える社会ダーウィニズムに反論した。生物界と人間社会の双方において、競争よりも「相互扶助」が集団の存続と進化の鍵であると説いた。現代の格差社会への根本的な問いかけである。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【アナーキズムの建設的倫理観】クロポトキンが目指したのは単なる破壊ではなく、国家の強制に代わる「自由合意」と「連帯」に基づく社会再建だ。人間の本性に備わった倫理的な感覚としての相互扶助を社会構築の基盤に据えた。暴力ではなく愛と連帯による革命。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【日本知識人への深い影響】幸徳秋水、大杉栄、石川三四郎らがクロポトキンに強く共鳴した。対等な個人間の助け合いという思想は、日本の伝統的な地域共同体の感覚とも結びつき、独自の広がりを見せた。西洋の思想が日本の土壌に根付いた稀有な例である。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【吉野作造の高度な擁護戦略】吉野作造は森戸を救うため、クロポトキンの思想を「危険思想」ではないと弁明した。アナーキズムと天皇制を逆説的に関連付けるなど、論理的なレトリックを駆使して学問の自由を死守しようとした。知識人の勇気ある政治的行動の典型。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【現代の再評価：グレーバーと相互扶助】人類学者デヴィッド・グレーバーによって、相互扶助は再評価されている。単なる経済システムを超え、人間の社会性や連帯の基盤となる「前政治的な倫理観」として捉え直されている。コロナ禍の助け合いもその証拠だ。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【青年への呼びかけ：知識は民衆のために】クロポトキンは専門的な知識は個人の栄達のためではなく、苦しむ民衆のために使うべきだと「青年に訴えて」で説いた。これが当時の理想主義的な青年たちを鼓舞した。知の特権化への根本的な異議申し立てである。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
    {
        "content": "【災害復興と地域再生への応用】相互扶助の精神は現代の災害時における自発的ボランティア活動や、市場原理に依存しない地域コミュニティの再生モデルとして今なお重要な実践的意義を持つ。能登半島地震の支援活動にもこの精神が脈打っている。",
        "source": "notebooklm_sync",
        "timestamp": datetime.now(timezone.utc)
    },
]

# Firestoreに書き込む（既存データは保持し、新しいものを追加）
collection = db.collection("notebook_accumulations")
for i, insight in enumerate(insights):
    doc_ref = collection.add(insight)
    print(f"✅ ({i+1}/{len(insights)}) 書き込み完了: {insight['content'][:30]}...")

print(f"\n🎉 合計 {len(insights)} 件の深い知見をFirestoreに同期しました！")
