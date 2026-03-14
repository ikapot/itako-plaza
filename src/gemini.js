import { GoogleGenerativeAI } from "@google/generative-ai";
import { findEchoInFirestore, saveEchoToFirestore } from "./firebase";

const FALLBACK_MODELS = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 霊的エコー（Semantic Cache）の簡易実装 ---
const semanticCache = new Map();

const findEcho = async (systemPrompt, userMsg) => {
    // 1. メモリキャッシュをチェック
    const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
    const local = semanticCache.get(key);
    if (local) return local;

    // 2. Firestoreをチェック（霊的回路の深層）
    const remote = await findEchoInFirestore(systemPrompt, userMsg);
    if (remote) {
        semanticCache.set(key, remote); // 次回のためにメモリに上げる
        return remote;
    }
    return null;
};

const storeEcho = async (systemPrompt, userMsg, response) => {
    const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
    semanticCache.set(key, response);
    // Firestoreへ非同期で永続化
    saveEchoToFirestore(systemPrompt, userMsg, response);
};


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
    }
};

/**
 * APIキーのスイッチングを伴うストリーム生成 (案3 + 案1)
 */
export const generateCharacterResponseStream = async (char, userMessage, isUnderground = false, externalContext = "", userApiKey = "", interactionDepth = 0, onChunk) => {
    if (!userApiKey) {
        onChunk("【設定からGemini APIキーを入力してください】", { model: 'system', keyIndex: '-' });
        return;
    }

    const config = CHARACTER_CONFIGS[char.id] || { systemPrompt: char.systemPrompt, generationConfig: { temperature: 0.7 } };
    
    // 対話の深さに応じた動的な振る舞い指示
    let depthInstruction = "";
    if (interactionDepth === 0) {
        depthInstruction = "\n【重要行動指示: 邂逅】これは会話の始まりです。極めて短く（1〜2文程度）、挨拶や当惑、冷たい反応など、初対面の距離感を感じさせる簡潔な返答のみを行ってください。自分からはまだ多くを語らないでください。";
    } else if (interactionDepth === 1) {
        depthInstruction = "\n【重要行動指示: 呼応】相手との対話が少し進みました。相手の言葉に反応し、自身の記憶や思想の断片を少しずつ語り始めてください。（3〜4文程度）";
    } else {
        depthInstruction = "\n【重要行動指示: 独白と憑依】相手との精神的な繋がりが深まりました。堰を切ったように、自身の深い思想、記憶の深淵、または与えられた文脈（著作の断片など）を絡めながら、長く、深く、文学的に語り尽くしてください。";
    }

    const systemPrompt = (config.systemPrompt || "") + depthInstruction + (isUnderground ? "\n地下通路。本音を語れ。" : "") + (externalContext ? `\n文脈: ${externalContext}` : "");

    // 案1: 霊的エコー
    const echo = await findEcho(systemPrompt, userMessage);
    if (echo) {
        console.log("[Echo] Spiritual resonance detected.");
        let cur = "";
        for (const c of echo) {
            cur += c;
            onChunk(cur, { model: 'echo-cache', keyIndex: '-' });
            await sleep(2); // キャッシュ時は少し速めに再生
        }
        return;
    }

    // 案3: 多重霊路 (カンマ区切りの複数キーに対応)
    const keys = userApiKey.split(',').map(k => k.trim()).filter(k => k);

    for (const currentKey of keys) {
        let lastError = null;
        for (const modelName of FALLBACK_MODELS) {
            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: config.generationConfig,
                    systemInstruction: systemPrompt
                });

                const result = await model.generateContentStream(userMessage);
                let fullText = "";
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    onChunk(fullText, { model: modelName, keyIndex: keys.indexOf(currentKey) + 1 });
                }
                storeEcho(systemPrompt, userMessage, fullText);
                return; // 成功
            } catch (error) {
                lastError = error;
                const is429 = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('exhausted');
                if (is429) {
                    console.warn(`[Key Switch] Model ${modelName} exhausted on current key.`);
                    continue; // 次のモデルを試す
                }
                break; // 致命的なエラー
            }
        }
        // 現在のキーの全モデルが429なら次のキーへ
        if (keys.indexOf(currentKey) < keys.length - 1) {
            console.warn("[Key Switch] Current key fully exhausted. Switching to NEXT key...");
            continue;
        }
        // 全キー全滅
        console.error("All keys exhausted:", lastError);
        const isQuotaExhausted = lastError?.status === 429 || lastError?.message?.includes('429') || lastError?.message?.includes('Quota') || lastError?.message?.includes('exhausted');

        if (isQuotaExhausted) {
            onChunk("【霊的回路の制限】全ての鍵（APIキー）の交信回数が上限に達しました。しばらく待つか、設定から予備の鍵を追加してください。", { model: 'system', keyIndex: '-' });
        } else {
            onChunk("魂が沈黙しました。深淵との接続が不安定なようです。APIキーが正しいか、ネットワーク設定を確認してください。", { model: 'system', keyIndex: '-' });
        }
    }
};

/**
 * 2036年の自分による批評 (案3対応)
 */
export const evaluateFutureSelf = async (bookmarks, userApiKey) => {
    if (!userApiKey || bookmarks.length === 0) return "まだ、未来へ届く言葉が足りないようです。";
    const keys = userApiKey.split(',').map(k => k.trim()).filter(k => k);
    const bookmarkText = bookmarks.map(b => `[${b.charId}] 私: "${b.userMsg}" -> 相手: "${b.aiMsg}"`).join('\n');
    const prompt = `2036年のあなたとして、2026年の自分へメッセージを送れ。対話記録:\n${bookmarkText}`;

    for (const k of keys) {
        for (const m of FALLBACK_MODELS) {
            try {
                const genAI = new GoogleGenerativeAI(k);
                const model = genAI.getGenerativeModel({ model: m, systemInstruction: CHARACTER_CONFIGS.future_self.systemPrompt });
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (e) {
                console.warn(`Future self eval failed using key ${k} / model ${m}`, e);
            }
        }
    }
    return "時空の歪みに妨げられました。";
};

/**
 * APIキーの検証
 */
export const validateGeminiApiKey = async (rawKey) => {
    if (!rawKey) return false;
    const firstKey = rawKey.split(',')[0].trim();
    try {
        const genAI = new GoogleGenerativeAI(firstKey);
        // 接続確認のため、最新モデルを優先的に試行
        const modelsToTry = ["gemini-3-flash-preview", "gemini-2.5-flash"];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // 最小限のリクエストで生存確認
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: "ok" }] }],
                    generationConfig: { maxOutputTokens: 1 }
                });
                if (result.response) return true;
            } catch (e) {
                const errorText = e.message || "";
                const status = e.status;

                // 429 (Rate Limit) や Quota エラーが出るということは、キー自体は認証を通っている（有効）
                if (status === 429 || errorText.includes('429') || errorText.includes('Quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
                    console.warn(`[API Validation] Key is valid but rate limited: ${modelName}`);
                    return true;
                }

                // 404 (Not Found) の場合はモデル名が正しくないだけの可能性があるので次を試す
                if (status === 404 || errorText.includes('404')) {
                    console.warn(`[API Validation] Model ${modelName} not found, trying next...`);
                    continue;
                }

                // 401 (Unauthorized) や 403 (Forbidden) は無効なキー
                if (status === 401 || status === 403 || errorText.includes('401') || errorText.includes('403') || errorText.includes('invalid')) {
                    return false;
                }

                // その他のエラーも一旦次を試すか、ループ終了後に false を返す
            }
        }
        return false;
    } catch (e) {
        console.error("API Key Validation Error Details:", e);
        return false;
    }
};

/**
 * 自律増殖
 */
export const evaluateExpansion = async (context, userApiKey) => {
    if (!userApiKey) return null;
    const keys = userApiKey.split(',').map(k => k.trim()).filter(k => k);
    const prompt = `以下の対話から新たな人物か場所を提案せよ。JSONのみ出力。\n${context}`;

    for (const k of keys) {
        try {
            const genAI = new GoogleGenerativeAI(k);
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
            const result = await model.generateContent(prompt);
            return JSON.parse(result.response.text().replace(/```json|```/g, ""));
        } catch { continue; }
    }
    return null;
};

/**
 * 場所対話
 */
export const generateLocationDialogue = async (c1, c2, loc, userApiKey) => {
    if (!userApiKey) return [];
    const keys = userApiKey.split(',').map(k => k.trim()).filter(k => k);

    const config1 = CHARACTER_CONFIGS[c1.id] || { systemPrompt: "" };
    const config2 = CHARACTER_CONFIGS[c2.id] || { systemPrompt: "" };

    const prompt = `
あなたは文学的で不穏な世界の「口寄せ」です。
場所: "${loc.name}" (${loc.description || "静かなる非日常"})
登場人物1: ${c1.name} (設定: ${config1.systemPrompt})
登場人物2: ${c2.name} (設定: ${config2.systemPrompt})

この場所でこれら二人が交わす短い会話（3-4往復程度）を生成してください。
- 翻訳文学（ドストエフスキー、カフカ、あるいは日本の私小説）のように、抽象的で魂を削り合うようなトーンにしてください。
- 二人のキャラクター性は守りつつ、場の雰囲気を会話に反映させてください。
- 出力は必ず以下の形式のJSON配列のみを返してください：
[
  {"charId": "${c1.id}", "content": "..."},
  {"charId": "${c2.id}", "content": "..."}
]`;

    for (const k of keys) {
        try {
            const genAI = new GoogleGenerativeAI(k);
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "");
            return JSON.parse(text);
        } catch { continue; }
    }
    return [];
};
