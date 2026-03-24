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

export const streamChat = functions.runWith({ 
  timeoutSeconds: 300, 
  memory: '1GB' 
}).region('us-central1').https.onRequest((req, res) => {
  // CORSを Promise で包み、非同期処理の完了を確実にする
  return new Promise((resolve, reject) => {
    cors(req, res, async () => {
      try {
        if (req.method !== "POST") {
          res.status(405).json({ error: "Method Not Allowed" });
          return resolve();
        }

        const authHeader = req.headers.authorization || "";
        if (!authHeader.startsWith("Bearer ")) {
          res.status(401).json({ error: "Missing Token" });
          return resolve();
        }
        const idToken = authHeader.split("Bearer ")[1];
        try {
          await admin.auth().verifyIdToken(idToken);
        } catch (authError) {
          res.status(401).json({ error: "Invalid Token" });
          return resolve();
        }

        const API_KEY = process.env.OPENROUTER_API_KEY || (functions.config().openrouter ? functions.config().openrouter.key : null);
        if (!API_KEY) {
          res.status(500).json({ error: "Server API Key Missing" });
          return resolve();
        }

        const payload = req.body;
        const FAILOVER_MODELS = [
          "google/gemma-3-27b-it:free",
          "google/gemini-2.0-flash:free",
          "meta-llama/llama-3.3-70b-instruct:free",
          "qwen/qwen-2.5-72b-instruct:free"
        ];
        if (payload.model && !FAILOVER_MODELS.includes(payload.model)) {
          FAILOVER_MODELS.unshift(payload.model);
        }

        let lastError = null;
        let hasStartedTransfer = false;

        for (const targetModel of FAILOVER_MODELS) {
          try {
            const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://itako-plaza-kenji.web.app",
                "X-Title": "Itako Plaza Proxy",
              },
              body: JSON.stringify({
                model: targetModel,
                messages: payload.messages,
                temperature: payload.temperature || 0.7,
                max_tokens: payload.max_tokens || 1000,
                stream: true,
              }),
            });

            if (!openRouterRes.ok) {
              const errorText = await openRouterRes.text();
              console.error(`Model ${targetModel} failure: ${errorText}`);
              lastError = new Error(errorText);
              if (hasStartedTransfer) break; // すでに開始していたら中途半端に別のモデルに変えない
              continue;
            }

            // ストリーミングヘッダー設定（一度だけ）
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
            }

            // node-fetch v3 / Node 20 でのストリーム処理
            // ReadableStream を安全に転送
            if (openRouterRes.body) {
              for await (const chunk of openRouterRes.body) {
                res.write(chunk);
                hasStartedTransfer = true; // データ転送を開始した
              }
            }
            
            res.end();
            return resolve(); // 正常終了

          } catch (e) {
            console.error(`Attempt with ${targetModel} failed:`, e.message);
            lastError = e;
            if (hasStartedTransfer) break; // 書き込み開始後のエラーは即時終了
          }
        }

        if (!res.writableEnded) {
          res.status(500).json({ error: lastError?.message || "All models failed" });
        }
        resolve();
      } catch (globalError) {
        console.error("Global Proxy Error:", globalError);
        res.status(500).json({ error: "Internal Failure" });
        resolve();
      }
    });
  });
});
