import { invokeGemini } from "./gemini";

const CACHE_KEY = 'itako_news_cache';
const CACHE_TIME_KEY = 'itako_news_cache_time';
const CACHE_EXPIRY_MS = 3600000;

function isCacheValid(now) {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  if (!cachedData || !cachedTime) return false;
  return (now - parseInt(cachedTime)) < CACHE_EXPIRY_MS;
}

function updateCache(data, timestamp) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIME_KEY, timestamp.toString());
}

export async function fetchFictionalizedNews(apiKey) {
  if (!apiKey) return [];

  const now = Date.now();
  if (isCacheValid(now)) {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
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
    const res = await invokeGemini(apiKey, prompt, "あなたは電脳世界の口寄せです。", { temperature: 0.8 }, true);
    const newsData = res.data;
    if (newsData && Array.isArray(newsData)) {
      updateCache(newsData, now);
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
    const res = await invokeGemini(apiKey, prompt, "あなたは口寄せです。", { temperature: 0.9 });
    return res.data;
  } catch {
    return "沈黙。";
  }
}
