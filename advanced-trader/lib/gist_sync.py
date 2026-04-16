import requests
import json
import os
import logging

logger = logging.getLogger("GistSync")

class GistSync:
    """
    GitHub Gist を状態管理（永続化）に使用するためのクラス
    """
    def __init__(self, pat, gist_id, filename="position.json"):
        self.pat = pat
        self.gist_id = gist_id
        self.filename = filename
        self.url = f"https://api.github.com/gists/{gist_id}"
        self.headers = {
            "Authorization": f"token {pat}",
            "Accept": "application/vnd.github.v3+json"
        }

    def load(self):
        """Gist からデータを読み込む"""
        if not self.pat or not self.gist_id:
            logger.warning("⚠️ Gist 連携に必要な GITHUB_PAT または GIST_ID がありません。ローカルファイルを使用します。")
            return None
            
        try:
            resp = requests.get(self.url, headers=self.headers, timeout=10)
            resp.raise_for_status()
            gist = resp.json()
            file_content = gist.get("files", {}).get(self.filename, {}).get("content")
            if file_content:
                return json.loads(file_content)
        except Exception as e:
            logger.error(f"❌ Gist 読込エラー: {e}")
        return None

    def save(self, data):
        """Gist にデータを保存する"""
        if not self.pat or not self.gist_id:
            logger.warning("⚠️ Gist 連携に必要な設定がありません。保存をスキップします。")
            return False
            
        # NaN を JSON で扱える 0.0 に置換（再帰的に処理）
        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize(v) for v in obj]
            elif isinstance(obj, float) and obj != obj: # NaN check
                return 0.0
            return obj

        payload = {
            "files": {
                self.filename: {
                    "content": json.dumps(sanitize(data), indent=4)
                }
            }
        }
        
        try:
            resp = requests.patch(self.url, headers=self.headers, json=payload, timeout=10)
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"❌ Gist 保存エラー: {e}")
            return False
