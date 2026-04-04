# EXECUTION PLAN: 2026-04-04 22:40

AIの意図：
「自律型ニュース・トレードシステム V2」のデプロイ（公開）準備と並行して、滞っていた「Painter Tax Assist（領収書解析）」の機能を完成させます。
ユーザー様には「秘密のカギ」と「Drive フォルダ」の準備をお願いし、私はアプリの精度と使い勝手を向上させます。

## 🎯 目的
1. **トレードボットの公開**: Cloud Run へのデプロイと初期設定。
2. **領収書解析の完成**: 税理士レベルの正確な仕訳と CSV 書き出し機能の洗練。
3. **使い勝手の向上**: `Receipts` フォルダがない場合の親切な誘導と UI 改善。

## 📋 工程
1. [ ] **【ユーザー作業】GCP と Google Drive の設定**
   - 下記の手順に沿って、APIキーの登録とフォルダ作成をお願いします。
2. [ ] **【設定】実売買の有効化**
   - ユーザー様の準備ができ次第、私がボットを「本番モード」にします。
3. [ ] **【開発】Painter Tax Assist の UI 刷新**
   - 確定済みの仕訳一覧を表示し、CSV 書き出しまで一気通貫で動かせるようにします。

## 📝 ユーザー様へのお願い（中学生でもわかる手順）

> [!IMPORTANT]
> **1. 「秘密の箱」にカギを入れてください**
> 以下の 4つを [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) に登録してください。
> - `WALLET_API_KEY`, `WALLET_API_SECRET`, `OPENROUTER_API_KEY`, `DISCORD_WEBHOOK_URL`
>
> **2. Google Drive に「レシート置き場」を作ってください**
> あなたの Google Drive の一番上の階層に、 **`Receipts`** というフォルダを作って、試しにレシートの写真を数枚入れてみてください。

> [!TIP]
> **プログラムの公開（デプロイ）**
> カギが置けたら、ターミナルで以下の文字を貼り付けて実行してください。
> ```bash
> gcloud run deploy itako-news-trade --source . --region asia-northeast1 --allow-unauthenticated
> ```

---
**Status:** Ready to Deploy 🚀
プログラムの実装はすべて終わっています。あとはユーザー様による「カギの登録」と「公開ボタン（コマンド）」を待つ状態です。
これが終われば、いよいよニュースに基づいた自動トレードが始まります！
