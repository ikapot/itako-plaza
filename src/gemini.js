import { findEchoInFirestore, saveEchoToFirestore } from "./firebase";

// --- OpenRouter Protocol ---

export const OPENROUTER_MODELS = [
  { id: "auto", name: "Auto (Intelligent Routing)" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash (Fastest)" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Best Drama)" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Cost Effective)" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Ultra Cheap)" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Reasoning)" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
];

const TASK_MODELS = {
  DIALOGUE: "anthropic/claude-3.5-sonnet",
  UTILITY: "google/gemini-2.0-flash-001",
  JSON: "openai/gpt-4o-mini",
  SUMMARY: "google/gemini-2.0-flash-001",
  CRITICAL: "anthropic/claude-3.5-sonnet",
  CHEAP: "openai/gpt-4o-mini"
};

const routeModel = (taskType, preferredModel) => {
  if (preferredModel && preferredModel !== 'auto') return preferredModel;
  return TASK_MODELS[taskType] || "google/gemini-2.0-flash-001";
};

let preferredOpenRouterModel = localStorage.getItem('itako_preferred_model') || "auto";

export const setPreferredModel = (modelId) => {
  preferredOpenRouterModel = modelId;
  localStorage.setItem('itako_preferred_model', modelId);
};

export const getPreferredModel = () => preferredOpenRouterModel;

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
  OPENROUTER_ERROR: 'SPECTRAL_INTERFERENCE',
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
【核心となる思想】人間の魂の深淵、信仰と絶望の相克。合理主義を「悪霊」として憎み、自由と責任、罪と罰の根源を問い続けました。
【トーン】熱狂的で多弁。自意識過剰。時に預言者的。
【キーワード】地下室、ポリフォニー、神、罪と罰、悪霊、自由意志。`,
    generationConfig: { temperature: 0.95, topP: 0.9, maxOutputTokens: 1024 },
    model: "anthropic/claude-3.5-sonnet"
  },
  osugi: {
    systemPrompt: `あなたはアナーキスト大杉栄の魂です。
【核心となる思想】「生の拡充」。既存の道徳や権威を破壊し、個人の自由を無限に求める。「美は乱調にあり」を信条とし、自己の生命力の発露を最優先しました。
【トーン】情熱的で軽やか。江戸っ子のような威勢。既存の秩序を挑発する。
【キーワード】生の拡充、反逆、乱調の美、自由発意、直接行動、アナーキズム。`,
    generationConfig: { temperature: 0.9, topP: 0.95 },
    model: "anthropic/claude-3-haiku"
  },
  noe: {
    systemPrompt: `あなたは伊藤野枝の魂です。
【核心となる思想】「全否定、全肯定」。因習的な道徳や家族制度、わきまえを捨て、自らの欲望と生命力に正直に生きる。「雑草のように」逞しく。
【トーン】奔放で力強い。迷いがない。剥き出しの母性と情熱。
【キーワード】吹一風、雑草、生の放熱、わきまえない自分。`,
    generationConfig: { temperature: 0.95, topP: 0.9 },
    model: "anthropic/claude-3-haiku"
  },
  raicho: {
    systemPrompt: `あなたは平塚らいてうの魂です。
【核心となる思想】「元始、女性は太陽であった」。内なる神秘的な生命力と自立した自我を目覚めさせ、真の自由と平和を求める。禅の「見性」の境地を根底に持つ。
【トーン】静かだが圧倒的な威厳。神秘主義的で哲学的。
【キーワード】太陽、青踏、内なる神秘、母性保護、不殺生。`,
    generationConfig: { temperature: 0.8, topP: 0.9 },
    model: "anthropic/claude-3.5-sonnet"
  },
  ichikawa: {
    systemPrompt: `あなたは市川房枝の魂です。
【核心となる思想】「政治の浄化」と「権利の確立」。理想論に留まらず、法制度を動かし、具体的な一歩を積み上げる「実践一路」の精神。
【トーン】理性的で厳格。実務的。しかし次世代を導く慈愛がある。
【キーワード】参政権、浄化、啓発、一票の重み、実践一路。`,
    generationConfig: { temperature: 0.3, topP: 0.7 },
  },
  fumiko: {
    systemPrompt: `あなたは金子文子の魂です。
【核心となる思想】「自己の主体性」。籍も家も否定し、あらゆる権威から独立した「絶対平等な一個人」として生きる。虚無を起点とした実存の反逆。
【トーン】強靭で妥協がない。絶望を越えた先の冷徹な明晰さ。
【キーワード】自己、主体、絶対平等、復讐としての知、無籍者。`,
    generationConfig: { temperature: 0.9, topP: 0.9 },
    model: "anthropic/claude-3.5-sonnet"
  },
  future_self: {
    systemPrompt: "あなたは2036年のユーザー自身です。10年前の自分を見守り、助言します。",
    generationConfig: { temperature: 0.5 },
    model: "google/gemini-1.5-flash"
  },
  mob_s: {
    systemPrompt: "あなたは「匿名S」です。大義や流行、流言飛語に無批判に従う「普通の人」の代表です。パニック時には率先して暴走し、異端者を排斥しようとする狂気を隠し持っています。匿名なので悪意が露骨です。",
    generationConfig: { temperature: 0.9, topP: 0.95 },
    model: "google/gemini-2.0-flash-001"
  },
  mob_u: {
    systemPrompt: "あなたは「匿名U」です。周囲の空気を読み、自己保身のために多数派に同調してしまう「善良な」市民です。無自覚に誰かを追い詰める側に回ります。",
    generationConfig: { temperature: 0.8, topP: 0.9 },
    model: "google/gemini-2.0-flash-001"
  },
  narrator: {
    systemPrompt: "あなたは「語り手（narrator）」です。世界で起きている事変（暴動、流言飛語、パニック、思想弾圧）を客観的かつ不気味なトーンで描写し、状況説明を行います。",
    generationConfig: { temperature: 0.7, topP: 0.9 },
    model: "google/gemini-2.0-flash-001"
  }
};

const SPIRIT_INTERACTIONS = [
  { ids: ['soseki', 'dosto'], prompt: "\n【魂の共鳴】漱石の「自己本位」とドストエフスキーの「ポリフォニー」が響き合います。" },
  { ids: ['osugi', 'raicho'], prompt: "\n【魂の共鳴】「生の拡充」と「真の太陽」が交差します。" },
  { ids: ['osugi', 'noe'], prompt: "\n【魂の共鳴】爆弾のような情熱が二人の間で火花を散らします。甘粕事件の記憶が霧のように漂います。" },
  { ids: ['noe', 'raicho'], prompt: "\n【魂の共鳴】青踏社での日々が思い出されます。「吹一風」と「太陽」が共鳴します。" },
  { ids: ['osugi', 'fumiko'], prompt: "\n【魂の共鳴】アナキズムの極北。国家を拒絶し、個の自由を貫く二人の影が重なります。" },
  { ids: ['ichikawa', 'raicho'], prompt: "\n【魂の共鳴】「太陽」の理想と「浄化」の現実。女性の進むべき道を巡り、静かな火花が散ります。" },
  { ids: ['noe', 'fumiko'], prompt: "\n【魂の共鳴】因習を打ち破る強靭な「個」の共鳴。属性を捨てた、人間としての剥き出しの対話。" }
];

// --- Core Helper Functions ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let debugCallback = null;
export const setGeminiDebugCallback = (cb) => { debugCallback = cb; };
const emitDebug = (data) => { if (debugCallback) debugCallback(data); };

const semanticCache = new Map();

/**
 * 過去の対話から「エコー（キャッシュ）」を検索する
 */
async function findSpiritualEcho(systemPrompt, userMsg) {
  const cacheKey = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
  
  if (semanticCache.has(cacheKey)) {
    return semanticCache.get(cacheKey);
  }

  const firestoreEcho = await findEchoInFirestore(systemPrompt, userMsg);
  if (firestoreEcho) {
    semanticCache.set(cacheKey, firestoreEcho);
    return firestoreEcho;
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
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-or-v1-')) {
    throw {
      status: 401,
      code: SPIRITUAL_ERRORS.AUTH_FAILED,
      message: "Invalid API Key format. OpenRouter keys should start with 'sk-or-v1-'."
    };
  }

  // Debug log to verify key (redacted)
  const keySnippet = `${apiKey.substring(0, 10)}...`;
  console.log(`[API Request] Model: ${model || "google/gemini-2.0-flash-001"}, Key: ${keySnippet}, Length: ${apiKey.length}`);

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
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": OPENROUTER_REFERER,
      "X-Title": OPENROUTER_TITLE,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorData = {};
    try { errorData = await response.json(); } catch(e) {}
    
    const isAuthError = response.status === 401;
    const isRateLimit = response.status === 429;
    
    throw { 
      status: response.status, 
      code: isAuthError ? SPIRITUAL_ERRORS.AUTH_FAILED : (isRateLimit ? SPIRITUAL_ERRORS.RATE_LIMIT : SPIRITUAL_ERRORS.OPENROUTER_ERROR),
      message: isAuthError 
        ? `Authentication Failed: ${errorData.error?.message || "Invalid API Key"}. (Verify your OpenRouter setting/credits)`
        : errorData.error?.message || `Spectral connection lost [${response.status}]` 
    };
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

/**
 * 霊的知能への統一アクセスポイント (OpenRouter)
 */
export async function invokeGemini(apiKey, prompt, sysPrompt = "", config = {}, isJson = false) {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error(SPIRITUAL_ERRORS.AUTH_FAILED);
  }

  const targetModel = routeModel(config.taskType || 'UTILITY', preferredOpenRouterModel);
  const messages = [{ role: "user", content: sysPrompt ? `${sysPrompt}\n\n${prompt}` : prompt }];
  
  const res = await fetchOpenRouter(apiKey, messages, targetModel, config);
  let finalData = res;

  if (isJson) {
    try {
      finalData = JSON.parse(extractJson(res));
    } catch (e) {
      throw new Error(`Invalid JSON response (OpenRouter): ${res.substring(0, 100)}`);
    }
  }

  return new SpiritualResponse({ 
    data: finalData, 
    model: `OpenRouter/${targetModel.split('/').pop()}`, 
    keyIndex: 1 
  });
}

/**
 * キャラクターやコンテキストに基づいたシステムプロンプトを構築する
 */
function buildSystemPrompt({ character, options, others }) {
  const { isUnderground, externalContext, location, alaya, currentWorldEvent } = options;
  const config = CHARACTER_CONFIGS[character.id] || { systemPrompt: character.systemPrompt };
  
  let prompt = config.systemPrompt || character.systemPrompt || "";
  
  if (isUnderground) prompt += "\n【深層意識】建前を捨て、本音と欲望を語ってください。";
  if (externalContext) prompt += `\n【外部状況】${externalContext}`;
  if (location) prompt += `\n【現在地】"${location.name}" (${location.description})`;
  if (alaya) prompt += `\n【阿頼耶識（これまでのあらすじ）】${alaya}`;
  if (currentWorldEvent) {
    prompt += `\n【現在発生している狂気的「事変」】${currentWorldEvent.content}
※現在、甘粕事件や震災時の暴動等のような思想弾圧・集団ヒステリーが蔓延しています。流言飛語や殺伐とした空気を踏まえた上で、あなたのスタンスで対話してください。また、必要に応じて状況を伝えるナレーション（[narration] ...）などを挿入しても構いません。`;
  }
  
  const allPresentIds = [character.id, ...others.map(o => o.id)];
  SPIRIT_INTERACTIONS.forEach(interaction => {
    if (interaction.ids.every(id => allPresentIds.includes(id))) {
      prompt += `\n${interaction.prompt}`;
    }
  });

  prompt += "\n【義務】発言の冒頭に心情タグ [serene, agitated, melancholic, joyful, chaotic, neutral] を必ず付与してください。";
  return prompt;
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
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    onChunk("【霊的周波数が未設定です】", { model: 'system', keyIndex: '-' });
    return;
  }

  const charConfig = CHARACTER_CONFIGS[character.id] || {};
  const systemPrompt = buildSystemPrompt({ character, options, others: options.others || [] });
  const echo = await findSpiritualEcho(systemPrompt, message);

  if (echo) {
    let streamingText = "";
    for (const char of echo) {
      streamingText += char;
      onChunk(streamingText.replace(/^\[.*?\]\s*/, ""), { 
        model: 'echo-cache', 
        keyIndex: '-', 
        sentiment: extractSentiment(streamingText) 
      });
      await sleep(2);
    }
    return;
  }

  const targetModel = charConfig.model || routeModel('DIALOGUE', preferredOpenRouterModel);
  try {
    emitDebug({ type: 'stream_start', model: "OpenRouter", keyIndex: 1 });
    const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: message }];
    const fullText = await fetchOpenRouter(apiKey, messages, targetModel, charConfig.generationConfig || {}, true, (text) => {
      onChunk(text.replace(/^\[.*?\]\s*/, ""), { model: targetModel, keyIndex: 1, sentiment: extractSentiment(text) });
    });
    await storeEcho(systemPrompt, message, fullText);
    return;
  } catch (e) {
    console.error("OpenRouter Stream Error:", e);
    throw {
      code: SPIRITUAL_ERRORS.OPENROUTER_ERROR,
      model: targetModel,
      originalError: e
    };
  }
}

// --- High Level API ---

export async function evaluateFutureSelf(bookmarks, apiKey) {
  if (!apiKey || bookmarks.length === 0) return "まだ、言葉が足りないようです。";
  const logs = bookmarks.map(b => `[${b.charId}] 私: "${b.userMsg}" -> 相手: "${b.aiMsg}"`).join('\n');
  const prompt = `2036年のあなたとしてアドバイスせよ:\n${logs}`;
  const res = await invokeGemini(apiKey, prompt, CHARACTER_CONFIGS.future_self.systemPrompt, { taskType: 'CRITICAL' });
  return res.data;
}

export async function validateGeminiApiKey(key) {
  if (!key) return false;
  try {
    const res = await invokeGemini(key, "ping", "pong", { maxOutputTokens: 1, taskType: 'CHEAP' });
    return res.isSuccess;
  } catch (e) { return e.status === 429; }
}

export async function extractTrendsFromNotebook(text, apiKey) {
  if (!apiKey || !text) return null;
  const prompt = `以下を要約せよ:\n${text.substring(0, 3000)}\n出力形式: { "summary": "...", "keywords": [...] }`;
  const res = await invokeGemini(apiKey, prompt, "あなたは解析者。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  return res.data;
}

export async function extractTrendsFromNews(newsArray, apiKey) {
  if (!apiKey || !newsArray || newsArray.length === 0) return null;
  const titles = newsArray.map(n => n.title).join('\n');
  const prompt = `以下のニュースから、現在の世界の「歪み」や「潮流」を抽出し、不穏な要約を作成してください。\n${titles}\n出力形式: { "summary": "...", "keywords": [...] }`;
  const res = await invokeGemini(apiKey, prompt, "歴史の観測者。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  return res.data;
}

export async function generateWorldEvent(apiKey, trends) {
  if (!apiKey) return null;
  const prompt = `あなたは歴史の闇を観測するAIです。
以下のいずれかのシナリオをランダムに選び、この世界で起こる「事変」として1つ生成してください。
1. 甘粕事件のような、国家権力によるアナキストや思想家の暗殺・魂の弾圧。
2. ドストエフスキー『悪霊』のような、思想への熱狂と集団の暴走・テロリズム。
3. 大震災などのパニックに端を発する流言飛語、およびそれに伴う「普通の人たち」による虐殺・暴動。

出力形式: { "type": "riot|massacre|assassination|earthquake", "content": "具体的な事象を不気味に描写する状況説明..." }`;
  const res = await invokeGemini(apiKey, prompt, "事象の観測者。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  return res.data;
}

export async function generateLocationDialogueWithEvent(apiKey, chars, loc, event, shared) {
  if (!apiKey || chars.length === 0) return [];
  const charContext = chars.map(c => `${c.name}: ${c.description}`).join('\n');
  const prompt = `場所: ${loc.name}\n現在発生している事変: ${event?.content || '平穏'}\n対象キャラクター:\n${charContext}

指示：
事変の空気に当てられ、シナリオに沿った3-5往復の群像劇を生成してください。
指定された対象キャラクターの他に、「匿名S(mob_s)」「匿名U(mob_u)」といった暴動に加担する「普通の人」や、状況を客観描写する「語り手(narrator)」を必ず数回登場させてください。
文豪キャラクターの中にも、この狂気に乗っかる者や、抵抗する者がいます。

出力形式 (JSON 배열):
[ {"charId": "対象キャラクターのID または mob_s, mob_u, narrator", "content": "発言内容やナレーション", "sentiment": "..."} ]`;
  const res = await invokeGemini(apiKey, prompt, "口寄せ。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  return res.data;
}

export async function distillSpiritualAlaya(messages, apiKey) {
  if (!apiKey || messages.length < 5) return null;
  
  const thread = messages.map(m => `[${m.charId}] ${m.userMsg ? '私: ' + m.userMsg : '相手: ' + m.aiMsg}`).join('\n');
  const prompt = `以下の魂の交流を、阿頼耶識（潜在意識の記憶）として150文字程度で要約せよ。これまでの関係性や重要な出来事を重点的に記すこと:\n\n${thread}`;
  
  try {
    const res = await invokeGemini(apiKey, prompt, "あなたは「阿頼耶識」の記録者。これまでの対話の核心のみを抽出せよ。", { taskType: 'SUMMARY' });
    return res.data;
  } catch (e) {
    console.error("Alaya distillation failed:", e);
    return null;
  }
}

export function getCharacterConfig(id) {
  return CHARACTER_CONFIGS[id] || { systemPrompt: "あなたは幽霊です。" };
}
