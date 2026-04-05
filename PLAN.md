# EXECUTION PLAN: 2026-04-06

AIの意図：
「クラウドランの動揺機（同様機能）を削除して」というご指示を受領しました。
新しく構築したGitHub Actionsの潮目監視エージェントへと完全に移行したため、これまで稼働していた古いCloud Run側のサービス（`itako-news-trade` または仮想通貨のV2ボット）を削除し、関連するコードをアーカイブして環境をクリーンアップします。

## 🎯 目的
1. **Cloud Runサービスの削除**: 不要になった重複サービス `itako-news-trade` などをGCP上から完全に削除し、管理コストと混乱ソースを断つ。
2. **コードベースの整理**: ローカル上の `rakuten-trading-bot-v2/` などの古いCloud Run向けコード群を、誤作動や混乱を防ぐため `archive_pending/` ディレクトリに待避させる。

## 📋 工程
1. [x] **【設計】PLAN.md の更新**: クリーンアップ作業のプラン策定。
2. [ ] **【実行】不要なCloud Runサービスの削除**: `gcloud run services delete` コマンドを発行（※実行前にユーザー様の承認プロンプトが出ます）。
3. [ ] **【実行】ローカルコードのアーカイブ化**: `rakuten-trading-bot-v2` フォルダを `archive_pending/` へ移動。
4. [ ] **【実行】完了報告**: `git add .` およびコミットを行い、環境の断捨離完了を報告する。

---
**Status:** In Progress 🚀
