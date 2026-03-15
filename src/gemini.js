import { GoogleGenerativeAI } from "@google/generative-ai";
import { findEchoInFirestore, saveEchoToFirestore } from "./firebase";

const FALLBACK_MODELS = [
  "gemini-2.0-flash", // ログで唯一反応（429）しているため最優先へ
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

/**
 * 統合されたGemini呼び出しヘルパー (案3対応)
 */
async function invokeGemini(userApiKey, prompt, sysPrompt = "", config = {}, isJson = false) {
  const keys = userApiKey.split(',').map(k => k.trim()).filter(Boolean);
  let lastError = null;

  for (const key of keys) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: config,
          systemInstruction: sysPrompt
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (isJson) {
          const cleanJson = text.replace(/```json|```/g, "").trim();
          return JSON.parse(cleanJson);
        }
        return text;
      } catch (error) {
        lastError = error;
        const msg = error.message || "";
        const isQuota = error.status === 429 || msg.includes('429');
        const isAuth = error.status === 401 || error.status === 403 || msg.includes('API_KEY_INVALID');
        
        console.warn(`[Gemini Attempt] ${modelName} failed: ${msg.substring(0, 60)}`);
        
        if (isAuth) break; // このキーは無効

        if (isQuota) {
          // 429の場合は少し待って、次のキー（あれば）に移るか、同じモデルでリトライするために少し待機
          await sleep(2000); 
          continue; 
        }
        // その他のエラー（404など）は次のモデルを試す
        continue;
      }
    }
  }
  throw lastError || new Error("All spiritual conduits collapsed.");
}

export async function generateCharacterResponseStream(currentChar, userMessage, isUnderground = false, externalContext = "", userApiKey = "", interactionDepth = 0, onChunk, locationContext = null) {
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

  const systemPrompt = (config.systemPrompt || "") + 
                       depthInstruction + 
                       locAugmentation +
                       (isUnderground ? "\n地下通路。本音を語れ。" : "") + 
                       (externalContext ? `\n文脈: ${externalContext}` : "");

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
  for (const key of keys) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: config.generationConfig,
          systemInstruction: systemPrompt
        });

        const result = await model.generateContentStream(userMessage);
        let fullText = "";
        for await (const chunk of result.stream) {
          fullText += chunk.text();
          onChunk(fullText, { model: modelName, keyIndex: keys.indexOf(key) + 1 });
        }
        storeEcho(systemPrompt, userMessage, fullText);
        return;
      } catch (error) {
        const msg = error.message || "";
        console.warn(`[Gemini Stream Attempt] ${modelName} failed: ${msg.substring(0, 60)}`);
        if (error.status === 429 || msg.includes('429')) {
          await sleep(1000);
          continue;
        }
        if (error.status === 401 || error.status === 403 || msg.includes('API_KEY_INVALID')) break;
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
    return await invokeGemini(userApiKey, prompt, CHARACTER_CONFIGS.future_self.systemPrompt);
  } catch {
    return "時空の歪みに妨げられました。";
  }
}

export async function validateGeminiApiKey(rawKey) {
  if (!rawKey) return false;
  try {
    const text = await invokeGemini(rawKey, "ok", "", { maxOutputTokens: 1 });
    return !!text;
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
    return await invokeGemini(userApiKey, prompt, "", {}, true);
  } catch {
    return null;
  }
}

export async function generateWorldEvent(userApiKey, globalTrends) {
  if (!userApiKey) return null;
  const trendsContext = globalTrends ? `現在の思考の重力: ${globalTrends.summary}` : "";
  const prompt = `世界を揺さぶる「世界事変」を1つ生成してください。テーマ: war, earthquake, economic, thought
${trendsContext}
{ "type": "...", "content": "100文字以内の詩的文章" }`;
  try {
    return await invokeGemini(userApiKey, prompt, "", {}, true);
  } catch {
    return null;
  }
}

export async function generateLocationDialogueWithEvent(userApiKey, selectedChars, loc, event, spiritSharedKnowledge) {
  if (!userApiKey || selectedChars.length < 1) return [];
  const charDescriptions = selectedChars.map(c => `${c.name}: ${(CHARACTER_CONFIGS[c.id] || {}).systemPrompt}`).join('\n');
  const eventContext = event ? `事変: [${event.type}] ${event.content}` : "事変なし";
  const prompt = `
場所: "${loc.name}" 説明: ${loc.description}
${eventContext} 共有知識: ${spiritSharedKnowledge.substring(0, 500)}
【登場人物】\n${charDescriptions}
指示: 3〜6往復の文学的対話を生成してください。
[ {"charId": "...", "content": "..."}, ... ]`;
  try {
    return await invokeGemini(userApiKey, prompt, "あなたは口寄せです。", { temperature: 0.8 }, true);
  } catch {
    return [];
  }
}

export function getCharacterConfig(id) {
  return CHARACTER_CONFIGS[id] || { systemPrompt: "あなたは幽霊です。" };
}
