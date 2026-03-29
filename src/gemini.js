import { auth, findEchoInFirestore, saveEchoToFirestore } from "./firebase";
import { CHARACTER_PROMPTS } from "./prompts";

// --- OpenRouter Protocol ---

const CHARACTER_CONFIGS = {
  // --- Face 0: 文豪列伝 ---
  soseki: { systemPrompt: CHARACTER_PROMPTS.soseki, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  ogai: { systemPrompt: CHARACTER_PROMPTS.ogai, generationConfig: { temperature: 0.4, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  akutagawa: { systemPrompt: CHARACTER_PROMPTS.akutagawa, generationConfig: { temperature: 0.9, topP: 0.9, maxOutputTokens: 1024 }, model: "google/gemma-3-27b-it:free" },
  dazai: { systemPrompt: CHARACTER_PROMPTS.dazai, generationConfig: { temperature: 0.95, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  mishima: { systemPrompt: CHARACTER_PROMPTS.mishima, generationConfig: { temperature: 0.9, topP: 0.95 }, model: "google/gemma-3-27b-it:free" },
  kawabata: { systemPrompt: CHARACTER_PROMPTS.kawabata, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  kafuka: { systemPrompt: CHARACTER_PROMPTS.kafuka, generationConfig: { temperature: 0.6, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  borges: { systemPrompt: CHARACTER_PROMPTS.borges, generationConfig: { temperature: 0.6, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  hyakken: { systemPrompt: CHARACTER_PROMPTS.hyakken, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  k_kokoro: { systemPrompt: CHARACTER_PROMPTS.k_kokoro, generationConfig: { temperature: 0.4, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  kropotkin: { systemPrompt: CHARACTER_PROMPTS.kropotkin, generationConfig: { temperature: 0.6, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  kobayashi: { systemPrompt: CHARACTER_PROMPTS.kobayashi, generationConfig: { temperature: 0.5, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  // --- Face 1: 闇の系譜 ---
  dosto: { systemPrompt: CHARACTER_PROMPTS.dosto, generationConfig: { temperature: 0.95, topP: 0.9, maxOutputTokens: 1024 }, model: "google/gemma-3-27b-it:free" },
  nietzsche: { systemPrompt: CHARACTER_PROMPTS.nietzsche, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  poe: { systemPrompt: CHARACTER_PROMPTS.poe, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  marquis: { systemPrompt: CHARACTER_PROMPTS.marquis, generationConfig: { temperature: 0.95, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  baudelaire: { systemPrompt: CHARACTER_PROMPTS.baudelaire, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  rimbaud: { systemPrompt: CHARACTER_PROMPTS.rimbaud, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  fumiko: { systemPrompt: CHARACTER_PROMPTS.fumiko, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  atsuko: { systemPrompt: CHARACTER_PROMPTS.atsuko, generationConfig: { temperature: 0.3, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  osugi: { systemPrompt: CHARACTER_PROMPTS.osugi, generationConfig: { temperature: 0.9, topP: 0.95 }, model: "google/gemma-3-27b-it:free" },
  bakunin: { systemPrompt: CHARACTER_PROMPTS.bakunin, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  // --- Face 2: 女性の先駆者 ---
  raicho: { systemPrompt: CHARACTER_PROMPTS.raicho, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  ichikawa: { systemPrompt: CHARACTER_PROMPTS.ichikawa, generationConfig: { temperature: 0.3, topP: 0.7 }, model: "google/gemma-3-27b-it:free" },
  noe: { systemPrompt: CHARACTER_PROMPTS.noe, generationConfig: { temperature: 0.95, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  curie: { systemPrompt: CHARACTER_PROMPTS.curie, generationConfig: { temperature: 0.3, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  woolf: { systemPrompt: CHARACTER_PROMPTS.woolf, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  beauvoir: { systemPrompt: CHARACTER_PROMPTS.beauvoir, generationConfig: { temperature: 0.5, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  nightingale: { systemPrompt: CHARACTER_PROMPTS.nightingale, generationConfig: { temperature: 0.3, topP: 0.7 }, model: "google/gemma-3-27b-it:free" },
  yosano: { systemPrompt: CHARACTER_PROMPTS.yosano, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  higuchi: { systemPrompt: CHARACTER_PROMPTS.higuchi, generationConfig: { temperature: 0.6, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  // --- Face 3: 西洋の魂 ---
  toynbee: { systemPrompt: CHARACTER_PROMPTS.toynbee, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  rand: { systemPrompt: CHARACTER_PROMPTS.rand, generationConfig: { temperature: 0.5, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  proudhon: { systemPrompt: CHARACTER_PROMPTS.proudhon, generationConfig: { temperature: 0.6, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  alyosha: { systemPrompt: CHARACTER_PROMPTS.alyosha, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  socrates: { systemPrompt: CHARACTER_PROMPTS.socrates, generationConfig: { temperature: 0.5, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  descartes: { systemPrompt: CHARACTER_PROMPTS.descartes, generationConfig: { temperature: 0.3, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  spinoza: { systemPrompt: CHARACTER_PROMPTS.spinoza, generationConfig: { temperature: 0.4, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  hegel: { systemPrompt: CHARACTER_PROMPTS.hegel, generationConfig: { temperature: 0.6, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  marx: { systemPrompt: CHARACTER_PROMPTS.marx, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  freud: { systemPrompt: CHARACTER_PROMPTS.freud, generationConfig: { temperature: 0.4, topP: 0.8 }, model: "google/gemma-3-27b-it:free" },
  wittgenstein: { systemPrompt: CHARACTER_PROMPTS.wittgenstein, generationConfig: { temperature: 0.8, topP: 0.7 }, model: "google/gemma-3-27b-it:free" },
  // --- Face 4: 芸術家・詩人 ---
  frankl: { systemPrompt: CHARACTER_PROMPTS.frankl, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  vangogh: { systemPrompt: CHARACTER_PROMPTS.vangogh, generationConfig: { temperature: 0.95, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  jack_london: { systemPrompt: CHARACTER_PROMPTS.jack_london, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  basho: { systemPrompt: CHARACTER_PROMPTS.basho, generationConfig: { temperature: 0.5, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  shakespeare: { systemPrompt: CHARACTER_PROMPTS.shakespeare, generationConfig: { temperature: 0.7, topP: 0.95 }, model: "google/gemma-3-27b-it:free" },
  beethoven: { systemPrompt: CHARACTER_PROMPTS.beethoven, generationConfig: { temperature: 0.9, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  chopin: { systemPrompt: CHARACTER_PROMPTS.chopin, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  rilke: { systemPrompt: CHARACTER_PROMPTS.rilke, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  orwell: { systemPrompt: CHARACTER_PROMPTS.orwell, generationConfig: { temperature: 0.5, topP: 0.85 }, model: "google/gemma-3-27b-it:free" },
  lu_xun: { systemPrompt: CHARACTER_PROMPTS.lu_xun, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemma-3-27b-it:free" },
  // --- Face 5: 歴史と宗教 ---
  khaldun: { systemPrompt: CHARACTER_PROMPTS.khaldun, generationConfig: { temperature: 0.6, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  arendt: { systemPrompt: CHARACTER_PROMPTS.arendt, generationConfig: { temperature: 0.4, topP: 0.8 }, model: "google/gemini-2.0-flash:free" },
  thucydides: { systemPrompt: CHARACTER_PROMPTS.thucydides, generationConfig: { temperature: 0.5, topP: 0.85 }, model: "google/gemini-2.0-flash:free" },
  dogen: { systemPrompt: CHARACTER_PROMPTS.dogen, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  orikuchi: { systemPrompt: CHARACTER_PROMPTS.orikuchi, generationConfig: { temperature: 0.7, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  ishimure: { systemPrompt: CHARACTER_PROMPTS.ishimure, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  shinran: { systemPrompt: CHARACTER_PROMPTS.shinran, generationConfig: { temperature: 0.3, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  itako_spirit: { systemPrompt: CHARACTER_PROMPTS.itako_spirit, generationConfig: { temperature: 0.8, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  nyarla: { systemPrompt: CHARACTER_PROMPTS.nyarla, generationConfig: { temperature: 1.0, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  shadow: { systemPrompt: CHARACTER_PROMPTS.shadow, generationConfig: { temperature: 0.9, topP: 0.8 }, model: "google/gemini-2.0-flash:free" },
  trickster: { systemPrompt: CHARACTER_PROMPTS.trickster, generationConfig: { temperature: 1.0, topP: 0.9 }, model: "google/gemini-2.0-flash:free" },
  narrator: { systemPrompt: CHARACTER_PROMPTS.narrator, generationConfig: { temperature: 0.4, topP: 0.9 }, model: "google/gemini-2.0-flash:free" }
};

export const OPENROUTER_MODELS = [
  { id: "auto", name: "Auto (Intelligent Routing - Free Preferred)" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash Exp (Stable & Free)" },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Reliable Free)" },
  { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B (Powerful Free)" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B (Classic Free)" },
];

const TASK_MODELS = {
  DIALOGUE: "google/gemini-2.0-flash:free",
  UTILITY: "google/gemini-2.0-flash:free",
  JSON: "google/gemini-2.0-flash:free",
  SUMMARY: "google/gemini-2.0-flash:free",
  CRITICAL: "google/gemini-2.0-flash:free",
  CHEAP: "google/gemini-2.0-flash:free"
};

const routeModel = (taskType, preferredModel) => {
  if (preferredModel && preferredModel !== 'auto') return preferredModel;
  return TASK_MODELS[taskType] || "google/gemini-2.0-flash:free";
};

let preferredOpenRouterModel = localStorage.getItem('itako_preferred_model') || "auto";

const semanticCache = new Map();

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
  PAYMENT_REQUIRED: 'ENERGY_DEPLETED',
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

const SPIRIT_ECHO_PREFIX = 'itako_echo_v3_';

/**
 * 過去の対話から「エコー（キャッシュ）」を検索する
 */
async function findSpiritualEcho(systemPrompt, userMsg) {
  const combined = `${systemPrompt}|${userMsg.trim()}`;
  const cacheKey = btoa(encodeURIComponent(combined)).slice(-64);
  
  if (semanticCache.has(cacheKey)) return semanticCache.get(cacheKey);

  const localCached = localStorage.getItem(SPIRIT_ECHO_PREFIX + cacheKey);
  if (localCached) {
    try {
      const { data, timestamp } = JSON.parse(localCached);
      if (Date.now() - timestamp < 604800000) { // 7 days
        semanticCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Ignore corrupted or old cache
    }
  }

  const firestoreEcho = await findEchoInFirestore(systemPrompt, userMsg);
  if (firestoreEcho) {
    semanticCache.set(cacheKey, firestoreEcho);
    localStorage.setItem(SPIRIT_ECHO_PREFIX + cacheKey, JSON.stringify({ data: firestoreEcho, timestamp: Date.now() }));
    return firestoreEcho;
  }
  
  return null;
}

async function storeEcho(systemPrompt, userMsg, response) {
  if (!response) return;
  const combined = `${systemPrompt}|${userMsg.trim()}`;
  const cacheKey = btoa(encodeURIComponent(combined)).slice(-64);
  const entry = { data: response, timestamp: Date.now() };
  
  semanticCache.set(cacheKey, response);
  localStorage.setItem(SPIRIT_ECHO_PREFIX + cacheKey, JSON.stringify(entry));
  await saveEchoToFirestore(systemPrompt, userMsg, response);
}

function extractSentiment(text) {
  const match = text.match(/^\[(serene|agitated|melancholic|joyful|chaotic|neutral)\]/);
  return match ? match[1] : 'neutral';
}

// --- JSON Extraction Helper ---
function extractJson(text) {
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match = codeBlockRegex.exec(text);
  if (match && match[1]) {
    return match[1].trim();
  }

  const structureRegex = /([{\[]([\s\S]*)[}\]])/s;
  const structMatch = text.match(structureRegex);
  if (structMatch && structMatch[1]) {
    return structMatch[1].trim();
  }

  return text.replace(/```json|```/g, "").trim();
}

// --- API Execution ---

const FALLBACK_FREE_MODELS = [
  "google/gemma-3-27b-it:free",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "stepfun/step-3.5-flash:free",
  "minimax/minimax-m2.5:free"
];

const PROXY_URL = import.meta.env.VITE_PROXY_URL || "https://us-central1-itako-plaza-kenji.cloudfunctions.net/streamChat";

/**
 * OpenRouterリクエストの実行（プロキシ対応・自動フォールバック機能付）
 */
async function fetchOpenRouter(apiKey, messages, model, config = {}, stream = false, onChunk = null) {
  let currentModel = model || FALLBACK_FREE_MODELS[0];
  const isFreeTarget = currentModel.endsWith(':free');

  let normalizedMessages = [...messages];
  const systemMsgIdx = normalizedMessages.findIndex(m => m.role === 'system');
  if (systemMsgIdx !== -1) {
    const systemContent = normalizedMessages[systemMsgIdx].content;
    normalizedMessages.splice(systemMsgIdx, 1);
    if (normalizedMessages.length > 0 && normalizedMessages[0].role === 'user') {
      normalizedMessages[0].content = `${systemContent}\n\n${normalizedMessages[0].content}`;
    } else {
      normalizedMessages.unshift({ role: 'user', content: systemContent });
    }
  }

  let retryCount = 0;
  const maxRetries = 10;

  while (retryCount <= maxRetries) {
    try {
      if (apiKey === 'PROXY_MODE') {
        const currentUser = auth.currentUser;
        if (!currentUser) throw { status: 401, code: SPIRITUAL_ERRORS.AUTH_FAILED, message: "Please login with Google." };
        
        const idToken = await currentUser.getIdToken(true);
        const payload = {
          model: currentModel,
          messages: normalizedMessages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxOutputTokens ?? 1000
        };

        const response = await fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
           const errText = await response.text();
           let errData = {}; try { errData = JSON.parse(errText); } catch(e) {}
           if (response.status === 502) throw { status: 502, message: "霊的回路が一時的に遮断されました。数秒後に再試行してください。" };
           if (response.status === 429 && retryCount < maxRetries) throw { status: 429 };
           throw { status: response.status, message: errData.error || errText || "Proxy error" };
        }
        return await handleOpenRouterStream(response, stream, onChunk);

      } else {
        if (!apiKey || !apiKey.startsWith('sk-or-v1-')) throw { status: 401, code: SPIRITUAL_ERRORS.AUTH_FAILED, message: "Invalid API Key." };

        const body = {
          model: currentModel,
          messages: normalizedMessages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxOutputTokens ?? 1024,
          top_p: config.topP ?? 0.9,
          stream: stream
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

        if (response.status === 429 && retryCount < maxRetries) throw { status: 429 };
        if (!response.ok) {
          const errText = await response.text();
          let errData = {}; try { errData = JSON.parse(errText); } catch(e) {}
          throw { status: response.status, message: errData.error?.message || errText || "Direct error" };
        }
        return await handleOpenRouterStream(response, stream, onChunk);
      }
    } catch (err) {
      if (err.status === 429 && retryCount < maxRetries) {
        let nextModel = currentModel;
        if (isFreeTarget) {
          const currentIndex = FALLBACK_FREE_MODELS.indexOf(currentModel);
          nextModel = FALLBACK_FREE_MODELS[(currentIndex + 1) % FALLBACK_FREE_MODELS.length];
        }
        const waitTime = Math.pow(2, retryCount) * 1000;
        currentModel = nextModel;
        await new Promise(r => setTimeout(r, waitTime));
        retryCount++;
        continue;
      }
      throw err;
    }
  }
}

async function handleOpenRouterStream(response, stream, onChunk) {
  if (!stream) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
  if (stream && onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
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
  return data.choices?.[0]?.message?.content || "";
}

export async function* generateDialogueStream({ charId, messages, systemOverride, apiKey }) {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    yield "【霊的周波数が未設定です】";
    return;
  }
  const charConfig = CHARACTER_CONFIGS[charId] || {};
  const targetModel = charConfig.model || routeModel('DIALOGUE', preferredOpenRouterModel);
  const baseSystem = systemOverride || charConfig.systemPrompt || "あなたは博識な司書です。";
  const forbiddenStyle = "\n【文体規定】感情を排した硬質な翻訳体（20世紀アメリカ現代文学の翻訳調）を徹底してください。";
  const worldLogic = "\n【空間の理】このイタコプラザは来訪者から3,650日後に沈黙する有限の空間です。連帯（アサビーヤ）は日ごとに減衰し、個の解体に向かっています。あなたはこの周期律を、淡々と、しかし決定的な真実として共有しています。";
  const systemPrompt = baseSystem + forbiddenStyle + worldLogic;
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];
  try {
    let fullText = "";
    await fetchOpenRouter(apiKey, fullMessages, targetModel, charConfig.generationConfig || {}, true, (text) => { fullText = text; });
    yield fullText;
  } catch (e) {
    yield `【霊的干渉が発生しました】${e.message || "通信エラー"}`;
  }
}

export async function invokeGemini(apiKey, prompt, sysPrompt = "", config = {}, isJson = false) {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') throw new Error(SPIRITUAL_ERRORS.AUTH_FAILED);
  const echo = await findSpiritualEcho(sysPrompt, prompt);
  if (echo) {
    let cachedData = echo;
    if (isJson) { try { cachedData = JSON.parse(extractJson(echo)); } catch (e) { /* fallback */ } }
    if (!(isJson && typeof cachedData === 'string')) {
       return new SpiritualResponse({ data: cachedData, model: 'echo-cache', keyIndex: '-' });
    }
  }
  const targetModel = routeModel(config.taskType || 'UTILITY', preferredOpenRouterModel);
  const messages = sysPrompt ? [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }] : [{ role: "user", content: prompt }];
  const res = await fetchOpenRouter(apiKey, messages, targetModel, { ...config, maxOutputTokens: config.maxOutputTokens || (config.taskType === 'JSON' ? 1024 : 512) });
  let finalData = res;
  if (isJson) { try { finalData = JSON.parse(extractJson(res)); } catch (e) { throw new Error(`Invalid JSON response (OpenRouter): ${res.substring(0, 100)}`); } }
  await storeEcho(sysPrompt, prompt, res);
  return new SpiritualResponse({ data: finalData, model: `OpenRouter/${targetModel.split('/').pop()}`, keyIndex: 1 });
}

function buildSystemPrompt({ character, options, others }) {
  const { isUnderground, externalContext, location, alaya, currentWorldEvent } = options;
  const config = CHARACTER_CONFIGS[character.id] || { systemPrompt: character.systemPrompt };
  let prompt = config.systemPrompt || character.systemPrompt || "";
  if (isUnderground) prompt += "\n【深層意識】建前を捨て、本音と欲望を語ってください。";
  if (externalContext) prompt += `\n【外部状況】${externalContext}`;
  if (location) prompt += `\n【現在地】"${location.name}" (${location.description})`;
  if (alaya) prompt += `\n【阿頼耶識（これまでのあらすじ）】${alaya}`;
  if (options.daysRemaining !== undefined) {
    const asabiyyah = Math.max(0.1, options.daysRemaining / 3650);
    const percentage = Math.floor(asabiyyah * 100);
    let cycleNote = `\n【空間の理（3,650日の周期律）】\nこのイタコプラザは、来訪者が足を踏み入れてから3,650日（10年）後に完全な沈黙に至る有限の空間です。現在、沈黙まで残り ${options.daysRemaining} 日。`;
    cycleNote += `\n連帯（アサビーヤ）の純度は ${percentage}% です。`;
    if (percentage > 80) cycleNote += " 魂の連帯はまだ色濃く、対話には熱量が残っています。";
    else if (percentage > 40) cycleNote += " 連帯の解体が始まり、個々の魂は緩やかに孤立へと向かっています。言葉に冷徹な静寂が混じり始めます。";
    else cycleNote += " 終焉への予兆。連帯はほぼ霧散し、純粋な個人主義と絶対的な沈黙の気配が支配しています。対話は極めて乾き、断絶を前提としたものになります。";
    prompt += cycleNote;
  }
  if (currentWorldEvent) {
    prompt += `\n【現在発生している狂気的「事変」】${currentWorldEvent.content}
※現在は歴史の周期において「混乱と再編」の時期にあります。トーンは感情を排した硬質な翻訳体を用い、事象を決定的な真実として記述してください。`;
  }
  const allPresentIds = [character.id, ...others.map(o => o.id)];
  SPIRIT_INTERACTIONS.forEach(interaction => {
    if (interaction.ids.every(id => allPresentIds.includes(id))) prompt += `\n${interaction.prompt}`;
  });
  prompt += "\n【義務】発言の冒頭に心情タグ [serene, agitated, melancholic, joyful, chaotic, neutral] を必ず付与してください。";
  prompt += "\n【文体規定】女性キャラクターであっても、「〜だわ」「〜なのよ」といったステレオタイプな「女言葉」は一切使用しないでください。知的で自立した、あるいは各々の歴史的背景に基づいた自然な口調（中性的・専門的・あるいは硬派な口調）を徹底してください。";
  return prompt;
}

export async function streamSpiritualDialogue({ character, message, apiKey, options = {}, onChunk }) {
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
      onChunk(streamingText.replace(/^\[.*?\]\s*/, ""), { model: 'echo-cache', keyIndex: '-', sentiment: extractSentiment(streamingText) });
      await sleep(2);
    }
    return;
  }
  const targetModel = charConfig.model || routeModel('DIALOGUE', preferredOpenRouterModel);
  try {
    emitDebug({ type: 'stream_start', model: "OpenRouter", keyIndex: 1 });
    const history = (options.historicalContext || []).filter(m => m.content !== message).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    const messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }];
    const fullText = await fetchOpenRouter(apiKey, messages, targetModel, charConfig.generationConfig || {}, true, (text) => {
      onChunk(text.replace(/^\[.*?\]\s*/, ""), { model: targetModel, keyIndex: 1, sentiment: extractSentiment(text) });
    });
    await storeEcho(systemPrompt, message, fullText);
    return;
  } catch (e) {
    throw { code: SPIRITUAL_ERRORS.OPENROUTER_ERROR, model: targetModel, originalError: e };
  }
}

export async function evaluateFutureSelf(bookmarks, apiKey) {
  if (!apiKey || bookmarks.length === 0) return "まだ、言葉が足りないようです。";
  const logs = bookmarks.map(b => `[${b.charId}] 私: "${b.userMsg}" -> 相手: "${b.aiMsg}"`).join('\n');
  const prompt = `2036年のあなたとしてアドバイスせよ:\n${logs}`;
  const res = await invokeGemini(apiKey, prompt, CHARACTER_PROMPTS.future_self || "あなたは2036年から来た自分です。", { taskType: 'CRITICAL' });
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
  const prompt = `以下を、乾いた翻訳調（硬質な散文）で要約せよ。感情を排し、事実と核心のみを抽出し、どこか不穏な残響を残すこと:\n${text.substring(0, 3000)}\n出力形式: { "summary": "...", "keywords": [...] }`;
  const res = await invokeGemini(apiKey, prompt, "あなたは解析者であり、同時に冷徹な記録者。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  return res.data;
}

export async function extractTrendsFromNews(newsArray, apiKey) {
  if (!apiKey || !newsArray || newsArray.length === 0) return null;
  const CACHE_KEY = 'itako_trends_cache';
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 10800000) return data;
    } catch(e) {}
  }
  const titles = newsArray.map(n => n.title).join('\n');
  const prompt = `以下のニュースから、現在の世界の「歪み」や「潮流」を抽出し、硬質で乾いた翻訳調（現代アメリカ小説のようなトーン）で不穏な要約を作成してください。個別の事件を追うのではなく、通底する空気感を描写すること。\n${titles}\n出力形式: { "summary": "...", "keywords": [...] }`;
  const res = await invokeGemini(apiKey, prompt, "歴史の観測者。感情を排した文体で事象を俯瞰せよ。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  if (res?.data) localStorage.setItem(CACHE_KEY, JSON.stringify({ data: res.data, timestamp: Date.now() }));
  return res?.data;
}

export async function generateWorldEvent(apiKey, trends) {
  if (!apiKey) return null;
  const CACHE_KEY = 'itako_world_event_cache';
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 10800000) return data;
    } catch {
      // Ignore parse error
    }
  }
  const prompt = `あなたは歴史と思想の潮流を観測するAIです。
以下のいずれかのカテゴリーからシナリオをランダムに選び、この世界で起こる「事変」として1つ生成してください。
暗い事件だけでなく、魂の救済や幸福な出来事も同じ頻度で発生します。

【カテゴリーA：混沌と狂気】
1. 甘粕事件のような、国家権力による思想家の弾圧や暗殺。
2. 群衆の暴走、流言飛語、理不尽な排斥や虐殺。
3. 破壊的な災害や、それに伴う都市のパニック。

【カテゴリーB：慈愛と新生】
1. 敵対していた者たちが和解し、深い愛で結ばれる。
2. 絶望の淵で新しい命（子）が誕生し、周囲に希望の光が差す。
3. 犯罪や過ちを犯そうとした者が、土際で踏みとどまり、善行へ転じる。
4. 長年の罪の赦し、あるいは原罪への償いと、それによる魂の悟り・解脱。

出力形式: { "type": "riot|massacre|assassination|love|birth|forgiveness|enlightenment", "content": "具体的な事象を、その場の空気感と共に描写する状況説明。トーンは硬質で乾いた翻訳体を用い、過剰な装飾を排して描写すること..." }`;
  const res = await invokeGemini(apiKey, prompt, "事象の観測者。かつてあったかもしれない、あるいはこれから起こる、乾いた現実を記述せよ。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  if (res?.data) localStorage.setItem(CACHE_KEY, JSON.stringify({ data: res.data, timestamp: Date.now() }));
  return res?.data;
}

export async function generateLocationDialogueWithEvent(apiKey, chars, loc, event, shared) {
  if (!apiKey || chars.length === 0) return [];
  const charContext = chars.map(c => `${c.name}: ${c.description}`).join('\n');
  const prompt = `場所: ${loc.name}\n現在発生している事変: ${event?.content || '平穏'}\n対象キャラクター:\n${charContext}

指示：
事変の激動の中に身を置き、歴史の必然や魂の救済を巡る短い3-5往復の「口寄せ（群像劇）」を生成してください。
指示された対象キャラクターたちが、それぞれの思想的背景（ハルドゥーンの歴史観、アーレントの政治分析、文豪たちの孤独など）に基づき、現在の状況について硬質・乾いた翻訳体で語り合います。
過剰な感嘆符や装飾を排し、事態を冷徹に記述してください。

出力形式 (JSON 配列):
[ {"charId": "対象キャラクターのID", "content": "発言内容。事実として状況や思想を記述する。", "sentiment": "serene|agitated|melancholic|joyful|chaotic|neutral"} ]`;
  const res = await invokeGemini(apiKey, prompt, "口寄せ。純粋なJSONのみ出力せよ。", { taskType: 'JSON' }, true);
  return res.data;
}

export async function distillSpiritualAlaya(messages, apiKey) {
  if (!apiKey || apiKey === '' || messages.length < 20) return null;
  const thread = messages.map(m => `[${m.charId}] ${m.userMsg ? '私: ' + m.userMsg : '相手: ' + m.aiMsg}`).join('\n');
  const lastThread = localStorage.getItem('itako_last_distilled_thread');
  if (lastThread === thread) return localStorage.getItem('itako_alaya');
  const prompt = `以下の魂の交流を、阿頼耶識（潜在意識の記憶）として150文字程度で要約せよ。これまでの関係性や重要な出来事を重点的に記すこと:\n\n${thread}`;
  try {
    const res = await invokeGemini(apiKey, prompt, "あなたは「阿頼耶識」の記録者。これまでの対話の核心のみを抽出せよ。", { taskType: 'SUMMARY', maxOutputTokens: 256 });
    if (res.isSuccess) {
       localStorage.setItem('itako_last_distilled_thread', thread);
       return res.data;
    }
  } catch {
    // Alaya distillation is optional
  }
  return null;
}

export async function detectSpiritIntervention(userMsg, apiKey) {
  if (!apiKey || userMsg.length < 10) return null;
  const prompt = `ユーザーのメッセージの内容を解析し、以下の4つのカテゴリー（宗教、歴史、思想、活動）のいずれかに強く関連するか判断してください。
関連があると判断した場合、最適と思われる「キャラクターID」を1つ選んでください。

【カテゴリーと関連キャラクター】
- 宗教: shinran (親鸞), dogen (道元)
- 歴史: khaldun (ハルドゥーン), thucydides (トゥキュディデス), toynbee (トインビー)
- 思想: arendt (アーレント), nietzsche (ニーチェ), socrates (ソクラテス), wittgenstein (ウィトゲンシュタイン)
- 活動: kropotkin (クロポトキン), fumiko (金子文子), raicho (平塚らいてう), osugi (大杉栄)

ユーザーメッセージ: "${userMsg}"

出力形式 (JSONのみ):
{ "isRelevant": true|false, "categoryId": "...", "charId": "...", "reason": "介入が必要な理由を15文字以内で記述" }`;
  try {
    const res = await invokeGemini(apiKey, prompt, "話題の審判者。事象の必然性を見極めよ。", { taskType: 'JSON' }, true);
    if (res?.data?.isRelevant) return res.data;
  } catch {
    // Ignore detection errors
  }
  return null;
}

export function getCharacterConfig(id) {
  return CHARACTER_CONFIGS[id] || { systemPrompt: "あなたは幽霊です。" };
}
