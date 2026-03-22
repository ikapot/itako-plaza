import * as functions from "firebase-functions";
import admin from "firebase-admin";
import corsLib from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const cors = corsLib({ origin: true });

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Spiritual Alaya Proxy (v1 Robust - ESM)
 * v2へのアップグレードができない制限のため、v1のまま機能を強化。
 */
export const streamChat = functions.region('us-central1').https.onRequest((req, res) => {
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
      const API_KEY = process.env.OPENROUTER_API_KEY;
      if (!API_KEY) {
        return res.status(500).json({ error: "Master API Key Missing on Server" });
      }

      // APIリクエスト
      const payload = req.body;
      const FAILOVER_MODELS = [
        payload.model || "google/gemini-2.0-flash-lite-preview-02-05:free",
        "google/gemma-3-27b-it:free",
        "google/gemma-3-12b-it:free",
        "mistralai/mistral-7b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free"
      ];

      let lastError = null;
      for (const targetModel of FAILOVER_MODELS) {
        try {
          const openRouterPayload = {
            model: targetModel,
            messages: payload.messages,
            temperature: payload.temperature || 0.7,
            max_tokens: payload.max_tokens || 1000,
            stream: true,
          };

          const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://itako-plaza-kenji.web.app",
              "X-Title": "Itako Plaza Proxy",
            },
            body: JSON.stringify(openRouterPayload),
          });

          if (openRouterRes.status === 429) {
            console.warn(`Model ${targetModel} rate limited. Trying next...`);
            continue; 
          }

          if (!openRouterRes.ok) {
            const errorText = await openRouterRes.text();
            throw new Error(`OpenRouter Error (${openRouterRes.status}): ${errorText}`);
          }

          // ストリーミング出力ヘッダー
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          openRouterRes.body.on('data', (chunk) => res.write(chunk));
          openRouterRes.body.on('end', () => res.end());
          openRouterRes.body.on('error', (err) => {
            console.error("Fetch stream error:", err);
            res.end();
          });
          
          return; // 成功！

        } catch (e) {
          lastError = e;
          console.error(`Attempt with ${targetModel} failed:`, e.message);
        }
      }

      // すべて失敗した場合
      return res.status(500).json({ error: "All Spiritual Conduits Busy", details: lastError?.message });

    } catch (e) {
      console.error("Proxy Error:", e);
      res.status(500).json({ error: "Internal Failure" });
    }
  });
});
