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

---
## 次回への申し送り（随時更新）
- [ ] **Mobile Agent の実運用テスト**: 外出先から iPhone で実際にコード修正指示や画像取得を行い、安定性を確認する。
- [ ] **LTC ボットの本格稼働**: DRY_RUN から実運用への移行タイミングの決定。
- [ ] **Painter Tax Assist の仕上げ**: ブラウザ上での動作確認と細部のUI調整。

---
## AI運用ルール (Communication & Persistence)
- **プランニング第一主義 (Planning First Protocol)**: いかなる作業を開始・継続する前であっても、必ず最初に `PLAN.md`（ルート直下）を作成または更新する。 
- **「思い出して」トリガー**: 指示があった場合、直ちに `protocol-remember.md` に従い全ログをスキャンする。
- **指示の簡略化**: AIからユーザーへ作業を依頼する際は、「中学生でも分かるレベル」の言葉を使い、手順を箇条書きで分かりやすく伝える。
