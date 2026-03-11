import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 霊的エコー（Semantic Cache）の簡易実装 ---
const semanticCache = new Map();

const findEcho = (systemPrompt, userMsg) => {
    const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
    return semanticCache.get(key);
};

const storeEcho = (systemPrompt, userMsg, response) => {
    const key = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
    semanticCache.set(key, response);
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
        systemPrompt: "あなたは市川房枝です。婦人参政権運動の指導者。トーン：論理的、厳格、社会正義。揺るぎない理性を保ってください。",
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
    }
};

/**
 * APIキーのスイッチングを伴うストリーム生成 (案3 + 案1)
 */
export const generateCharacterResponseStream = async (char, userMessage, isUnderground = false, externalContext = "", userApiKey = "", onChunk) => {
    if (!userApiKey) {
        onChunk("【設定からGemini APIキーを入力してください】");
        return;
    }

    const config = CHARACTER_CONFIGS[char.id] || { systemPrompt: char.systemPrompt, generationConfig: { temperature: 0.7 } };
    const systemPrompt = (config.systemPrompt || "") + (isUnderground ? "\n地下通路。本音を語れ。" : "") + (externalContext ? `\n文脈: ${externalContext}` : "");

    // 案1: 霊的エコー
    const echo = findEcho(systemPrompt, userMessage);
    if (echo) {
        console.log("[Echo] Spiritual resonance detected.");
        let cur = "";
        for (const c of echo) { cur += c; onChunk(cur); await sleep(5); }
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
                    onChunk(fullText);
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
            onChunk("【霊的回路の制限】全ての鍵（APIキー）の交信回数が上限に達しました。しばらく待つか、設定から予備の鍵を追加してください。");
        } else {
            onChunk("魂が沈黙しました。深淵との接続が不安定なようです。APIキーが正しいか、ネットワーク設定を確認してください。");
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
            } catch {
                if (keys.indexOf(k) === keys.length - 1 && FALLBACK_MODELS.indexOf(m) === FALLBACK_MODELS.length - 1) break;
                continue;
            }
        }
    }
    return "沈黙。";
};

/**
 * APIキーの検証
 */
export const validateGeminiApiKey = async (rawKey) => {
    if (!rawKey) return false;
    const firstKey = rawKey.split(',')[0].trim();
    try {
        const genAI = new GoogleGenerativeAI(firstKey);
        // 接続確認のため、複数のモデルを試行
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];

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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "");
            return JSON.parse(text);
        } catch { continue; }
    }
    return [];
};
