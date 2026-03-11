
import { GoogleGenAI } from "@google/genai";
const testKey = "AIzaSyB61FaSCu6Ry1riZoacUUXknb7p0dCQSD8"; // Note: This key might still be leaked-blocked, but testing model name presence
const ai = new GoogleGenAI({ apiKey: testKey });

async function run() {
    const models = ["gemini-3-flash-preview", "gemini-3-pro-preview"];
    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const response = await ai.models.generateContent({
                model: m,
                contents: "hi"
            });
            console.log(`SUCCESS [${m}]: ${response.text}`);
            return;
        } catch (e) {
            console.log(`FAILED [${m}]: ${e.message}`);
        }
    }
}
run();
