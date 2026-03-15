import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isQuota = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota');
      if (isQuota && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}

export async function fetchFictionalizedNews(apiKey) {
  if (!apiKey) return [];

  const CACHE_KEY = 'itako_news_cache';
  const CACHE_TIME_KEY = 'itako_news_cache_time';
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();

  if (cachedData && cachedTime && (now - parseInt(cachedTime)) < 3600000) {
    return JSON.parse(cachedData);
  }

  const keys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
  const prompt = `
電脳の煉獄へ滴り落ちてきた「現代社会の歪み」を象徴する出来事を3つ挙げ、不穏で詩的なテキストとして出力してください。
[
  { 
    "id": 1, "title": "...", "content": "100文字程度", "original": "...",
    "discussion": [
      {"charId": "raicho", "comment": "..."},
      {"charId": "fumiko", "comment": "..."},
      {"charId": "soseki", "comment": "..."},
      {"charId": "dosto", "comment": "..."}
    ]
  }
]`;

  for (const key of keys) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await executeWithRetry(() => model.generateContent(prompt));
        const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
        const newsData = JSON.parse(jsonStr);
        
        newsData.forEach(n => n.meta = { model: modelName });
        localStorage.setItem(CACHE_KEY, JSON.stringify(newsData));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        return newsData;
      } catch (err) {
        if (err.status === 429 || err.message?.includes('429')) continue;
        break;
      }
    }
  }

  return [{ id: 1, title: "静かなる断絶", content: "沈黙だけが、今の我々に残された唯一の共通言語だ。", original: "Network Timeout" }];
}

export async function generateCharacterNewsComment(newsItem, charId, apiKey) {
  if (!apiKey) return "";
  const keys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
  const prompt = `あなたは「${charId}」の魂です。ニュース「${newsItem.title}」に対して、不気味な独白を述べてください。`;

  for (const key of keys) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch { continue; }
    }
  }
  return "沈黙。";
}
