# Itako Plaza 開発進捗ログ

このファイルは、AIアシスタント（Antigravity）が行った作業内容を記録し、開発の継続性を担保するためのものです。

## 2026-03-29 作業ログ
### 1. 肖像画生成と統合 (Portraits & Integration)
- **新規肖像画の生成 / キャラクター定義の更新**: K, イタコの霊, ニャルラトホテプ 等の肖像画を生成し、`src/constants.js` を更新。スロットを完全に埋めました。

## 2026-03-30 作業ログ（フリーズ対策強化）
### 1. 記憶保持システムの確立
- **チェックポイント機能の実装**: `.checkpoint.json` による作業前保存ワークフローを構築。
### 2. 新規アプリ開発：楽天証券自動売買システム（MVP）
- **システム構成**: Python + Playwright によるクラウド運用構成を定義。

## 2026-03-31 作業ログ
- **Itako Plaza のビルドエラー調査**: `profiles.js` の破損を特定。

## 2026-04-02 作業ログ
- **profiles.js の復元**: ビルドエラーを解消。
- **Itako Bridge (Discordボット)**: OpenRouter によるマルチフォールバック実装。

## 2026-04-04 作業ログ
- **ニュース・トレードシステム V2 (仮想通貨)**: FastAPI による自律実行エンジンを `rakuten-trading-bot-v2/` に実装。

## 2026-04-05 作業ログ（記憶復元プロトコル確立とV2ボット最適化）
- **protocol-remember.md の創設**: フリーズからの最速復旧手順を確立。
- **Cloud Run コスト最適化**: サービスの `min-instances: 0` 化を完了。

## 2026-04-07 作業ログ（Vercel 移行とプロジェクト整理）

### 1. Vercel サーバーレス移行完了と API 安定化 (Vercel Migration)
- **[完了] streamChat API の移植**: Firebase Cloud Functions から Vercel API への移行を完遂。
- **[完了] api/status.js の修正**: 外部 API 取得失敗時の 500 エラーを抑制する例外処理を追加。
- **[完了] 認証ログの強化**: Firebase Auth の検証失敗時に詳細なエラー理由をレスポンスに含めるように改修。

### 2. 旧プロジェクト・過去データの大規模アーカイブ化 (Workspace Organization & Archiving)
- **[完了] .archive/ ディレクトリへの集約**: `rakuten-trading-bot`, `trading_bot`, ZIP ファイル、大量の実行ログ・一時スクリプトをアーカイブへ移動。プロジェクトルートを「現役コード」のみに整理し、極めてクリーンな状態にしました。

### 3. 楽天証券ブラウザ型エージェントの実用化 (Browser Agent Implementation)
- **[完了] agent.py の本格実装**: Firestore による 2FA（二段階認証）ステータス管理と、OpenRouter を組み合わせたログインフローを統合。
- **[完了] テスト基盤の整備**: `requirements.txt` の作成、およびヘッドフル・テスト用スクリプト `test_launch.py` を実装。
- **[完了] 依存関係とブラウザのセットアップ**: `browser-use` ライブラリの導入と Playwright (Chromium) の環境構築を完了。

### 4. クオンツ・トレード・エンジンの高度化 (Advanced Quant Engine implementation)
- **[完了] 高度な決済 (Exit) ロジックの実装**: 分割利確 (TP1/BE)、天井離脱 (EMA乖離/RSI反転)、シャンデリア・エグジット (ATR Trailing Stop) を統合した `AdvancedExitManager` を `advanced-trader/` に構築。
- **[完了] 資金管理エンジンの統合**: 口座資金の2%リスクに基づいたポジションサイジング関数 `RiskManager` を実装。
- **[完了] 技術スタックの拡張**: `ccxt`, `pandas-ta` を導入し、プロフェッショナルな数理分析基盤を確立。

### 5. 「完全零円運用」の絶対遵守 (Zero-Cost Bible)
- **[重要] アーキテクチャの憲法化**: すべての機能において「無料枠（Free Tier）」を最優先し、クレジットカード登録や従量課金を回避する設計を徹底。
- **ガイドラインの策定**: [ZERO_COST_GUIDE.md](file:///C:/Users/ikapo/.gemini/antigravity/brain/29b78929-d589-47b9-a7be-759f1f00a8cc/ZERO_COST_GUIDE.md) を作成。Vercel, Firestore Spark, GitHub Gist, OpenRouter Free Models 等を組み合わせた「維持費0円」のシステム構成をプロジェクトの絶対条件として明文化しました。

## 2026-04-12 作業ログ（LTC Zen-Grid 構築）
- **LTC/JPY 自動売買エンジンの実装**: 最小単位 0.1 LTC でのグリッドトレード戦略を構築。
- **FEE_GUARD プロトコル**: 楽天ウォレットCFDの管理料回避（06:50 JST）ロジックを統合。
- **WebSocket 連携**: symbolId: 10（LTC）のリアルタイム価格購読を安定化。

## 2026-04-13 作業ログ（Itako Mobile Bridge V2 完遂）
- **Itako Mobile Bridge V2 の実装**: 
    - Discord DM 経由で PC 側の AI（Antigravity）に直接指示を出せるエージェント・エンジンを構築。
    - **Diff 確認フロー**: コード修正前に差分を表示し、ユーザーの承認（OK）を得てから反映する安全機構を導入。
    - **マルチツール搭載**: ファイル操作、スクリーンショット撮影、資産取得を iPhone から実行可能に。
- **PWA 最適化**: 
    - `manifest.json` と PWA アイコンを生成し、iPhone のホーム画面から専用アプリとして起動可能に。
- **セキュリティ強化**: 
    - `ALLOWED_DISCORD_USER_ID` による厳格な本人認証を導入。

## 2026-04-15 作業ログ（Itako Mobile Bridge V2 起動準備）
- **Itako Mobile Bridge V2 の実装完遂**: 
    - Discord DM 経由で PC 側の AI（Antigravity）に直接指示を出せるエージェント・エンジンを `itako_mobile_bridge_v2.py` に構築。
    - Gemini 1.5 Flash による Function Calling (ファイル読み書き、コマンド実行) を統合。
    - **セキュア承認フロー**: Discord 上で Diff を提示し、ユーザーが「OK」と答えた時のみコードを書き換える安全機構を実装。
- **依存関係の更新**: `requirements.txt` に `google-generativeai` を追加。

---
## 次回への申し送り（随時更新）
- [ ] **Mobile Bridge V2 のバックグラウンド起動**: ユーザーによる手動起動、または `pm2` 等での常駐化。
- [ ] **LTC ボットの本格稼働**: 実弾取引の初エントリー監視。
- [ ] **Painter Tax Assist の仕上げ**: ブラウザ上での動作確認と細部のUI調整。

---
## AI運用ルール (Communication & Persistence)
- **プランニング第一主義 (Planning First Protocol)**: いかなる作業を開始・継続する前であっても、必ず最初に `PLAN.md`（ルート直下）を作成または更新する。 
- **「思い出して」トリガー**: 指示があった場合、直ちに `protocol-remember.md` に従い全ログをスキャンする。
- **指示の簡略化**: AIからユーザーへ作業を依頼する際は、「中学生でも分かるレベル」の言葉を使い、手順を箇条書きで分かりやすく伝える。

## 2026-04-14 作業ログ（楽天認証完全解決と実弾稼働開始）

### 1. 楽天 API 認証問題の根絶 (DNA Reconstruction)
- **[完了] NotebookLM 優先プロトコルの確立**: `RULES_RAKUTEN.md` に Rule 0 を定義し、AI の行動指針を「真実（外部知識）重視」へ強制転換。
- **[完了] 署名ロジックの最終確定**: RAW シークレットとフルパス符号化により 20006 エラーを解消。
- **[完了] 負の遺産の物理的隔離**: 混乱を招いた古いデバッグスクリプトを `retired_knowledge/` へ退避。

### 2. 量産型 LTC トレーダーの始動 (Zen-LTC-Quant V2.5)
- **[完了] 1-Shot 稼働モードの実装**: GitHub Actions の実行制限に合わせ、14分間稼働・自動終了するタイマー機能を統合。
- **[完了] 実弾稼働への移行**: `DRY_RUN=false` 設定と `dry_run` 安全ガードの実装を完了。LTC/JPY の本番取引を開始。

### 3. CI/CD 環境の正常化 (Binance 451 固定)
- **[完了] Binance 依存の排除**: 451 Restricted Location エラーを吐いていた旧 `quants-trader.yml` を最新エンジンへ移設・正規化。
## [2026-04-16] 取引ボットのローカル常駐化と本番稼働開始
- **重大な発見**: 楽天ウォレット API が 2026/02/18 より海外 IP を遮断したことを特定。GitHub Actions での運用が不可能であることを確認。
- **インフラ刷新**: 取引ボットを GitHub Actions からローカル PC (PM2) へ完全移行。
- **本番モード移行**: `DRY_RUN: false` を設定し、実弾トレードを開始。
- **ダッシュボード復旧**: 新しい GIST_TOKEN を設定し、Gist の 1分更新が正常に動作することを確認。
- **重複防止**: GitHub Actions のスケジュール実行を停止。

### 4. モニター環境の復旧 (LTC Dashboard)
- **[完了] Gist 同期パラメータの整合**: エンジンとモニター間のファイル名（strategy_state.json）および環境変数を同期。
- **[完了] ローカルテストサイト起動**: `http://localhost:3001` での正常表示を確認。
- **[完了] Vercel ライブサイトの完全正常化**: `GIST_ID` の typo と、初期データ書き込みタイミングのズレを修正し、`https://ltc-monitor.vercel.app` への完全なリアルタイム同期を実現。

## 2026-04-16 作業ログ（NotebookLM 調査と接続安定化）

### 1. NotebookLM による深層リサーチ
- **[完了] 楽天MD（仕様書）の再検証**: 
    - WebSocket の TICKER 構造が「フラット」であることを再確認。
    - 市場データ購読には認証不要であることを確認。
    - 購読メッセージの `symbolId` が数値型である必要があることを特定。

### 2. WebSocket 接続不良の根本解決 (Bug Fix)
- **[完了] websockets ライブラリの互換性修正**: 
    - `websockets 14.0+` で引数名が `extra_headers` から `additional_headers` に変更されていたことによる TypeError を発見し修正。
    - GitHub Actions のワークフローを `websockets>=14.0` に更新。
- **[完了] 欠落していた await の補完**: 
    - `grid_engine.py` 内の `get_cfd_positions` 呼び出しに `await` が欠落していたバグを修正。
- **[完了] ロギングの可視化**: 
    - GitHub Actions のログに確実に出るよう、`[WS_DIAG]` 等のタグ付き print 文を追加。

### 3. 実弾環境の正常化
- **[完了] GitHub Actions での接続確認**: ローカルでの `DRY_RUN` で正常な WebSocket 接続と購読を確認。GitHub へプッシュ済。

### 4. Discord Bot の常駐化 (Persistence)
- **[完了] PM2 の導入**: `npm install -g pm2` を実行。
- **[完了] エコシステム構築**: `ecosystem.config.json` を作成し、ボットを PM2 管理下に配置。
- **[完了] 自動起動スクリプト**: Windows 再起動時に PM2 を復旧させる `start_discord_bot.bat` を用意。
