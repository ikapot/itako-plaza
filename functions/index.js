import functions from "firebase-functions";
import admin from "firebase-admin";
import cors from "cors";
import fetch from "node-fetch";

admin.initializeApp();

// CORS設定: どこからでも受け入れる（本番環境では許可ドメインを絞ることを推奨）
const corsHandler = cors({ origin: true });

export const streamChat = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      // 1. Google 認証トークンの検証
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing Bearer Token. API Proxy denied." });
      }
      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authError) {
        return res.status(401).json({ error: "Unauthorized: Invalid or expired Firebase Token." });
      }

      // 2. Secret Manager / または環境変数からマスターキーを取得
      // ※ ローカルエミュレータでは process.env.OPENROUTER_API_KEY を使用、本番では defineSecret 等に移行可
      const API_KEY = process.env.OPENROUTER_API_KEY || functions.config().openrouter?.key;
      if (!API_KEY) {
        console.error("Master API Key is missing on the server.");
        return res.status(500).json({ error: "Internal Server Error: Proxy missing configuration." });
      }

      // 3. フロントエンドからのペイロード（メッセージリストやモデル名）を取得
      const payload = req.body;
      if (!payload.messages) {
        return res.status(400).json({ error: "Bad Request: Missing messages array." });
      }

      // 4. OpenRouter へリクエストを構築 (ストリーミング強制)
      const openRouterPayload = {
        model: payload.model || "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: payload.messages,
        temperature: payload.temperature || 0.7,
        max_tokens: payload.max_tokens || 1000,
        stream: true, // Server-Sent Eventsでの逐次出力を要求
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
         return res.status(openRouterReq.status).json({ error: "OpenRouter Error", details: errorText });
      }

      // 5. ストリーミングの中継 (SSE形式)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // node-fetchのbodyはNode.jsのReadable Stream
      openRouterReq.body.on('data', (chunk) => {
        // 受け取った生のチャンク(Uint8Array等)をそのままクライアントに流す
        res.write(chunk);
      });

      openRouterReq.body.on('end', () => {
        res.end(); // 通信終了
      });

      openRouterReq.body.on('error', (err) => {
        console.error("Stream Error from OpenRouter:", err);
        res.end(); // エラー中絶でも終了処理を担保
      });

    } catch (e) {
      console.error("Proxy Error:", e);
      res.status(500).json({ error: "Internal System Failure during proxy tunneling." });
    }
  });
});
