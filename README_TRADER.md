# 🗺️ Itako Trader System Map

このファイルは、本クオンツシステムの「どこに何があるか」を瞬時に把握するための地図です。

## 🏹 1. ボットの心臓部 (Core Logic)
| コンポーネント | パス | 役割 |
| :--- | :--- | :--- |
| **楽天通信部** | `advanced-trader/lib/rakuten_api.py` | 楽天ウォレットとの現物API通信を担当。署名・認証ロジック。 |
| **取引実行エンジン** | `advanced-trader/bot.py` | EMA20/ATRベースの売買判定、資金管理、Gist連携。 |
| **戦略モジュール** | `advanced-trader/lib/engine.py` | RSIやATRなどの詳細なテクニカル計算ロジック。 |

## ⚙️ 2. 自動化とインフラ (Automation)
| コンポーネント | パス | 役割 |
| :--- | :--- | :--- |
| **24/7 自動実行** | `.github/workflows/quants-trader.yml` | GitHub Actions で 15分おきにボットを叩く設定。 |
| **ターミナルUI** | `public/trade/index.html` | `/trade/` で見れる専用監視用ターミナルサイト。 |
| **ダッシュボード** | `src/components/TradingDashboard.jsx` | メインの Vercel サイトに統合された取引画面。 |

## 🔑 3. 認証情報の管理 (Security)
*   **ローカル開発**: `.env.production` に記載。
*   **クラウド稼働**: GitHub リポジトリの `Settings > Secrets` に以下の名前で登録済み：
    *   `WALLET_API_KEY` / `WALLET_API_SECRET` / `RAKUTEN_API_ID`
    *   `DISCORD_WEBHOOK_URL` / `GITHUB_PAT_GIST` / `GIST_ID`

## 📊 4. 外部連携 (External)
*   **ポジション永続化**: [GitHub Gist](https://gist.github.com/ikapot/2f5030d55ca6d0b9be1456ceab9a80991)
    *   ボットが「今持っているか」を記録するクラウドメモ。
*   **通知先**: Discord Webhook 
    *   売買発生時にリアルタイムであなたのスマホへ通知。

---
*Last Updated: 2026-04-08 (by Antigravity)*
