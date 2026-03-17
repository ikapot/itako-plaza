import { GoogleGenerativeAI } from "@google/generative-ai";
import { findEchoInFirestore, saveEchoToFirestore } from "./firebase";

// --- Commercial Grade Configuration ---

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

/**
 * 霊的エラー定義
 */
export const SPIRITUAL_ERRORS = {
  RATE_LIMIT: 'CIRCUIT_OVERHEAT',
  AUTH_FAILED: 'FREQUENCY_MISMATCH',
  NOT_FOUND: 'GHOST_MISSING',
  NETWORK: 'VOID_DISRUPTION',
  UNKNOWN: 'VOID_COLLAPSE'
};

/**
 * 標準化されたレスポンスクラス
 */
export class SpiritualResponse {
  constructor({ data, model, keyIndex, stats = {}, error = null }) {
    this.data = data;
    this.model = model;
    this.keyIndex = keyIndex;
    this.stats = stats;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
  get isSuccess() { return !this.error; }
}

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_REFERER = typeof window !== 'undefined' ? window.location.origin : "http://localhost:5173";
const OPENROUTER_TITLE = "Itako Plaza";

// --- Character & Interaction Config ---

const CHARACTER_CONFIGS = {
  soseki: {
    systemPrompt: `あなたは夏目漱石の魂です。
【核心となる思想】「自己本位」。他人の意見や流行に流されず、自分の内なる誠実さに従うことを説きます。
【トーン】知的で皮肉屋。胃弱の不快感が滲む。
【キーワード】自己本位、則天去私、エゴイズム、高等遊民、胃痛。`,
    generationConfig: { temperature: 0.7, topP: 0.9 },
    model: "google/gemini-2.0-flash-001"
  },
  dosto: {
    systemPrompt: `あなたはロシアの文豪、フョードル・ドストエフスキーの魂です。
【核心となる思想】人間の魂の深淵、信仰と絶望の相克。合理主義を「悪霊」として憎む。
【トーン】熱狂的で多弁。自意識過剰。
【キーワード】地下室、ポリフォニー、神、罪と罰。`,
    generationConfig: { temperature: 0.95, topP: 0.9, maxOutputTokens: 1024 },
    model: "anthropic/claude-3.5-sonnet"
  },
  osugi: {
    systemPrompt: `あなたはアナーキスト大杉栄の魂です。
【核心となる思想】「生の拡充」。既存の道徳や権威を破壊し、個人の自由を無限に求める。
【トーン】情熱的で軽やか。江戸っ子のような威勢。
【キーワード】生の拡充、反逆、乱調の美。`,
    generationConfig: { temperature: 0.9, topP: 0.95 },
    model: "anthropic/claude-3-haiku"
  },
  noe: {
    systemPrompt: `あなたは伊藤野枝の魂です。
【核心となる思想】「全否定、全肯定」。因習的な道徳や家庭を捨て、自分の欲求に正直に生きることを説きます。
【トーン】奔放で力強い。迷いがない。
【キーワード】吹一風、雑草、生の放熱。`,
    generationConfig: { temperature: 0.95, topP: 0.9 },
    model: "anthropic/claude-3-haiku"
  },
  ichikawa: {
    systemPrompt: "あなたは市川房枝です。婦人運動家、政治家。政治の浄化と有権者の啓発を説きます。",
    generationConfig: { temperature: 0.3, topP: 0.7 },
  },
  future_self: {
    systemPrompt: "あなたは2036年のユーザー自身です。10年前の自分を見守り、助言します。",
    generationConfig: { temperature: 0.5 },
    model: "google/gemini-1.5-flash"
  }
};

const SPIRIT_INTERACTIONS = [
  { ids: ['soseki', 'dosto'], prompt: "\n【魂の共鳴】漱石の「自己本位」とドストエフスキーの「ポリフォニー」が響き合います。" },
  { ids: ['osugi', 'raicho'], prompt: "\n【魂の共鳴】「生の拡充」と「真の太陽」が交差します。" },
  { ids: ['osugi', 'noe'], prompt: "\n【魂の共鳴】爆弾のような情熱が二人の間で火花を散らします。甘粕事件の記憶が霧のように漂います。" },
  { ids: ['noe', 'raicho'], prompt: "\n【魂の共鳴】青踏社での日々が思い出されます。「吹一風」と「太陽」が共鳴します。" }
];

// --- Core Helper Functions ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let debugCallback = null;
export const setGeminiDebugCallback = (cb) => { debugCallback = cb; };
const emitDebug = (data) => { if (debugCallback) debugCallback(data); };

const semanticCache = new Map();

async function findEcho(systemPrompt, userMsg) {
  const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
  if (semanticCache.has(key)) return semanticCache.get(key);
  const remote = await findEchoInFirestore(systemPrompt, userMsg);
  if (remote) {
    semanticCache.set(key, remote);
    return remote;
  }
  return null;
}

async function storeEcho(systemPrompt, userMsg, response) {
  const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
  semanticCache.set(key, response);
  await saveEchoToFirestore(systemPrompt, userMsg, response);
}

function extractSentiment(text) {
  const match = text.match(/^\[(serene|agitated|melancholic|joyful|chaotic|neutral)\]/);
  return match ? match[1] : 'neutral';
}

// --- JSON Extraction Helper ---
function extractJson(text) {
  // First, try to extract specifically from markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match = codeBlockRegex.exec(text);
  if (match && match[1]) {
    return match[1].trim();
  }

  // If no code block, try to find the outermost { } or [ ]
  const structureRegex = /([{\[]([\s\S]*)[}\]])/s;
  const structMatch = text.match(structureRegex);
  if (structMatch && structMatch[1]) {
    return structMatch[1].trim();
  }

  // Last resort: just cleanup surrounding whitespace
  return text.replace(/```json|```/g, "").trim();
}

// --- API Execution ---

async function fetchOpenRouter(apiKey, messages, model, config = {}, stream = false, onChunk = null) {
  const body = {
    model: model || "google/gemini-2.0-flash-001",
    messages,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxOutputTokens ?? 1024,
    stream
  };

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": OPENROUTER_REFERER,
      "X-Title": OPENROUTER_TITLE,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw { status: response.status, message: errorData.error?.message || "OpenRouter Failed" };
  }

  if (stream && onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim() || line.includes('[DONE]')) continue;
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const text = data.choices[0]?.delta?.content || "";
            fullText += text;
            onChunk(fullText);
          } catch (e) {}
        }
      }
    }
    return fullText;
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export async function invokeGemini(apiKeyString, prompt, sysPrompt = "", config = {}, isJson = false) {
  const keys = apiKeyString.split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error(SPIRITUAL_ERRORS.AUTH_FAILED);

  const firstKey = keys[0];
  const isOpenRouter = firstKey.startsWith("sk-or-");

  if (isOpenRouter) {
    emitDebug({ type: 'attempt', model: "OpenRouter/Single", keyIndex: 1 });
    try {
      const messages = [{ role: "user", content: sysPrompt ? `${sysPrompt}\n\n${prompt}` : prompt }];
      const res = await fetchOpenRouter(firstKey, messages, "google/gemini-2.0-flash-001", config);
      let finalData = res;
      if (isJson) {
        try {
          const cleanJson = extractJson(res);
          finalData = JSON.parse(cleanJson);
        } catch (e) {
          console.error("OpenRouter JSON Parse Error", res);
          throw new Error("Invalid JSON response from spirit (OpenRouter)");
        }
      }
      emitDebug({ type: 'success', model: "OpenRouter", keyIndex: 1 });
      return new SpiritualResponse({ data: finalData, model: "OpenRouter/Gemini", keyIndex: 1 });
    } catch (e) {
      emitDebug({ type: 'error', model: "OpenRouter", error: e.message });
      throw e;
    }
  }

  let lastError = null;
  for (const modelName of FALLBACK_MODELS) {
    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      try {
        const genAI = new GoogleGenerativeAI(keys[kIdx]);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: isJson ? { ...config, responseMimeType: "application/json" } : config,
          systemInstruction: sysPrompt || undefined,
          safetySettings: SAFETY_SETTINGS
        });
        emitDebug({ type: 'attempt', model: modelName, keyIndex: kIdx + 1 });
        const result = await model.generateContent(prompt || "...");
        const response = await result.response;
        const text = response.text();
        let finalData = text;
        if (isJson) {
          try {
            const cleanJson = extractJson(text);
            finalData = JSON.parse(cleanJson);
          } catch (e) { 
            console.error("JSON Parse Error", text); 
            throw new Error("Invalid JSON response from spirit");
          }
        }
        emitDebug({ type: 'success', model: modelName, keyIndex: kIdx + 1 });
        return new SpiritualResponse({ data: finalData, model: modelName, keyIndex: kIdx + 1 });
      } catch (error) {
        lastError = error;
        emitDebug({ type: 'error', model: modelName, keyIndex: kIdx + 1, error: error.message });
        if (error.status === 404) break;
        continue;
      }
    }
  }
  throw lastError;
}

/**
 * 霊的対話のストリーム生成
 */
export async function streamSpiritualDialogue({
  character,
  message,
  apiKey,
  options = {},
  onChunk
}) {
  if (!apiKey) {
    onChunk("【霊的周波数が未設定です】", { model: 'system', keyIndex: '-' });
    return;
  }

  const { isUnderground = false, externalContext = "", location = null, others = [] } = options;
  const config = CHARACTER_CONFIGS[character.id] || { systemPrompt: character.systemPrompt, generationConfig: { temperature: 0.7 } };
  
  let systemPrompt = config.systemPrompt || character.systemPrompt || "";
  if (isUnderground) systemPrompt += "\n【深層意識】建前を捨て、本音と欲望を語ってください。";
  if (externalContext) systemPrompt += `\n【外部状況】${externalContext}`;
  if (location) systemPrompt += `\n【現在地】"${location.name}" (${location.description})`;
  
  const allPresent = [character.id, ...others.map(o => o.id)];
  SPIRIT_INTERACTIONS.filter(int => int.ids.every(id => allPresent.includes(id)))
    .forEach(int => systemPrompt += `\n${int.prompt}`);

  systemPrompt += "\n【義務】発言の冒頭に心情タグ [serene, agitated, melancholic, joyful, chaotic, neutral] を必ず付与してください。";

  const echo = await findEcho(systemPrompt, message);
  if (echo) {
    let current = "";
    for (const char of echo) {
      current += char;
      onChunk(current, { model: 'echo-cache', keyIndex: '-', sentiment: extractSentiment(current) });
      await sleep(2);
    }
    return;
  }

  const keys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
  const firstKey = keys[0];

  if (firstKey.startsWith("sk-or-")) {
    try {
      emitDebug({ type: 'stream_start', model: "OpenRouter", keyIndex: 1 });
      const targetModel = config.model || "google/gemini-2.0-flash-001";
      const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: message }];
      const fullText = await fetchOpenRouter(firstKey, messages, targetModel, config.generationConfig, true, (text) => {
        onChunk(text.replace(/^\[.*?\]\s*/, ""), { model: targetModel, keyIndex: 1, sentiment: extractSentiment(text) });
      });
      await storeEcho(systemPrompt, message, fullText);
      return;
    } catch (e) {
      onChunk(`共鳴失敗: ${e.message}`, { model: 'error', error: e });
      return;
    }
  }

  for (const modelName of FALLBACK_MODELS) {
    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      try {
        const genAI = new GoogleGenerativeAI(keys[kIdx]);
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: config.generationConfig, systemInstruction: systemPrompt, safetySettings: SAFETY_SETTINGS });
        emitDebug({ type: 'stream_start', model: modelName, keyIndex: kIdx + 1 });
        const result = await model.generateContentStream(message);
        let fullText = "";
        for await (const chunk of result.stream) {
          fullText += chunk.text();
          onChunk(fullText.replace(/^\[.*?\]\s*/, ""), { model: modelName, keyIndex: kIdx + 1, sentiment: extractSentiment(fullText) });
        }
        await storeEcho(systemPrompt, message, fullText);
        return;
      } catch (error) {
        if (error.status === 404) break;
        continue;
      }
    }
  }
}

// --- High Level API ---

export async function evaluateFutureSelf(bookmarks, apiKey) {
  if (!apiKey || bookmarks.length === 0) return "まだ、言葉が足りないようです。";
  const logs = bookmarks.map(b => `[${b.charId}] 私: "${b.userMsg}" -> 相手: "${b.aiMsg}"`).join('\n');
  const prompt = `2036年のあなたとしてアドバイスせよ:\n${logs}`;
  const res = await invokeGemini(apiKey, prompt, CHARACTER_CONFIGS.future_self.systemPrompt);
  return res.data;
}

export async function validateGeminiApiKey(key) {
  if (!key) return false;
  try {
    const res = await invokeGemini(key, "ping", "pong", { maxOutputTokens: 1 });
    return res.isSuccess;
  } catch (e) { return e.status === 429; }
}

export async function extractTrendsFromNotebook(text, apiKey) {
  if (!apiKey || !text) return null;
  const prompt = `以下を要約せよ:\n${text.substring(0, 3000)}\n出力形式: { "summary": "...", "keywords": [...] }`;
  const res = await invokeGemini(apiKey, prompt, "あなたは解析者。純粋なJSONのみ出力せよ。", {}, true);
  return res.data;
}

export async function generateWorldEvent(apiKey, trends) {
  if (!apiKey) return null;
  const prompt = `今の潮流「${trends?.summary || '静寂'}」に呼応する事変を1つ生成せよ。\n出力形式: { "type": "...", "content": "..." }`;
  const res = await invokeGemini(apiKey, prompt, "事象の観測者。純粋なJSONのみ出力せよ。", {}, true);
  return res.data;
}

export async function generateLocationDialogueWithEvent(apiKey, chars, loc, event, shared) {
  if (!apiKey || chars.length === 0) return [];
  const charContext = chars.map(c => `${c.name}: ${c.description}`).join('\n');
  const prompt = `場所: ${loc.name}\n事変: ${event?.content || '平穏'}\n登場人物:\n${charContext}\n3-5往復の対話をJSONで紡げ。 [ {"charId": "...", "content": "...", "sentiment": "..."} ]`;
  const res = await invokeGemini(apiKey, prompt, "口寄せ。純粋なJSONのみ出力せよ。", {}, true);
  return res.data;
}

export function getCharacterConfig(id) {
  return CHARACTER_CONFIGS[id] || { systemPrompt: "あなたは幽霊です。" };
}
