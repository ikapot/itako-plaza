# Itako Plaza: Project Knowledge & Architecture Guide (秘伝の書)

この文書は、Itako Plaza の設計思想と技術構造を網羅したものです。
開発環境を移行したり、AIの会話コンテキストが途切れたりした際に、このファイルを読み込ませることで即座に「本来あるべき姿」を復元できます。

---

## 1. プロジェクトの魂 (Core Vision)
- **コンセプト**: 生写（Warhol風ポップアート）と近代文学者の魂との対話をアーカイブする、不穏で詩的なデジタル回廊。
- **デザインルール**: **Orange (#f15a24) & Black Only**. 
  - 灰色（Gray/Zinc）は一切許容しない。
  - 「オレンジの紙には黒い線、黒い紙にはオレンジの線」を徹底。
  - ガラスのような透明感（Glassmorphism）を基調とする。

## 2. 技術アーキテクチャ (Refactored Architecture)
巨大な `App.jsx` を解体し、関心の分離（Separation of Concerns）を以下の3構成で実現しています。

### カスタムフック (The Trinity Hooks)
1.  **useItakoAuth.js**: 認証、ユーザー状態（名前）、ブックマーク、およびクラウド同期（マージ）を担当。
2.  **useWorldState.js**: ニュース、トレンド、霊的エナジー（グローバル感情）など「世界の変動」を管理。
3.  **useSpiritualDialogue.js**: メッセージの送受信、ストリーミング、感情検知、および対話要約（Alaya）の生成を担当。

### 永続化レイヤー (Persistence Layer)
- **Firestore**: マスターデータ（Alaya, Bookmarks）。`uid` ごとに安全に分離。
- **LocalStorage**: キャッシュ用途。`itako_` プレフィックスを使用。
- **Auto-Sync**: ログイン時、ローカルの未保存データを自動的にクラウドへマージする機能を搭載。

## 3. 重要ファイルマップ
- `src/firebase.js`: クラウド通信の心臓部。セキュリティルール (`firestore.rules`) と対をなす。
- `src/index.css`: システム全体の配色と、スマホ向けのカスタムスクロールバー（オレンジ）を定義。
- `api/spiritual-echo`: Vercel 上で動く Gemini API Proxy。

## 4. 継続開発のためのコマンド
- **ビルド・プレビュー**: `npm run dev` / `vercel dev`
- **デプロイ**: `vercel --prod`
- **同期**: `git push origin main` (必ず `.agents/` フォルダを含めること)

---
*Created by Antigravity - 2026.03.30*
