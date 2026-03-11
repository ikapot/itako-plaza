
import { GoogleGenerativeAI } from "@google/generative-ai";
const testKey = "AIzaSyB61FaSCu6Ry1riZoacUUXknb7p0dCQSD8";
const genAI = new GoogleGenerativeAI(testKey);

async function run() {
    const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite"];
    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hi");
            console.log(`SUCCESS [${m}]: ${result.response.text()}`);
            return;
        } catch (e) {
            console.log(`FAILED [${m}]: ${e.status} - ${e.message}`);
        }
    }
}
run();
