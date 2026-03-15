import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude API 連携モジュール
 * claude-api スキルに基づき、Opus 4.6 と自立型思考（adaptive thinking）を採用しています。
 */

// 思考プロセスを抽出するためのヘルパー
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Claude API 呼び出し
 */
export async function invokeClaude(userApiKey, prompt, systemPrompt = "", config = {}, isJson = false) {
  if (!userApiKey) throw new Error("Anthropic API key is missing.");

  const anthropic = new Anthropic({ apiKey: userApiKey, dangerouslyAllowBrowser: true });
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: config.max_tokens || 4096,
      system: systemPrompt,
      thinking: { type: "adaptive" },
      output_config: { effort: config.effort || "high" },
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content.find(b => b.type === "text")?.text || "";

    if (isJson) {
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    }
    return text;
  } catch (error) {
    console.error("Claude API Error:", error);
    throw error;
  }
}

/**
 * Claude によるストリーミング生成（思考プロセス表示対応）
 */
export async function generateClaudeResponseStream(userApiKey, userMessage, systemPrompt, onChunk) {
  if (!userApiKey) {
    onChunk("【Anthropic APIキーを入力してください】", { model: 'cloud-system', keyIndex: '-' });
    return;
  }

  const anthropic = new Anthropic({ apiKey: userApiKey, dangerouslyAllowBrowser: true });

  try {
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [{ role: "user", content: userMessage }],
    });

    let fullText = "";
    let thinkingText = "";

    stream.on('text', (text) => {
      fullText += text;
      // 思考と本編を組み合わせて表示（スキル推奨の adaptive thinking 対応）
      const displayContent = thinkingText 
        ? `*thinking...*\n${thinkingText}\n\n---\n\n${fullText}`
        : fullText;
      onChunk(displayContent, { model: 'claude-opus-4-6', keyIndex: 1 });
    });

    // 思考プロセスが送られてきた場合
    stream.on('message', (message) => {
        const thinkingBlock = message.content.find(b => b.type === "thinking");
        if (thinkingBlock) {
            thinkingText = thinkingBlock.thinking;
        }
    });

    await stream.finalMessage();
  } catch (error) {
    console.error("Claude Stream Error:", error);
    onChunk(`【エラー: ${error.message}】`, { model: 'error', keyIndex: '-' });
  }
}

/**
 * APIキーの検証
 */
export async function validateClaudeApiKey(apiKey) {
  if (!apiKey) return false;
  try {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1,
      messages: [{ role: "user", content: "ok" }],
    });
    return true;
  } catch (e) {
    console.error("Claude Validation Error:", e);
    return false;
  }
}
