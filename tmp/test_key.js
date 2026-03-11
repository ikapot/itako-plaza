
import { GoogleGenerativeAI } from "@google/generative-ai";

const testKey = "AIzaSyCdUeQDlIEDyeLoUvrtuYq0mOwxThzJm-c";
const genAI = new GoogleGenerativeAI(testKey);

async function test() {
    console.log("Testing key: " + testKey);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

    for (const modelName of models) {
        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("hi");
            console.log(`Success with ${modelName}:`, result.response.text());
        } catch (e) {
            console.error(`Failed with ${modelName}:`);
            console.error("Status:", e.status);
            console.error("Message:", e.message);
            if (e.response) {
                console.error("Response:", JSON.stringify(e.response, null, 2));
            }
        }
        console.log("---");
    }
}

test();
