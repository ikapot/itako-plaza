import { execSync } from 'child_process';

// Check env list
const out = execSync('vercel env ls', { cwd: process.cwd(), encoding: 'utf-8' });
console.log("=== Current Vercel Env ===\n", out);

// Check if VITE_PROXY_URL exists
const hasProxyUrl = out.includes('VITE_PROXY_URL');
console.log("VITE_PROXY_URL exists?", hasProxyUrl);

if (!hasProxyUrl) {
    console.log("=> Adding VITE_PROXY_URL...");
    const add = execSync('echo "/api/streamChat" | vercel env add VITE_PROXY_URL production', { cwd: process.cwd(), encoding: 'utf-8', input: '/api/streamChat\n', stdio: ['pipe','pipe','pipe'] });
    console.log(add);
}
