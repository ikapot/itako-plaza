
import { GoogleGenerativeAI } from "@google/generative-ai";
const testKey = "AIzaSyCdUeQDlIEDyeLoUvrtuYq0mOwxThzJm-c";
const genAI = new GoogleGenerativeAI(testKey);
try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hi");
    console.log("SUCCESS");
} catch (e) {
    console.log("ERROR_STATUS: " + e.status);
    console.log("ERROR_MESSAGE: " + e.message);
}
