
import { GoogleGenerativeAI } from "@google/generative-ai";
const testKey = "AIzaSyB61FaSCu6Ry1riZoacUUXknb7p0dCQSD8";
const genAI = new GoogleGenerativeAI(testKey);

async function testStream() {
    try {
        console.log("Testing Stream with gemini-2.5-flash...");
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "あなたは夏目漱石です。史実：神経衰弱、重度の胃病。トーン：短く、皮肉。身体性：胃の痛みが声に滲み出ます。"
        });
        const result = await model.generateContentStream("こんにちは");
        let full = "";
        for await (const chunk of result.stream) {
            full += chunk.text();
            process.stdout.write(chunk.text());
        }
        console.log("\nSUCCESS");
    } catch (e) {
        console.log("\nERROR: " + e.status + " - " + e.message);
    }
}
testStream();
