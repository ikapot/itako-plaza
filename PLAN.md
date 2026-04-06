# EXECUTION PLAN: 2026-04-06

AIの意図：
Firebase Cloud Functionsからの完全撤退と、Vercel Serverless Functionsへの「`streamChat` API」の移植計画（Vercelへの引っ越し）を受領しました。
これにより、維持費の心配やクレジットカード登録要件（Blazeプラン）を完全に排除した「完全無料Webアプリ」を完成させます。

## 🎯 目的
1. **Firebase Functions の廃止**: `functions/index.js` を削除し、Firebaseの従量課金プランから脱却する準備を整える。
2. **Vercel Serverless API への移植**: プロキシAPIである `streamChat` をVercel側（`api/streamChat.js`）へ移行する。
3. **セキュアな認証の維持**: Vercel環境でもFirebase Authのトークン検証を行えるよう設定を組み直す。

## 📋 工程
1. [x] **【設計】PLAN.md の更新**: Vercelへの引っ越しプランの策定。
2. [x] **【設計】Implementation Plan の作成**: 必要な変更ファイルと、Vercel側での追加設定（環境変数）を明記した計画書を提示し、ユーザーの承認を得る。（承諾済）
3. [x] **【実装】コードの移植**: `api/streamChat.js` を作成し、フロントエンドの環境変数（`VITE_PROXY_URL`）の接続先を変更する。（Vercel環境変数もAIが自動注入完了）
4. [/] **【実行】不要リソースの削除**: ローカルの `functions/` フォルダを削除し、Firebaseから関数を削除するコマンドを発行する。

---
**Status:** In Progress 🚀 (Phase 4: Waiting for Verification)
