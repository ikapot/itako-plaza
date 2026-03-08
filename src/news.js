import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b-latest"
];

export const fetchFictionalizedNews = async (apiKey) => {
    if (!apiKey) return [];

    // Cache logic
    const CACHE_KEY = 'itako_news_cache';
    const CACHE_TIME_KEY = 'itako_news_cache_time';
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cachedData && cachedTime && (now - parseInt(cachedTime)) < 3600000) {
        return JSON.parse(cachedData);
    }

    for (const modelName of FALLBACK_MODELS) {
        try {
            const sanitizedKey = apiKey.trim();
            const genAI = new GoogleGenerativeAI(sanitizedKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
          現在起こっている世界的なニュース（政治、事件、社会現象）を3つ挙げ、
          それを柴田元幸が翻訳した現代アメリカ文学のような「乾いた、微かに不穏で、象徴的なフィクション」に書き換えてください。
          
          出力は以下のJSON形式のみで行ってください:
          [
            { "id": 1, "title": "フィクション化されたタイトル", "content": "本文（100文字程度）", "original": "元のニュースの短い要約" }
          ]
        `;

            const result = await model.generateContent(prompt);
            const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
            const newsData = JSON.parse(jsonStr);

            console.log(`[Multi-Brain] News decrypted via: ${modelName}`);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newsData));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());

            return newsData;
        } catch (error) {
            const isQuotaExceeded = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota');
            if (isQuotaExceeded) {
                console.warn(`[Multi-Brain] ${modelName} reached limit. Shifting frequency...`);
                continue;
            }
            console.error("News Fetch Error:", error);
        }
    }
    return [{ id: 1, title: "静かなる断絶", content: "通信の深淵から。沈黙だけが、今の我々に残された唯一の共通言語だ。", original: "Network Timeout" }];
};

export const generateIchikawaScolding = async (newsItem, apiKey) => {
    if (!apiKey) return "";

    for (const modelName of FALLBACK_MODELS) {
        try {
            const sanitizedKey = apiKey.trim();
            const genAI = new GoogleGenerativeAI(sanitizedKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { temperature: 0.3 }
            });

            const prompt = `
          あなたは市川房枝です。以下のニュースを読み、
          毅然とした態度で「叱り」のコメントを述べてください。
          ニュース: "${newsItem.original}"
        `;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            if (error.status === 429 || error.message?.includes('429')) continue;
            return "政治が腐敗するのは、私たちの無関心ゆえです。";
        }
    }
    return "沈黙こそが最大の罪です。";
};
