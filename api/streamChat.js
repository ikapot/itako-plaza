import admin from 'firebase-admin';

// Vercel環境でコールドスタート時に一度だけ初期化する
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Vercelから渡される改行文字のエスケープを解除してセットする
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        });
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

export default async function handler(req, res) {
    try {
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }

    // トークン検証
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing Token' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        await admin.auth().verifyIdToken(idToken);
    } catch (authError) {
        console.error('Firebase Token Verification Failed:', authError.message, authError.code);
        return res.status(401).json({ error: 'Invalid Token', detail: authError.message });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server API Key Missing' });
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

    // フォールバック付きでのOpenRouterコール
    for (const targetModel of FAILOVER_MODELS) {
        try {
            const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://itako-plaza-kenji.vercel.app",
                    "X-Title": "Itako Plaza Proxy - Vercel",
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
                if (hasStartedTransfer) break; 
                continue;
            }

            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
            }

            if (openRouterRes.body) {
                try {
                    // Node 18+ Web Streams API
                    for await (const chunk of openRouterRes.body) {
                        res.write(chunk);
                        hasStartedTransfer = true;
                    }
                } catch (streamError) {
                    // Fallback for some fetch configurations
                    const reader = openRouterRes.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        res.write(value);
                        hasStartedTransfer = true;
                    }
                }
            }
            
            res.end();
            return;
        } catch (e) {
            console.error(`Attempt with ${targetModel} failed:`, e.message);
            lastError = e;
            if (hasStartedTransfer) break; 
        }
    }

    if (!res.writableEnded) {
        res.status(500).json({ error: lastError?.message || "All models failed" });
    }
    } catch (globalError) {
        console.error("Global Proxy Error:", globalError);
        if (!res.writableEnded) {
            res.status(500).json({ error: globalError.message || "Internal Void Collapse" });
        }
    }
}
