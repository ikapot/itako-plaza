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
      // 確実に存在するモデルリスト（429=存在するが混雑中、のもので構成）
      const FAILOVER_MODELS = [
        "google/gemma-3-27b-it:free",
        "google/gemma-3-12b-it:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "google/gemma-2-9b-it:free"
      ];
      // リクエストで指定されたモデルがあれば先頭に追加
      if (payload.model && !FAILOVER_MODELS.includes(payload.model)) {
        FAILOVER_MODELS.unshift(payload.model);
      }

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));

      let lastError = null;
      for (let i = 0; i < FAILOVER_MODELS.length; i++) {
        const targetModel = FAILOVER_MODELS[i];
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
            console.warn(`Model ${targetModel} rate limited (429). Waiting 3s then trying next...`);
            await sleep(3000); // 3秒待ってから次を試す
            lastError = new Error(`Rate limited: ${targetModel}`);
            continue; 
          }
          
          if (openRouterRes.status === 404) {
            console.warn(`Model ${targetModel} not found (404). Trying next immediately...`);
            lastError = new Error(`Not found: ${targetModel}`);
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
