// api/status.js — 残高・現在価格確認エンドポイント

import { createHmac } from 'crypto';

const RAKUTEN_BASE = 'https://exchange.rakuten-wallet.co.jp';
const LTC_SYMBOL_ID = 10;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pat   = process.env.GITHUB_PAT_GIST || '';
    const gistId = process.env.GIST_ID        || '';

    // --- 公開ティッカー (LTC) ---
    let ltcPrice = 0;
    try {
      const tickerRes = await fetch(`${RAKUTEN_BASE}/api/v1/ticker?symbolId=${LTC_SYMBOL_ID}`);
      if (tickerRes.ok) {
        const ticker = await tickerRes.json();
        ltcPrice = parseFloat(ticker.last || ticker.bestBid || 0);
      }
    } catch (tickerErr) {
      console.error('Ticker Fetch Error:', tickerErr.message);
    }

    const API_KEY    = process.env.WALLET_API_KEY    || '';
    const API_SECRET = process.env.WALLET_API_SECRET || '';

    // --- 残高 (LTC) ---
    let balance = { jpy: '---', ltc: '---' };
    if (API_KEY && API_SECRET) {
      const path = '/api/v1/asset';
      const nonce = Date.now().toString();
      const sig = createHmac('sha256', API_SECRET).update(`${nonce}${path}`).digest('hex');
      try {
        const balRes = await fetch(`${RAKUTEN_BASE}${path}`, {
          headers: { 'API-KEY': API_KEY, 'NONCE': nonce, 'SIGNATURE': sig }
        });
        if (balRes.ok) {
          const balData = await balRes.json();
          const jpy = balData?.assets?.find(a => a.asset === 'JPY');
          const ltc = balData?.assets?.find(a => a.asset === 'LTC');
          balance = {
            jpy: jpy ? `¥${parseFloat(jpy.amount).toLocaleString()}` : '0',
            ltc: ltc ? `${parseFloat(ltc.amount).toFixed(2)} LTC` : '0',
          };
        }
      } catch (e) {}
    }

    // --- Gist から V2 戦略状態取得 ---
    let strategyState = null;
    if (pat && gistId) {
      const gRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${pat}` }
      });
      if (gRes.ok) {
        const gist = await gRes.json();
        const content = gist.files?.['strategy_state.json']?.content;
        if (content) { try { strategyState = JSON.parse(content); } catch {} }
      }
    }

    return res.status(200).json({
      ok: true,
      price: ltcPrice,
      balance,
      strategy: strategyState,
      config: {
        dryRun:         process.env.DRY_RUN !== 'false',
        symbol:         'LTC/JPY',
        walletConfigured: !!(API_KEY && API_SECRET),
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, stack: err.stack?.split('\n')[0] });
  }
}
