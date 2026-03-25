# 🎨 Itako Plaza Portrait Style Guide

このドキュメントは、イタコプラザの精神たちの肖像（アバター画像）を生成する際の**絶対的なルール**を定義したものです。AIアシスタントは、画像生成時（generate_image）に必ずこのルールを遵守してください。

## 🏛️ 基本原則
「低レベル」な汎用AI画像ではなく、**Andy Warholのシルクスクリーン手法**を真に理解した、芸術的なポップアートを追求してください。

## 📜 具体的ルール（最優先）

1. **参照資料の厳守**
   - 必ず対象人物の**日本語版Wikipedia（WikipediaJP）**にある画像を視覚的リファレンスとして使用してください。
   - 顔の造作、特徴的な衣装、髪型を忠実に再現すること。

2. **配色制限（3色）**
   - 使用するメインカラーは**厳密に3色**に限定してください。
     - 例：背景色、人物の影（インク）、ハイライトの3色。
     - 複雑なグラデーションは避け、フラットで力強い色面で構成してください。

3. **レイアウト（1枚完結）**
   - ウォーホルによく見られる「4分割（4枚並び）」の構成は**絶対に禁止**です。
   - キャンバスいっぱいに、**1枚のポートレートのみ**を配置してください。

4. **シルクスクリーンの質感表現**
   - 印刷の**「ズレ（Registration Misalignment）」**を意識的に表現してください。
     - インクの版が少しずれて、下地の色がはみ出したり、線が重なり合ったりする効果。
   - **インクのカスレやムラ**、版画特有のざらついたテクスチャを加えてください。
   - 高コントラストで、写真から版を起こしたような質感を徹底してください。

## 🚫 禁止事項
- 4分割レイアウト（グリッド表示）。
- 3色を超える多色使い。
- 現代的なデジタルイラスト風、アニメ風のタッチ。
- Wikipediaのリファレンスを無視した、AIの想像による顔の改変。

## 💡 生成時のプロンプト構築例
> `Warhol style silkscreen portrait of [Name], [3 colors: e.g. vibrant teal, charcoal black, lemon yellow], based on Japanese Wikipedia image, single image only, no split grid, high contrast, ink bleed and registration misalignment, vintage print texture, masterpiece quality.`
