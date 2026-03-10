import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro-002"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(operation, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const is429 = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('RESOURCE_EXHAUSTED');
            if (is429) {
                if (attempt === maxRetries - 1) throw error;
                const delayMs = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
                console.warn(`[Gemini News] Rate limited 429. Retrying in ${Math.round(delayMs)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                await sleep(delayMs);
                continue;
            }
            throw error;
        }
    }
}

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
<task>
現在起こっている世界的なニュース（政治、事件、社会現象）を3つ挙げ、それを柴田元幸が翻訳した現代アメリカ文学のような「乾いた、微かに不穏で、象徴的なフィクション」に書き換えてください。
</task>

<rules>
- 出力は必ず以下のJSON形式の配列のみを返してください。
- バッククォート(\`\`\`)などのマークダウン記号を含めないでください。
</rules>

<format>
[
  { "id": 1, "title": "フィクション化されたタイトル", "content": "本文（100文字程度）", "original": "元のニュースの短い要約" }
]
</format>
`;

            const result = await executeWithRetry(() => model.generateContent(prompt));
            const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
            const newsData = JSON.parse(jsonStr);

            console.log(`[Multi-Brain] News decrypted via: ${modelName}`);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newsData));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());

            return newsData;
        } catch (error) {
            const isQuotaExceeded = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota');
            const isNotFound = error.status === 404 || error.message?.includes('404') || error.message?.includes('not found');
            if (isQuotaExceeded || isNotFound) {
                console.warn(`[Multi-Brain] ${modelName} reached limit or not found. Shifting frequency...`);
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
                generationConfig: { temperature: 0.3 },
                systemInstruction: "あなたは市川房枝です。毅然とした態度で「叱り」のコメントを述べてください。"
            });

            const prompt = `以下のニュースに対して、社会の在り方を問うコメントを述べてください。\nニュース: "${newsItem.original}"`;

            const result = await executeWithRetry(() => model.generateContent(prompt));
            return result.response.text();
        } catch (error) {
            const isRateLimit = error.status === 429 || error.message?.includes('429');
            const isNotFound = error.status === 404 || error.message?.includes('404');
            if (isRateLimit || isNotFound) continue;
            return "政治が腐敗するのは、私たちの無関心ゆえです。";
        }
    }
    return "沈黙こそが最大の罪です。";
};
