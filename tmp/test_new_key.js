
import { GoogleGenerativeAI } from "@google/generative-ai";
const testKey = "AIzaSyB61FaSCu6Ry1riZoacUUXknb7p0dCQSD8";
const genAI = new GoogleGenerativeAI(testKey);

async function run() {
    console.log("Testing Key: " + testKey);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

    for (const modelName of models) {
        try {
            console.log(`Trying ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "hi" }] }],
                generationConfig: { maxOutputTokens: 5 }
            });
            console.log(`SUCCESS [${modelName}]: ${result.response.text()}`);
            return; // 成功したら終了
        } catch (e) {
            console.log(`FAILED [${modelName}]: ${e.status} - ${e.message}`);
        }
    }
}
run();
