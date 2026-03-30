# ITKO_SYS_PULSE

AIのフリーズ・再起動時に、直前の意図と文脈を復旧するための「短期記憶」領域。

## LAST_PULSE: 2026-03-30 09:10 (JST)
- **[STATUS]**: 開発健全化（整理整頓）とデータの堅牢化（A+C）を完了。
- **[LAST]**: 
    - ルートディレクトリのクリーンアップ（ログやスクリプトを .archive/ へ移動）
    - App.jsx の Hook 化リファクタリング（useItakoAuth, useWorldState, useSpiritualDialogue）
    - Firestore による対話要約（Alaya）の永続化実装
- **[NEXT]**: 
    - デザインの深化（背景演出やカウントダウンの連動）への検討準備。
    - サブプロジェクト（Painter Tax Assist）の進捗確認。
- **[CONTEXT]**: 
    - コードベースが軽量化 (`App.jsx` 約780行 → 約200行)
    - Alaya がデバイスを跨いで同期可能に。
- **[NOTE]**: このファイルは最新の「鼓動」のみを保持し、AIの意識を常に最新の状態に引き止めること。
