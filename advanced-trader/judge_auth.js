import crypto from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

const KEY = process.env.WALLET_API_KEY;
const SECRET = process.env.WALLET_API_SECRET;

async function testStatus() {
  const endpoint = '/api/v1/asset';
  const url = `https://exchange.rakuten-wallet.co.jp${endpoint}`;
  const nonce = Date.now().toString();
  
  // 以前成功していたロジックそのもの
  const sig = crypto.createHmac('sha256', SECRET)
    .update(`${nonce}${endpoint}`)
    .digest('hex');

  console.log(`--- Node.js Original (ESM) Logic Test ---`);
  console.log(`KEY: ${KEY ? KEY.substring(0,4) + "..." : "MISSING"}`);
  console.log(`Nonce: ${nonce}`);
  console.log(`Path: ${endpoint}`);
  console.log(`Signature: ${sig}`);

  try {
    const res = await fetch(url, {
      headers: {
        'API-KEY': KEY,
        'NONCE': nonce,
        'SIGNATURE': sig
      }
    });
    const body = await res.text();
    console.log(`Result: ${res.status} ${body}`);
  } catch (err) {
    console.error(`Fetch Error: ${err.message}`);
  }
}

testStatus();
