
import { GoogleGenerativeAI } from "@google/generative-ai";
const testKey = "AIzaSyB61FaSCu6Ry1riZoacUUXknb7p0dCQSD8";

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`;
        const resp = await fetch(url);
        const json = await resp.json();
        console.log("AVAILABLE_MODELS: " + JSON.stringify(json, null, 2));
    } catch (e) {
        console.log("LIST_ERR: " + e);
    }
}
listModels();
