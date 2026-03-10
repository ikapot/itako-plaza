
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const firebaseConfig = {
    apiKey: envConfig.VITE_FIREBASE_API_KEY,
    authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
    storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const knowledgeBase = [
    {
        title: "Literary Resonance and the Spirit of Dostoevsky - Overview",
        content: "ノートブックの主なテーマはドストエフスキー『悪霊』の翻訳差異の分析と、それに基づいたAIの構築計画。ポリフォニー（多声性）の再現が重要であり、単一の結論に導くのではなく、AI内部で常に葛藤（信仰と無神論の対立）を抱かせる設計が提案されている。"
    },
    {
        title: "ドストエフスキーAIのマスタープロンプト案",
        content: "プロンプト案:「あなたの中には、純粋な信仰（ソーニャやシャートフ）と、冷酷な理知や虚無（ラスコーリニコフやスタヴローギン）が常に同居し、闘争している。きれいに結論をまとめるな。自らの言葉に疑いを持ち、葛藤しながら語れ。」"
    },
    {
        title: "マルチエージェントによるポリフォニーの構築",
        content: "「理性・無神論エージェント」と「感情・信仰エージェント」の2つに回答を生成させ、擬似的なポリフォニーを構築するアイデア。キャラクターに「多面的な揺らぎ」を持たせることがイタコプラザにおける精神の深みとなる。"
    }
];

async function sync() {
    console.log("Starting synchronization to Firebase...");
    // We use a fixed UID for the sync service or the current user's UID if known.
    // Here we'll just push them as a system/sync user or similar if possible.
    // For this demonstration, we'll assume the rules allow adding to the collection.
    for (const item of knowledgeBase) {
        try {
            await addDoc(collection(db, "notebook_accumulations"), {
                uid: "system_sync_bot",
                content: `${item.title}\n\n${item.content}`,
                timestamp: serverTimestamp()
            });
            console.log(`Synced: ${item.title}`);
        } catch (e) {
            console.error(`Error syncing ${item.title}:`, e);
        }
    }
    console.log("Synchronization complete.");
    process.exit(0);
}

sync();
