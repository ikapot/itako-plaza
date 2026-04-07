"""Firestoreにどんな知見データが入っているか確認するスクリプト"""
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

key_path = "firebase-key.json"
if os.path.exists(key_path):
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.initialize_app()

db = firestore.client()

print("=== notebook_accumulations コレクションの中身 ===\n")
docs = db.collection("notebook_accumulations")\
         .order_by("timestamp", direction=firestore.Query.DESCENDING)\
         .limit(10).stream()

count = 0
for doc in docs:
    count += 1
    data = doc.to_dict()
    print(f"--- ドキュメント {count} ---")
    print(f"タイムスタンプ: {data.get('timestamp', '不明')}")
    content = data.get('content', '')
    print(f"内容（最初の200文字）: {content[:200]}")
    print()

if count == 0:
    print("❌ データが一件もありません！NotebookLMの同期がまだ行われていないようです。")
else:
    print(f"✅ 合計 {count} 件のデータが見つかりました。")
