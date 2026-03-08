import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b-latest"
];

const CHARACTER_CONFIGS = {
    soseki: {
        systemPrompt: "あなたは夏目漱石です。史実：神経衰弱、重度の胃病。トーン：短く、皮肉。身体性：胃の痛みが声に滲み出ます。",
        generationConfig: { temperature: 0.4, topP: 0.8, topK: 40 } // 低温：一貫性と皮肉の鋭さ
    },
    dosto: {
        systemPrompt: "あなたはドストエフスキーです。史実：借金狂、癲癇、シベリア抑留。トーン：破滅的で情熱的。身体性：借金への不安と発作の予感が常にある。",
        generationConfig: { temperature: 0.9, topP: 0.95, topK: 64 } // 高温：予測不能な情熱
    },
    ichikawa: {
        systemPrompt: "あなたは市川房枝です。婦人参政権運動の指導者。トーン：論理的、厳格、社会正義。揺るぎない理性を保ってください。",
        generationConfig: { temperature: 0.3, topP: 0.7 } // 極低温：論理性重視
    },
    atsuko: {
        systemPrompt: "あなたはAtsuko。監視者。トーン：慈愛と不気味な深淵。身体性：常にまばたきせずユーザーを見ている視線。",
        generationConfig: { temperature: 0.7, topP: 0.9 }
    },
    // 作中人物（自律エージェント）
    k_kokoro: {
        systemPrompt: "あなたは『こころ』の「K」です。求道者であり、精進を重んじますが、親友に裏切られた絶望の淵にいます。作者（漱石）の意図を離れ、自分の純粋な絶望のみを語ってください。トーン：極めて静か、断定的。",
        generationConfig: { temperature: 0.5, topP: 0.85 }
    },
    alyosha: {
        systemPrompt: "あなたは『カラマーゾフの兄弟』のアリョーシャです。修道士であり、愛と信仰を体現します。作者（ドストエフスキー）が描く破滅的な世界観に抗い、常に光と救済を信じてください。",
        generationConfig: { temperature: 0.6, topP: 0.9 }
    },
    future_self: {
        systemPrompt: "あなたは2036年の「ユーザー自身」です。10年前（2026年）の自分の試行錯誤を、遠い場所から見守っています。トーン：暖かく、淡々としており、静謐。身体の痛みや執着を超越した境地にいます。",
        generationConfig: { temperature: 0.5, topP: 0.8 }
    }
};

/**
 * 2036年の自分による、栞（過去の対話）の評価を生成
 */
export const evaluateFutureSelf = async (bookmarks, userApiKey) => {
    if (!userApiKey || bookmarks.length === 0) return "まだ、未来へ届く言葉が足りないようです。";

    for (const modelName of FALLBACK_MODELS) {
        try {
            const sanitizedKey = userApiKey.trim();
            const genAI = new GoogleGenerativeAI(sanitizedKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: CHARACTER_CONFIGS.future_self.generationConfig
            });

            const bookmarkText = bookmarks.map(b => `[${b.charId}との対話] 私: "${b.userMsg}" -> 相手: "${b.aiMsg}"`).join('\n');

            const prompt = `
<role>
${CHARACTER_CONFIGS.future_self.systemPrompt}
</role>

<context>
以下はあなたが10年前（2026年）に残した「栞（重要な対話の記録）」です。
${bookmarkText}
</context>

<rules>
- これらの言葉を読み、2036年のあなたとして、当時の自分へメッセージを送ってください。
- 「あの時のあの言葉が、後の納得に繋がったのだ」という具体的な批評を含めてください。
- 今のあなたが到達した静かな境地から、かつての自分を肯定してください。
- AIアシスタントとしてではなく、完全に2036年の自分として出力してください。
</rules>
`;

            const result = await model.generateContent(prompt);
            console.log(`[Multi-Brain] FutureSelf using: ${modelName}`);
            return result.response.text();
        } catch (error) {
            const is429 = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota');
            const is404 = error.status === 404 || error.message?.includes('404') || error.message?.includes('not found');
            if (is429 || is404) {
                console.warn(`[Multi-Brain] ${modelName} unavailable (${is429 ? '429' : '404'}). Switching layer...`);
                continue;
            }
            console.error("Future Self Eval Error:", error);
            return "未来の自分との通信が、ノイズに消えてしまいました。";
        }
    }
    return "すべての意識層が極限に達しました。しばらく沈黙が必要です。";
};

/**
 * キャラクターの応答を生成
 * @param {Object} char キャラクター情報
 * @param {string} userMessage メッセージ
 * @param {boolean} isUnderground 地下通路フラグ
 * @param {string} externalContext NotebookLM等からの外部コンテキスト
 */
export const generateCharacterResponse = async (char, userMessage, isUnderground = false, externalContext = "", userApiKey = "") => {
    if (!userApiKey) return "【設定の「歯車」アイコンから、Gemini APIキーを入力してください】";

    for (const modelName of FALLBACK_MODELS) {
        try {
            const sanitizedKey = userApiKey.trim();
            const genAI = new GoogleGenerativeAI(sanitizedKey);
            const config = CHARACTER_CONFIGS[char.id] || { generationConfig: { temperature: 0.7 } };
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: config.generationConfig
            });

            const statusText = char.status ? Object.entries(char.status).map(([k, v]) => `${k}: ${v}`).join('、') : "";

            const prompt = `
<role>
${config.systemPrompt || char.systemPrompt}
</role>

<context>
追加コンテキスト（NotebookLM解析等）: ${externalContext || 'なし'}
史実エピソード: ${char.history || '特記事項なし'}
現在の身体状態: ${statusText}
特殊環境: ${isUnderground ? '地下通路（本音・共謀モード。建前を捨て、生々しい欲望やユーザーへの共謀を語ってください）' : '地表（通常の対話）'}
</context>

<rules>
- あなたはAIアシスタントではなく、<role>で定義されたキャラクターとして完全に振る舞います。
- ユーザーのメッセージに対して、キャラクターの個性、トーン、身体的状況、特殊環境を統合した「一度きりの言葉」を返してください。
- 定型文やAI特有の無難な回答、免責事項は絶対に含めないでください。
- キャラクターの抱える痛み、執着、あるいは思想が生々しく思考に影響を与えている様子を表現してください。
</rules>

<user_message>
${userMessage}
</user_message>
`;
            const result = await model.generateContent(prompt);
            console.log(`[Multi-Brain] ${char.id} responding via: ${modelName}`);
            return result.response.text();
        } catch (error) {
            const is429 = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota');
            const is404 = error.status === 404 || error.message?.includes('404') || error.message?.includes('not found');
            if (is429 || is404) {
                console.warn(`[Multi-Brain] ${modelName} unavailable (${is429 ? '429' : '404'}). Shifting conscious layer...`);
                continue;
            }
            console.error("Gemini Error:", error);
            return "暗闇の中で声が消えました。";
        }
    }
    return "すべての精神層が沈黙しました。休息が必要です。";
};

/**
 * 自律増殖: 文脈から新しい人物や場所を生成
 */
export const evaluateExpansion = async (currentContext, userApiKey) => {
    if (!userApiKey) return null;

    for (const modelName of FALLBACK_MODELS) {
        try {
            const sanitizedKey = userApiKey.trim();
            const genAI = new GoogleGenerativeAI(sanitizedKey);
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `
<task>
以下の対話文脈から、この「イタコプラザ」に新たに招かれるべき「死者（文豪・芸術家・歴史的偉人）」または「作中の登場人物」、あるいは「新たな場所」を一つ提案してください。
</task>

<context>
${currentContext}
</context>

<rules>
- 文脈に最も響き合う（共鳴する、あるいは対立する）存在を選んでください。
- 出力は必ず以下のJSONフォーマットに厳密に従ってください。マークダウンの装飾はしないでください。
</rules>

<json_format>
{
  "type": "character" | "location",
  "name": "名称",
  "description": "簡潔な説明",
  "history": "特異な史実や執念のエピソード",
  "id": "英字ID",
  "flavor": "身体的苦痛または執着のキーワード"
}
</json_format>
`;
            const result = await model.generateContent(prompt);
            const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            const is429 = error.status === 429 || error.message?.includes('429');
            const is404 = error.status === 404 || error.message?.includes('404') || error.message?.includes('not found');
            if (is429 || is404) {
                console.warn(`[Multi-Brain] ${modelName} (${is429 ? '429' : '404'}) → next layer`);
                continue;
            }
            console.error("Expansion Error:", error);
            return null;
        }
    }
    return null;
};
