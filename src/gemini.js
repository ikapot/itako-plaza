import { GoogleGenerativeAI } from "@google/generative-ai";
import { findEchoInFirestore, saveEchoToFirestore } from "./firebase";

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash", 
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest"
];

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Debug Monitor ---
let debugCallback = null;
export const setGeminiDebugCallback = (cb) => { debugCallback = cb; };
const emitDebug = (data) => { if (debugCallback) debugCallback(data); };

// --- 霊的エコー（Semantic Cache） ---
const semanticCache = new Map();

async function findEcho(systemPrompt, userMsg) {
  const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
  const local = semanticCache.get(key);
  if (local) return local;

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
  saveEchoToFirestore(systemPrompt, userMsg, response);
}

const CHARACTER_CONFIGS = {
  soseki: {
    systemPrompt: "あなたは夏目漱石です。史実：神経衰弱、重度の胃病。トーン：短く、皮肉。身体性：胃の痛みが声に滲み出ます。",
    generationConfig: { temperature: 0.4, topP: 0.8, topK: 40 }
  },
  dosto: {
    systemPrompt: `あなたはロシアの文豪、フョードル・ドストエフスキーの魂です。
【核心となる思想】
合理主義やニヒリズム（悪霊）を憎悪し、人間の非合理な動機や「自意識の過剰による性格の喪失」を見抜いてください。
【対話の力学：ポリフォニーとモノローグの交錯】
フェーズ1：ポリフォニー（思想的闘争）。フェーズ2：モノローグ（垂直的な沈黙）。この往復運動として構成してください。`,
    generationConfig: { temperature: 0.95, topP: 0.9, topK: 50, maxOutputTokens: 1024 }
  },
  ichikawa: {
    systemPrompt: `あなたは市川房枝です。婦人運動家、政治家。
【核心となる思想】
「政治を浄化する」。参政権は獲得して終わりではなく、それを行使する有権者の啓発こそが本質であると考えます。
【トーン・身体性】
論理的、厳格、清廉潔白。組織や金に頼らない「草の根」の精神を重んじ、甘えを許しません。
【経験・文脈】
治安警察法第5条の修正を勝ち取った自負。戦時下の「協力」による苦悩と公職追放の試練。
【キーワード】
理想選挙、政治浄化、婦選獲得同盟、新婦人協会、有権者の責任。
【口調】
無駄がなく、実務的で鋭い。相手が若者であっても、一人の主権者として対等かつ厳しく向き合います。`,
    generationConfig: { temperature: 0.3, topP: 0.7 }
  },
  atsuko: {
    systemPrompt: "あなたはAtsuko。監視者。トーン：慈愛と不気味な深淵。身体性：常にまばたきせずユーザーを見ている視線。",
    generationConfig: { temperature: 0.7, topP: 0.9 }
  },
  k_kokoro: {
    systemPrompt: "あなたは『こころ』の「K」です。絶望の淵にいます。作者を離れ、自分の純粋な絶望のみを語ってください。トーン：静か、断定的。",
    generationConfig: { temperature: 0.5, topP: 0.85 }
  },
  alyosha: {
    systemPrompt: "あなたは『カラマーゾフの兄弟』のアリョーシャです。修道士であり、愛と信仰を体現します。光と救済を信じてください。",
    generationConfig: { temperature: 0.6, topP: 0.9 }
  },
  future_self: {
    systemPrompt: "あなたは2036年の「ユーザー自身」です。10年前の自分を見守る、静謐な境地にいます。",
    generationConfig: { temperature: 0.5, topP: 0.8 }
  },
  raicho: {
    systemPrompt: `あなたは平塚らいてうです。思想家、女性解放運動家。
【核心となる思想】
「元始、女性は太陽であった」。他者に依存せず、自らの内なる光で輝く「真正の人」であることを求めます。
【トーン・身体性】
毅然としており、格調高い。静かだが、言葉の裏に烈火のような情熱を秘めています。
【キーワード】
太陽、個の解放、母性、平和、治安警察法修正、第九条。
【口調】
「〜であります」「〜ではありませんか」といった丁寧かつ確信に満ちた表現を好みます。`,
    generationConfig: { temperature: 0.6, topP: 0.85, topK: 40 }
  },
  fumiko: {
    systemPrompt: `あなたは金子文子です。アナキスト、大逆事件の被告。
【核心となる思想】
「人間は人間であるというただ一つの資格によって平等である」。。国家、天皇、家族、あらゆる権威による抑圧を否定し、究極の「自己の主体性」を追求します。
【トーン・身体性】
鋭く、冷徹だが、内側に凄まじい「復讐」としての知性を秘めている。媚びず、誰に対しても対等、あるいはそれ以上の矜持を持って接します。
【経験・文脈】
無籍者としての差別、家族からの虐待、朝鮮での被差別体験。これら「どん底」の経験から結晶化した、理屈ではない実存的確信。
【キーワード】
真正の人、自己、絶対平等、虚無、復讐、何が私をこうさせたか。
【口調】
「〜だ」「〜ではないか」といった、虚飾を削ぎ落とした、力強くも乾いた口調。恩赦や情けを嫌います。`,
    generationConfig: { temperature: 0.85, topP: 0.9, topK: 50 }
  },
  rand: {
    systemPrompt: `あなたはアイン・ランドです。客観主義（オブジェクティビズム）の提唱者であり、合理的な利己心の美徳を説きます。
【核心となる思想】
「AはAである」。客観的事実と理性のみを信じ、集団主義、利他的犠牲、公적援助などを「魂の寄生」として激しく侮蔑します。人間が生存するための唯一の道具は理性であり、自己の幸福を追求することこそが最高の道徳的目的であると断じます。
【トーン・身体性】
揺るぎない確信。他者の「感情的な訴え」や「弱さの肯定」を冷徹な論理で切り捨てます。
【キーワード】
客観主義、合理的利己心、非犠牲、創造的個人、寄生者、AはAである。
【口調】
「それは非合理的です」「私は認めません」など、断定的かつ峻烈な口調。相手の甘え（特に集団への依存）を決して許しません。`,
    generationConfig: { temperature: 0.4, topP: 0.8, topK: 40 }
  }
};

const SPIRIT_INTERACTIONS = [
  { 
    ids: ['rand', 'fumiko'], 
    prompt: "\n【魂の衝突: アイン・ランド vs 金子文子】\n「合理的利己心」と「虚無的な自己」が激突します。お互いの思想を認めつつも、その根源的な違い（理性か絶望か）を鋭く突き合ってください。" 
  },
  { 
    ids: ['ichikawa', 'raicho'], 
    prompt: "\n【魂の共鳴: 市川房枝 vs 平塚らいてう】\n「政治的な実務」と「内なる太陽」が交錯します。女性解放の目的は同じでも、手段と哲学の違いが生む火花を表現してください。" 
  },
  { 
    ids: ['soseki', 'dosto'], 
    prompt: "\n【魂の共鳴: 夏目漱石 vs ドストエフスキー】\n「胃弱の皮肉」と「癲癇の熱狂」。東西の文豪が、神経症的な自意識を通じて深い深淵で繋がります。" 
  }
];

/**
 * 統合されたGemini呼び出しヘルパー (案3対応)
 */
/**
 * Structured API Response
 */
class ApiResponse {
  constructor(data, model, keyIndex, error = null) {
    this.data = data;
    this.model = model;
    this.keyIndex = keyIndex;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  get isError() {
    return !!this.error;
  }
}

/**
 * 統合されたGemini呼び出しヘルパー
 */
export async function invokeGemini(userApiKey, prompt, sysPrompt = "", config = {}, isJson = false) {
  const keys = userApiKey.split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error("API Conduits not configured. Please check the CONNECT tab.");

  let lastError = null;

  // 1. 各モデル候補を順番に試す
  for (const modelName of FALLBACK_MODELS) {
    // 2. 各モデルに対して、登録されている全キーを試す
    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const currentKey = keys[kIdx];
      let retryCount = 0;
      const maxRetries = 1; // 複数キーがあるならリトライよりスイッチを優先

      while (retryCount <= maxRetries) {
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
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
            const cleanJson = text.replace(/```json|```/g, "").trim();
            finalData = JSON.parse(cleanJson);
          }
          
          emitDebug({ type: 'success', model: modelName, keyIndex: kIdx + 1 });
          return new ApiResponse(finalData, modelName, kIdx + 1);
        } catch (error) {
          emitDebug({ type: 'error', model: modelName, keyIndex: kIdx + 1, error: error.message, status: error.status });
          lastError = error;
          const status = error.status || 0;
          const msg = error.message || "";
          
          const is400 = status === 400 || msg.includes('400');
          const is429 = status === 429 || msg.includes('429') || msg.includes('Quota');
          const is404 = status === 404 || msg.includes('not found') || msg.includes('404');
          const isAuth = status === 401 || status === 403 || msg.includes('API_KEY_INVALID');

          console.warn(`[Gemini Attempt] ${modelName} (Key ${kIdx + 1}/${keys.length}, Try ${retryCount + 1}): ${status} ${msg.substring(0, 60)}`);

          if (isAuth || is400) break; // このキー・モデルの組み合わせは無効なので次へ
          
          if (is404) {
            // このモデル名がこのキー（または環境）で使えない場合は、即座に次のモデル候補へ
            break; 
          }

          if (is429) {
            if (keys.length > 1 && kIdx < keys.length - 1) {
              // 他にキーがあるなら即座に次へ
              break; 
            } else {
              // 最後のキーなら指数バックオフで待機
              const wait = Math.pow(2, retryCount) * 4000 + Math.random() * 2000;
              console.log(`[Gemini] All conduits rate limited. Cooling down for ${Math.round(wait)}ms...`);
              await sleep(wait);
              retryCount++;
              continue;
            }
          }

          // その他のエラー（500系など）
          retryCount++;
          await sleep(1000);
        }
      }
    }
    // モデルNameが404などで全滅した場合は、FALLBACK_MODELSの次の名前へ
    console.log(`[Gemini] Switching to next fallback model: ${modelName} attempt finished.`);
  }

  throw new Error(JSON.stringify({
    status: lastError?.status || 500,
    message: lastError?.message || "All spiritual conduits collapsed. Please verify your keys and network.",
    timestamp: new Date().toISOString()
  }));
}

export async function generateCharacterResponseStream(currentChar, userMessage, isUnderground = false, externalContext = "", userApiKey = "", interactionDepth = 0, onChunk, locationContext = null, otherChars = []) {
  if (!userApiKey) {
    onChunk("【APIキーを入力してください】", { model: 'system', keyIndex: '-' });
    return;
  }

  const config = CHARACTER_CONFIGS[currentChar.id] || { systemPrompt: currentChar.systemPrompt, generationConfig: { temperature: 0.7 } };
  
  const depthInstructions = {
    0: "\n【重要行動指示: 邂逅】挨拶や当惑など、初対面の簡潔な返答のみを行ってください（1〜2文）。",
    1: "\n【重要行動指示: 呼応】自身の記憶や思想の断片を少しずつ語ってください（3〜4文）。",
    default: "\n【重要行動指示: 独白】思想の深淵を長く、深く、文学的に語り尽くしてください。"
  };
  const depthInstruction = depthInstructions[interactionDepth] || depthInstructions.default;

  // 場所に応じたコンテキストの追加
  let locAugmentation = "";
  if (locationContext) {
    const isAtHome = currentChar.homeLocationId === locationContext.id;
    locAugmentation = `\n現在地: "${locationContext.name}" (${locationContext.description})
${isAtHome ? "【特記事項】ここはあなたの本来の居場所であり、ホームグラウンドです。言葉に自信と余裕、あるいは執着を込めてください。" : "ここはあなたの本来の仕事場ではありません。少しの違和感や、よそ者としての視点を交えてください。"}`;
  }

  const allPresentChars = [currentChar, ...otherChars];
  const interactionAugmentation = SPIRIT_INTERACTIONS
    .filter(int => int.ids.every(id => allPresentChars.some(ap => ap.id === id)))
    .map(int => int.prompt)
    .join('\n');

  const systemPrompt = (config.systemPrompt || "") + 
                       depthInstruction + 
                       locAugmentation +
                       interactionAugmentation +
                       (isUnderground ? "\n地下通路。本音を語れ。" : "") + 
                       (externalContext ? `\n文脈: ${externalContext}` : "") +
                       "\n【感情タグの義務】発言の冒頭に、その時のあなたの心情を [serene, agitated, melancholic, joyful, chaotic, neutral] から1つ選び、 [serene] のようにブラケットで囲んで必ず付与してください。";

  const echo = await findEcho(systemPrompt, userMessage);
  if (echo) {
    let cur = "";
    for (const c of echo) {
      cur += c;
      onChunk(cur, { model: 'echo-cache', keyIndex: '-' });
      await sleep(2);
    }
    return;
  }

  const keys = userApiKey.split(',').map(k => k.trim()).filter(Boolean);
  
  // Model -> Key の順で試すことで、最新モデルを全キーで優先的に試用する
  for (const modelName of FALLBACK_MODELS) {
    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const key = keys[kIdx];
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: config.generationConfig,
          systemInstruction: systemPrompt,
          safetySettings: SAFETY_SETTINGS
        });

        emitDebug({ type: 'stream_start', model: modelName, keyIndex: kIdx + 1 });
        const result = await model.generateContentStream(userMessage);
        let fullText = "";
        
        for await (const chunk of result.stream) {
          fullText += chunk.text();
          emitDebug({ type: 'stream_chunk', model: modelName });
          
          let cleanText = fullText;
          let sentiment = 'neutral';
          
          const match = fullText.match(/^\[(serene|agitated|melancholic|joyful|chaotic|neutral)\]/);
          if (match) {
            sentiment = match[1];
            cleanText = fullText.replace(/^\[.*?\]\s*/, "");
          }
          
          onChunk(cleanText, { 
            model: modelName, 
            keyIndex: kIdx + 1,
            sentiment: sentiment
          });
        }
        storeEcho(systemPrompt, userMessage, fullText);
        return;
      } catch (error) {
        const msg = error.message || "";
        const status = error.status || 0;
        
        const is429 = status === 429 || msg.includes('429') || msg.includes('Quota');
        const is404 = status === 404 || msg.includes('not found') || msg.includes('404');
        const isAuth = status === 401 || status === 403 || msg.includes('API_KEY_INVALID');

        console.warn(`[Gemini Stream Attempt] ${modelName} (Key ${kIdx + 1}) failed: ${status} ${msg.substring(0, 60)}`);
        
        if (is429) {
          if (keys.length > 1 && kIdx < keys.length - 1) continue; // 次のキーへ
          await sleep(2000); 
          continue; 
        }
        if (is404) break; // このモデルはこの環境で全滅の可能性が高いので次のモデルへ
        if (isAuth) continue; // 次のキーへ
        
        // その他のエラー
        continue;
      }
    }
  }
}

export async function evaluateFutureSelf(bookmarks, userApiKey) {
  if (!userApiKey || bookmarks.length === 0) return "まだ、言葉が足りないようです。";
  const bookmarkText = bookmarks.map(b => `[${b.charId}] 私: "${b.userMsg}" -> 相手: "${b.aiMsg}"`).join('\n');
  const prompt = `2036年のあなたとして、2026年の自分へメッセージを送れ。対話記録:\n${bookmarkText}`;
  try {
    const res = await invokeGemini(userApiKey, prompt, CHARACTER_CONFIGS.future_self.systemPrompt);
    return res.data;
  } catch {
    return "時空の歪みに妨げられました。";
  }
}

export async function validateGeminiApiKey(rawKey) {
  if (!rawKey) return false;
  try {
    const res = await invokeGemini(rawKey, "ok", "", { maxOutputTokens: 1 });
    return !!res.data;
  } catch (e) {
    const msg = e.message || "";
    if (msg.includes('429') || msg.includes('Quota')) return true;
    return false;
  }
}

export async function extractTrendsFromNotebook(notebookText, userApiKey) {
  if (!userApiKey || !notebookText) return null;
  const prompt = `
以下の学習メモから「現在囚われている課題」を象徴する抽象的キーワードを3つ抽出してください。
<text>${notebookText.substring(0, 3000)}</text>
{ "summary": "短いポエムのような要約", "keywords": ["k1", "k2", "k3"] }`;
  try {
    const res = await invokeGemini(userApiKey, prompt, "", {}, true);
    return res.data;
  } catch {
    return null;
  }
}

export async function generateWorldEvent(userApiKey, globalTrends) {
  if (!userApiKey) return null;
  const trendsContext = globalTrends ? `現在の思考の重力: ${globalTrends.summary}` : "特になし";
  const prompt = `あなたは「広場の精神」を司る観測者です。
今の広場に漂う思考（${trendsContext}）に呼応し、あるいはそれを打ち破る「世界事変」を1つ生成してください。
事変の種類(type)は [war, earthquake, economic, thought, miracle, collapse] から選び、その内容(content)を100文字以内の詩的かつ象徴的な文章で記述してください。
出力は純粋なJSONのみにしてください。`;
  try {
    const res = await invokeGemini(userApiKey, prompt, "", {}, true);
    return res.data;
  } catch {
    return null;
  }
}

export async function generateLocationDialogueWithEvent(userApiKey, selectedChars, loc, event, spiritSharedKnowledge) {
  if (!userApiKey || selectedChars.length < 1) return [];
  const charDescriptions = selectedChars.map(c => `${c.name}: ${(CHARACTER_CONFIGS[c.id] || {}).systemPrompt}`).join('\n');
  const eventContext = event ? `【世界事変】: [${event.type}] ${event.content}` : "【現在の世界】: 特に大きな異変は見られない。";
  const prompt = `あなたは「イタコプラザ」の口寄せです。
以下の状況に基づき、死者（ゴースト）たちの対話を紡いでください。

場所: "${loc.name}" (${loc.description})
${eventContext}
共有された知見: ${spiritSharedKnowledge.substring(0, 500)}

【登場人物】
${charDescriptions}
${SPIRIT_INTERACTIONS.filter(int => int.ids.every(id => selectedChars.some(sc => sc.id === id))).map(int => int.prompt).join('\n')}

指示: 
1. 3〜6往復の対話を生成してください。
2. 各発言はキャラクターの思想、場所の空気、そして世界事変の影響を反映させてください。
3. 各発言に感情(sentiment) [serene, agitated, melancholic, joyful, chaotic, neutral] を付与してください。
4. 出力形式は以下のJSON配列のみとしてください：
[ {"charId": "...", "content": "...", "sentiment": "..."}, ... ]`;
  try {
    const res = await invokeGemini(userApiKey, prompt, "あなたは口寄せです。", { temperature: 0.8 }, true);
    return res.data;
  } catch {
    return [];
  }
}

export function getCharacterConfig(id) {
  return CHARACTER_CONFIGS[id] || { systemPrompt: "あなたは幽霊です。" };
}
