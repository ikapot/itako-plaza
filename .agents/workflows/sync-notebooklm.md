---
description: NotebookLMから知見を抽出し、イタコプラザへ自動同期する
---

// turbo-all
1. ユーザーから NotebookLM のノートブック URL を取得する。
2. `open_browser_url` を使用して NotebookLM を開く。
3. ノートブック内の「ソース」または「チャット応答」から重要な知見をコピーする。
4. イタコプラザの Firebase サーバー、またはアプリ内の `handlePushNotebook` 相当の機能を使用してデータを保存する。
5. 成功したら、広場の精神（AI）に知見が同期されたことを通知する。
