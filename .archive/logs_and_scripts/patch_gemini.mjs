import fs from 'fs';

const filePath = './src/gemini.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    'import { findEchoInFirestore, saveEchoToFirestore } from "./firebase";',
    'import { auth, findEchoInFirestore, saveEchoToFirestore } from "./firebase";'
);

content = content.replace(
    `async function fetchOpenRouter(apiKey, messages, model, config = {}, stream = false, onChunk = null) {\n  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-or-v1-')) {`,
    `async function fetchOpenRouter(apiKey, messages, model, config = {}, stream = false, onChunk = null) {\n  const isProxyMode = apiKey === 'PROXY_MODE';\n  if (!isProxyMode && (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-or-v1-'))) {`
);

content = content.replace(
    /const keySnippet = `\${apiKey\.substring\(0, 10\)}\.\.\.`;\n  console\.log\(`\[API Request\] Model: \${model \|\| "google\/gemma-3-27b-it:free"}, Messages: \${normalizedMessages\.length}`\);/,
    `const keySnippet = isProxyMode ? "PROXY" : \`\${apiKey.substring(0, 10)}...\`;\n  console.log(\`[API Request] Model: \${model || "google/gemma-3-27b-it:free"}, Messages: \${normalizedMessages.length}, Key: \${keySnippet}\`);`
);

content = content.replace(
    `      const response = await fetch(OPENROUTER_ENDPOINT, {\n        method: "POST",\n        headers: {\n          "Authorization": \`Bearer \${apiKey.trim()}\`,\n          "HTTP-Referer": OPENROUTER_REFERER,\n          "X-Title": OPENROUTER_TITLE,\n          "Content-Type": "application/json"\n        },\n        body: JSON.stringify(body)\n      });`,
    `      let fetchUrl = OPENROUTER_ENDPOINT;
      let reqHeaders = { "Content-Type": "application/json" };
      if (isProxyMode) {
          if (!auth?.currentUser) throw { status: 401, code: SPIRITUAL_ERRORS.AUTH_FAILED, message: "Ghost API Proxy requires Google Login." };
          reqHeaders["Authorization"] = \`Bearer \${await auth.currentUser.getIdToken()}\`;
          const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
          fetchUrl = isDev 
              ? "http://127.0.0.1:5001/itako-plaza-kenji/us-central1/streamChat" 
              : "https://us-central1-itako-plaza-kenji.cloudfunctions.net/streamChat";
      } else {
          reqHeaders["Authorization"] = \`Bearer \${apiKey.trim()}\`;
          reqHeaders["HTTP-Referer"] = OPENROUTER_REFERER;
          reqHeaders["X-Title"] = OPENROUTER_TITLE;
      }
      const response = await fetch(fetchUrl, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(body)
      });`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('patched');
