import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// 初期化（v2スタイル）
initializeApp();

/**
 * Spiritual Alaya Proxy (v2)
 * OpenRouterへのストリーミングリクエストを中継する高耐久プロキシ。
 * cors: true オプションにより、ブラウザからの通信（OPTIONSプリフライト含む）が自動的に許可されます。
 */
export const streamChat = onRequest({ 
  cors: true,
  maxInstances: 10,
  minInstances: 0,
}, async (req, res) => {
  
  // POST以外のメソッドは拒否 (cors: true により OPTIONS は自動処理される)
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    // 1. Google 認証トークンの検証
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing Token." });
      return;
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
      await getAuth().verifyIdToken(idToken);
    } catch (authError) {
      res.status(401).json({ error: "Unauthorized: Invalid Token." });
      return;
    }

    // 2. マスターAPIキーの取得
    const API_KEY = process.env.OPENROUTER_API_KEY; // dotenv または Google Cloud環境変数から
    if (!API_KEY) {
      console.error("Master API Key is missing.");
      res.status(500).json({ error: "Configuration Error." });
      return;
    }

    // 3. ペイロード情報の取得
    const payload = req.body;
    if (!payload.messages) {
      res.status(400).json({ error: "Bad Request: Missing messages." });
      return;
    }

    // 4. OpenRouter へリクエスト (ストリーミング強制)
    const openRouterPayload = {
      model: payload.model || "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages: payload.messages,
      temperature: payload.temperature || 0.7,
      max_tokens: payload.max_tokens || 1000,
      stream: true,
    };

    const openRouterReq = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://itako-plaza-kenji.web.app",
        "X-Title": "Itako Plaza Proxy",
      },
      body: JSON.stringify(openRouterPayload),
    });

    if (!openRouterReq.ok) {
       const errorText = await openRouterReq.text();
       res.status(openRouterReq.status).json({ error: "OpenRouter Error", details: errorText });
       return;
    }

    // 5. ストリーミングの中継 (SSE形式)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    openRouterReq.body.on('data', (chunk) => {
      res.write(chunk);
    });

    openRouterReq.body.on('end', () => {
      res.end();
    });

    openRouterReq.body.on('error', (err) => {
      console.error("Stream Error:", err);
      res.end();
    });

  } catch (e) {
    console.error("Proxy Fatal Error:", e);
    res.status(500).json({ error: "System Failure." });
  }
});
