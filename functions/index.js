import * as functions from "firebase-functions";
import admin from "firebase-admin";
import corsLib from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const cors = corsLib({ origin: true });

admin.initializeApp();

/**
 * Spiritual Alaya Proxy (v1 Robust - ESM)
 * 手動でCORSヘッダーを注入し、さらにmiddlewareでラップした極限まで到達するプロキシ。
 */
export const streamChat = functions.https.onRequest((req, res) => {
  // 1. 全リクエスト（OPTIONS含む）に即座にCORSヘッダーをセット
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Max-Age', '3600');

  // 2. プリフライト(OPTIONS)はこれだけでOK
  if (req.method === 'OPTIONS') {
    res.status(204).send(''); 
    return;
  }

  // 3. ミドルウェアでもラップしてさらに確実性を高める
  return cors(req, res, async () => {
    try {
      // POST以外を許可しない
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      // トークン検証
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing Token" });
      }
      const idToken = authHeader.split("Bearer ")[1];
      
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (authError) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      // APIキー取得
      const API_KEY = process.env.OPENROUTER_API_KEY || functions.config().openrouter?.key;
      if (!API_KEY) {
        return res.status(500).json({ error: "Master API Key Missing" });
      }

      // APIリクエスト
      const payload = req.body;
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
        },
        body: JSON.stringify(openRouterPayload),
      });

      if (!openRouterReq.ok) {
        const errorText = await openRouterReq.text();
        return res.status(openRouterReq.status).json({ error: "OpenRouter Error", details: errorText });
      }

      // ストリーミング出力ヘッダー
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      openRouterReq.body.on('data', (chunk) => res.write(chunk));
      openRouterReq.body.on('end', () => res.end());
      openRouterReq.body.on('error', (err) => {
        console.error("Fetch stream error:", err);
        res.end();
      });

    } catch (e) {
      console.error("Proxy Error:", e);
      res.status(500).json({ error: "Internal Failure" });
    }
  });
});
