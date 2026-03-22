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
 * Last Updated: 2026-03-22 19:47
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
        return res.status(500).json({ error: "DEBUG-ENV: Master API Key Missing on Server" });
      }

      // APIリクエスト
      const payload = req.body;
      // 2026年3月時点の確実に存在する無料モデルリスト（より広範囲に）
      const FAILOVER_MODELS = [
        "google/gemma-3-27b-it:free",
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "google/gemma-3-4b-it:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
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
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          try {
            // node-fetch v3 の body は Web ReadableStream なので、非同期イテレータとして扱う
            for await (const chunk of openRouterRes.body) {
              res.write(chunk);
            }
            res.end();
          } catch (streamError) {
            console.error("Fetch stream error:", streamError);
            res.end();
          }
          
          return; // 成功！

        } catch (e) {
          lastError = e;
          console.error(`Attempt with ${targetModel} failed:`, e.message);
        }
      }

      // すべて失敗した場合
      const finalDetail = lastError?.message || "No specific error caught";
      console.error("All conduits failed. Last error:", finalDetail);
      return res.status(500).json({ 
        error: `DEBUG-LOOP: All Spiritual Conduits Busy. Last Cause: ${finalDetail}`
      });

    } catch (e) {
      console.error("Proxy Error:", e);
      res.status(500).json({ error: "Internal Failure" });
    }
  });
});
