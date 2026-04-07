# 🏯 Itako Trading Bot (楽天証券・ウォレット自動売買)

このプロジェクトは、楽天証券（かぶミニ）および楽天ウォレットを活用し、小資本（1万円〜）から「コツコツ」利益を積み上げるための自動売買システムです。

## 特徴
- **無料のシグナル判定**: `yfinance` および `ccxt` を使用し、外部Webhook（TradingView有料等）不要。
- **MFA（二要素認証）対応**: Discord通知を介して人間がスマホで認証を補助する「半自動モード」。
- **クラウド対応**: Playwright をヘッドレスモードで動作させ、Replit や GCP で 24時間稼働可能。

## セットアップ手順

どのPCからでも開発を再開できるように、以下の手順で環境を構築できます。

### 1. リポジトリのクローンと依存関係のインストール
```bash
git clone <あなたのGitHubリポジトリURL>
cd trading_bot
pip install -r requirements.txt
playwright install chromium
```

### 2. 環境変数（Secrets）の設定
プロジェクト直下に `.env` ファイルを作成し、以下の項目を入力してください（**Gitにはコミットしないでください**）。

```env
RAKUTEN_USER_ID=your_id
RAKUTEN_PASSWORD=your_password
RAKUTEN_TRADING_PASSWORD=your_trading_password
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
WEBHOOK_SECRET=your_secret_token
```

### 3. 実行
- **シグナル監視（メイン）**:
  ```bash
  python -m trading_bot.signal_engine
  ```
- **ダッシュボード（監視用）**:
  ```bash
  streamlit run trading_bot/dashboard.py
  ```

## 開発ルール
- 秘密情報（ID/PASS/パスワード/Session）は `.gitignore` により管理外としています。
- 新しいPCで開発する場合は、まず `.env` を手動で作成（または Replit の Secrets に入力）してください。
