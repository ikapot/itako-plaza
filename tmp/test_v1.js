
const testKey = "AIzaSyCdUeQDlIEDyeLoUvrtuYq0mOwxThzJm-c";
async function run() {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${testKey}`;
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
        });
        const json = await resp.json();
        console.log("V1_RAW_JSON: " + JSON.stringify(json));
    } catch (e) {
        console.log("V1_ERR: " + e);
    }
}
run();
