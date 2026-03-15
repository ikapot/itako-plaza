import { invokeGemini } from "./gemini";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  try {
    const newsData = await invokeGemini(apiKey, prompt, "あなたは電脳世界の口寄せです。", { temperature: 0.8 }, true);
    if (newsData && Array.isArray(newsData)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newsData));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());
      return newsData;
    }
  } catch (err) {
    console.warn("News generation failed", err);
  }

  return [{ id: 1, title: "静かなる断絶", content: "沈黙だけが、今の我々に残された唯一の共通言語だ。", original: "Network Timeout" }];
}

export async function generateCharacterNewsComment(newsItem, charId, apiKey) {
  if (!apiKey) return "";
  const prompt = `あなたは「${charId}」の魂です。ニュース「${newsItem.title}」に対して、不気味な独白を述べてください。`;

  try {
    return await invokeGemini(apiKey, prompt, "あなたは口寄せです。", { temperature: 0.9 });
  } catch {
    return "沈黙。";
  }
}
