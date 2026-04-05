# Itako Plaza 開発進捗ログ

このファイルは、AIアシスタント（Antigravity）が行った作業内容を記録し、開発の継続性を担保するためのものです。

## 2026-03-29 作業ログ

### 1. 肖像画生成と統合 (Portraits & Integration)
- **新規肖像画の生成**: 以下のキャラクターについて、ウォーホル風シルクスクリーンの肖像画を生成し、`public/assets` に配置しました。
    - `K (k_kokoro)`
    - `イタコの霊 (itako_spirit)`
    - `ニャルラトホテプ (nyarla)`
    - `影 (shadow)`
    - `トリックスター (trickster)`
    - `語り手 (narrator)`
- **キャラクター定義の更新**: `src/constants.js` に上記キャラクターを追加し、スピリット・キューブの全60スロット（10体×6面）を完全に埋めました。
- **Kのポートレート修正**: `null` だった `k_kokoro` のアバターを、生成した専用画像に差し替えました。

### 2. 環境設定とデバッグ (Environment & Auth)
- **Firebase設定の確認**: `.env` の環境変数が Vite によって正しく読み込まれているか調査しました。
- **認可状態の確認**: ブラウザ上で「KENJI IKAPOT」として正しくログインできていること、および `PROXY_MODE` が正常に動作していることを確認しました。

### 3. 表示確認 (UI/UX)
- **レジストリ（SPIRIT_INDEX）の検証**: ブラウザのサブエージェントを使用し、新規追加されたキャラクター（#01〜#60）がすべてリストに表示され、肖像画が正しく描画されていることを確認しました。

### 4. ブラックスクリーン問題の修正 (UI Bugfix)
- **初期化ロジックの修正**: `App.jsx` において、未ログイン状態でも `isAppReady` が `true` になるよう修正し、起動時に画面が真っ暗になる問題を解決しました。
- **グローバル変数のクリーンアップ**: `src/firebase.js` で発生していた `app` 変数のグローバルリーク（厳格モードでのエラー原因）を修正しました。

### 5. 対話エンジンの周期律（アサビーヤ）対応 (Dialogue Engine)
- **システムプロンプトの洗練**: `src/gemini.js` において、3,650日のカウントダウン（残り日数）に応じてキャラクターの反応が変化するロジックを実装しました。連帯（アサビーヤ）が減衰するにつれ、対話がより乾き、断絶的なトーンへ変容するように設定しました。

### 6. Firebase構成エラーのデバッグ (Troubleshooting)
- **エラーログの強化**: `src/firebase.js` のエラー出力を改善し、開発環境（LOCAL）か本番環境（PROD）かを明示し、具体的な解決策（devサーバー再起動やGitHub Secretsの確認）を提示するようにしました。

---
## 2026-03-30 作業ログ（フリーズ対策強化）

### 0. 事故防止・リカバリ策の導入
- **チェックポイント・システムの構築**: `.checkpoint.json` をルートに作成。重大なツールの実行前やターンの節目にAI自身の「意図」と「進捗」を強制的に書き出す仕組みを開始しました。
- **タスク管理の厳格化**: `<appDataDir>` 内の `task.md` および `implementation_plan.md` を活用し、会話を跨ぐコンテキストの橋渡しを確実に行います。

### 1. 記憶保持システム（フリーズ対策）の確立
- **[完了] チェックポイント機能の実装**: `.checkpoint.json` を活用した「作業前保存」のワークフローを構築。フリーズ後の自己修復・コンテキスト復元が可能になりました。
- **[完了] インクリメンタル・ログ運用の開始**: 本ファイル (`PROGRESS_LOG.md`) をターンの節目で更新し、長期的な記憶を担保します。

### 2. 新規アプリ開発：楽天証券自動売買システム（MVP）
- **[完了] システムアーキテクチャ設計**: Python + Playwright + FastAPI + Streamlit による、クラウド運用（Cloud Run）向けの軽量構成を定義。
- **[完了] ストラテジー・リスク管理の実装**: RSI指標による判定と、元手1万円に対する **1%（100円）損切りルール** を `strategy.py` に実装。
- **[完了] Discordを通じた「半自動」2FA認証**: 二要素認証時にスマホへ通知・承認ボタンを送り、AIがログインを続行する仕組み（`discord_bot.py`）を構築。
- **[完了] デプロイ基盤（Dockerfile）の作成**: 非力なローカル環境に依存せず、クラウドで 0円運用が可能なコンテナ定義を完了。

---
## 次回への申し送り（随時更新）
- [x] **楽天ボットの最終設定**: `.env` への各種APIキー/トークンの設定と、Cloud Run 向け Dockerfile / GitHub Actions の作成完了。
- [ ] **GitHub Secrets の登録 (ユーザー作業)**: `GCP_PROJECT_ID`, `GCP_SA_KEY`, `DISCORD_TOKEN` 等の 7つの秘匿情報を登録する。（ユーザー様が明日実施予定）
- [ ] **イタコプラザの断片回収**: Vercel/GitHub環境変数の整合性チェック、およびFirestoreルールの恒久保存（`tmp/store_rules.mjs`）。

2026-03-30 19:00:
- 市場調査の結果、楽天証券公式API（株）が存在しないことが判明。
- ユーザー環境にMarketSpeed IIがあるため、RSS機能(DDE通信)を活用する方針に決定。
- pywin32のインストールとDDE通信テストを実施したが、MS2 RSSへの接続に失敗している。
- ユーザーがPC再起動を実施中。復帰後にExcel連携も視野に入れ検証を継続する。
### 3. Discordボットの機能拡張
- **[完了] メンバー参加検知の実装**: `rakuten-trading-bot/itako_discord_bot.py` を修正。
    - `intents.members = True` を設定。
    - `on_member_join` を追加し、誰かがランダムに挨拶するロジックを統合。
- **[完了] ニラ様の人格確認**: `src/data/profiles.js` に「ニラ様」の定義が既に存在することを確認しました。

---
---
## 次回への申し送り（随時更新）
- [ ] **SERVER MEMBERS INTENT の有効化**: Discord Developer Portal で、このボットの `Server Members Intent` を ON にする必要があります（ユーザー作業）。
- [ ] **ボットの動作テスト**: 実際にボットを起動して、エラーが出ないか、挨拶が動くかを確認する。
- [ ] **Painter Tax Assist**: 領収書解析・CSV出力機能の続きの着手。

---
## 2026-03-31 作業ログ（進捗と中断・引き継ぎ）

### 1. プロジェクトの状況再確認と復旧準備
- **[調査完了] Itako Plaza のビルドエラー**: `src/data/profiles.js` における「平塚らいてう (raicho)」と「イブン・ハルドゥーン (khaldun)」の定義が22行目で混ざり合っていることを特定。また、68行目にもハルドゥーンが重複していることを確認しました（これらがビルド失敗の原因です）。次回、これを安全に取り除きます。
- **Itako Bridge (Discordボット)**: ビルドエラー解消後に自動デプロイが完了したのち、疎通テストを行う準備を整えました。
- **Painter Tax Assist**: Google Drive上の領収書画像データを抽出・解析するロジック（`resumption_summary.md`）の引き継ぎ確認を行いました。

---
## 次回（再開時）の申し送り
- [ ] **【最優先】profiles.js の修復**: `src/data/profiles.js` 22行目・68行目付近の混入テキストを綺麗に分離し、GitHubでのビルドエラーを消滅させる。
- [ ] **【テスト】Itako Bridge のデプロイ確認**: 上記が完了したら、Discord で「おはよう」などと話しかけ、正常に反応するかテストする。
- [ ] **【ユーザー作業】SERVER MEMBERS INTENT の有効化**: Discord Developer Portal でボットの `Server Members Intent` を ON にする（未完了の場合）。
- [ ] **【開発】Painter Tax Assist**: 領収書解析・CSV出力APIの実装に着手する。

---
## 2026-04-02 作業ログ

### 1. プロジェクトの復旧と安定化 (Recovery & Stability)
- **[完了] profiles.js の完全復旧**: 正規表現を用いた抽出スクリプトにより、破損していた平塚らいてう等の定義を分離・修正しました。これにより、プロダクションビルドエラーを解消し、GitHub Actions の自動デプロイを正常化しました。
- **[完了] ボット（Itako Bridge）の応答ロジック改修**: 
    - 名前がなくてもランダムに人格が返信するよう変更。
    - **OpenRouter のマルチ・フォールバック実装**: Gemini の 429 エラー（回数制限）発生時に、OpenRouter 経由で複数の無料モデルを順番に試行するロジックを搭載。
    - **Discord 2000文字制限対応**: 長い返信を自動トリミングする機能を追加。

### 2. Antigravity 搭載と対話チャネルの移行 (Discord Discussion)
- **[完了] Antigravity（AI助手）の人格実装**: 開発・技術打ち合わせを Discord 上で行えるよう、ボットに私（Antigravity）の人格を統合しました。「名前マップ」に Antigravity を追加し、技術的な文脈（APIテスト結果など）を記憶させました。
- **[完了] 移行テスト**: Discord で「アンティ」「テスト」などの呼びかけに対し、ボットが正常に応答できることを確認しました。

### 3. 楽天ウォレット API 連携の実証 (Rakuten API Proof)
- **[完了] API 接続テストの成功**: 署名認証（HMAC生成）を伴うプライベート API (`get_balance`) にて、正常な応答（資産情報の取得）を確認。これにより、自動売買エンジンの「核」となる部分の動作が保証されました。

---
## 2026-04-04 作業ログ（自律型ニュース・トレードシステム V2 構築）

### 1. プロジェクトの再設計と実装 (News-Trade System Implementation)
- **[完了] 基盤構造の構築**: `rakuten-trading-bot-v2/` ディレクトリに、Cloud Run 運用向けのクリーンな設計（FastAPI）を実装しました。
- **[完了] 判断エンジンの実装**: 
    - `engine/news.py`: CoinDesk (JP/EN) および CoinPost からの RSS ニュース取得。
    - `engine/analysis.py`: OpenRouter (Gemini 1.5 Flash) による感情分析とスコアリング。
- **[完了] 安全・実行基盤の構築**:
    - `engine/safety.py`: スプレッド制限（2%）およびメンテナンス時間の回避。
    - `lib/rakuten_api.py`: 証拠金取引対応版の API クライアント。
    - `lib/firestore.py` & `lib/discord_util.py`: 状態永続化と通知基盤の統合。
- **[完了] デプロイ準備**: `Dockerfile` およびデプロイ手順書（`walkthrough.md`）の作成。


### 2. Painter Tax Assist の機能拡張 (Tax Assist Enhancements)
- **[完了] UI の刷新**: 「確定済みアイテム」の表示セクションを実装。CSV 書き出し前に内容を確認・レビューできるようにしました。
- **[完了] Google Drive 連携の親切設計**: 
    - `Receipts` フォルダがない場合に自動で作成するロジックを API に追加。
    - フォルダが見つからないエラーを回避し、スムーズな導入を可能にしました。

### 3. 人格・トーンの修正 (Persona Refinement)
- **[完了] 松尾芭蕉の削除と全体トーンの刷新**: 
    - `src/data/profiles.js` から松尾芭蕉を完全に削除。
    - 与謝野晶子を含む全キャラクターの口調を「現代的・知的・非ステレオタイプ」かつ「ジェンダーニュートラル」に調整しました。

---
## 2026-04-05 作業ログ（記憶復元プロトコル確立とV2ボット最適化）

### 1. 記憶復元プロトコル「思い出して」の創設 (Memory Persistence)
- **[完了] protocol-remember.md の新規作成**: フリーズ・再起動時に、過去の全ログ（`PLAN.md`, `PROGRESS_LOG.md`, `.checkpoint.json`）を自動スキャンし、目的と優先順位を最速で復元する手順を確立。
- **[完了] 実行プロトコルの更新**: `protocol-plan-act.md` に「思い出して」トリガーを追加し、いかなる場合もコンテキストの消失を防ぐ仕組みを「鉄の掟」として統合。

### 2. プロジェクト構造の整理とアーカイブ化 (Cleanup & Archiving)
- **[完了] archive_pending/ の作成**: ペンディング中の「株（MarketSpeed II連携）」関連と、古い V1 版のコードをこのフォルダへ整理。
    - `rakuten-trading-bot/` (V1), `trading_bot/` (旧Stock版), および各種ZIP/一時フォルダを疎退。
- **[完了] クリーンな環境の構築**: ルートディレクトリを整理し、現在の主力である V2 ボットの開発に集中できる状態にしました。

### 3. V2 ボット（仮想通貨）の徹底最適化 (V2 Optimization)
- **[完了] ニュース取得エンジンの堅牢化**: `engine/news.py` をリファクタリング。タイムアウト、ユーザーエージェント、リトライ処理を追加し、外部フィード取得の安定性を向上。
- **[完了] AI解析プロンプトの高度化**: `config/prompts.py` を更新し、市場のボラティリティやフェイクニュース、不確実性への考慮を AI に求めるプロフェッショナル仕様に変更。
- **[完了] 実行エンジンのリファクタリング**:
    - `lib/rakuten_api.py`: `requests.Session()` による接続再利用とリクエストの効率化。
    - `engine/trading.py` & `main.py`: 環境変数 (`DRY_RUN`, `TRADE_AMOUNT`) による動的な構成設定への移行。

### 4. Cloud Run 最低コスト最適化と新規エージェント設計 (Cost Optimization & New Agent)
- **[完了] 既存サービスのゼロ・コスト化設定**: `gcloud run services update` により、`itako-bridge` と `itako-news-trade` の `min-instances` を 0 に、`cpu-throttling` を有効化し、アイドル時の課金を完全にゼロにしました。
- **[保留] Artifact Registry の自動削除**: コマンド実行エラーのため、GUI（Google Cloud Console）からの設定方法をユーザーに案内することとしました。
- **[完了] ブラウザ操作（browser-use）エージェントの雛形作成**: `rakuten-browser-agent/agent.py` を作成し、Gemini 1.5 Flash と Cloud Scheduler を組み合わせた「短時間・超節約型」自動売買基盤と、Discord を使った 2FA（二段階認証）突破フローを設計しました。
- **[完了] 領収書解析 API のバグ修正**: `Receipts` フォルダがない場合の自動作成ロジックにおける `logger` 参照エラーを修正（`console.info`へ変更）。

---
## 次回への申し送り（随時更新）
- [ ] **【ユーザー作業】Artifact Registry のクリーンアップ設定**: Google Cloud Console にて、「古いイメージの自動削除」ルールを設定していただく。
- [ ] **株・自動売買の続き**: `rakuten-browser-agent/agent.py` をベースに実際の楽天証券ログイン・売買フローを実装する。
- [ ] **Painter Tax Assist の仕上げ**: ブラウザ上での動作確認と細部のUI調整。
- [x] **仮想通貨 (V2) ボットの本番テスト**: Secret Manager への API キー登録完了を確認済み。`DRY_RUN=False` での本番稼働が可能。

---
## AI運用ルール (Communication & Persistence)
- **プランニング第一主義 (Planning First Protocol)**: いかなる作業を開始・継続する前であっても、必ず最初に `PLAN.md`（ルート直下）を作成または更新する。 
- **「思い出して」トリガー**: 指示があった場合、直ちに `protocol-remember.md` に従い全ログをスキャンする。
- **指示の簡略化**: AIからユーザーへ作業を依頼する際は、「中学生でも分かるレベル」の言葉を使い、手順を箇条書きで分かりやすく伝える。
