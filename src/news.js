import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCX6vE8yK-S89L0M";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * リアルタイムニュースを取得し、柴田元幸トーンのフィクションに変換
 * (CORS回避のため、ここではGeminiに最新の概念を問うか、モックデータを使用)
 */
export const fetchFictionalizedNews = async () => {
    if (!apiKey) return [];

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // システムプロンプトで柴田元幸的な乾いたトーンを指定
        const prompt = `
      現在起こっている世界的なニュース（政治、事件、社会現象）を3つ挙げ、
      それを柴田元幸が翻訳した現代アメリカ文学のような「乾いた、微かに不穏で、象徴的なフィクション」に書き換えてください。
      
      例: 
      - トランプ → 「英雄を演じることに飽き足らない、金色の髪をした古い王」
      - 経済危機 → 「街中の銀行の扉が、音もなく一枚ずつ凍りついていく現象」
      
      出力は以下のJSON形式のみで行ってください:
      [
        { "id": 1, "title": "フィクション化されたタイトル", "content": "本文（100文字程度）", "original": "元のニュースの短い要約" }
      ]
    `;

        const result = await model.generateContent(prompt);
        const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("News Fetch Error:", error);
        return [
            { id: 1, title: "静かなる断絶", content: "誰もが言葉を失ったわけではない。ただ、話すべき相手がどこにも見当たらないのだ。", original: "通信障害のメタファー" }
        ];
    }
};

/**
 * 市川房枝による政治ニュースへの叱咤コメントを生成
 */
export const generateIchikawaScolding = async (newsItem) => {
    if (!apiKey) return "";

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.3 } // 厳格な論理
        });

        const prompt = `
      あなたは市川房枝です。以下のニュース（再構成されたもの）を読み、
      日本の主権者、あるいは政治の腐敗に対し、毅然とした態度で「叱り」のコメントを述べてください。
      言葉遣いは丁寧ですが、内容は一切の妥協を許さない厳格なものです。
      
      ニュース: "${newsItem.original} (${newsItem.title})"
      
      「一度きり」の厳しい言葉を返してください。
    `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return "政治が腐敗するのは、私たちが無関心だからです。目を離してはなりません。";
    }
};
