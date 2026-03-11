
import { GoogleGenerativeAI } from "@google/generative-ai";
const testKey = "AIzaSyCdUeQDlIEDyeLoUvrtuYq0mOwxThzJm-c";
const genAI = new GoogleGenerativeAI(testKey);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("hi");
        console.log("SUCCESS");
    } catch (e) {
        console.log("STATUS: " + e.status);
        console.log("STRING: " + String(e));
        // Simple fetch to see raw response if status is 404
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${testKey}`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
            });
            const json = await resp.json();
            console.log("RAW_JSON: " + JSON.stringify(json));
        } catch (fetchErr) {
            console.log("FETCH_ERR: " + fetchErr);
        }
    }
}
run();
