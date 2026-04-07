// api/status.js — 残高・現在価格確認エンドポイント

import { createHmac } from 'crypto';

const RAKUTEN_BASE = 'https://exchange.rakuten-wallet.co.jp';
const BTC_SYMBOL_ID = 7;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- 公開ティッカー (認証不要) ---
    let btcPrice = 0;
    try {
      const tickerRes = await fetch(`${RAKUTEN_BASE}/api/v1/ticker?symbolId=${BTC_SYMBOL_ID}`);
      if (tickerRes.ok) {
        const ticker = await tickerRes.json();
        btcPrice = parseFloat(ticker.last || ticker.ltp || ticker.close || 0);
      }
    } catch (tickerErr) {
      console.error('Ticker Fetch Error:', tickerErr.message);
    }

    const API_KEY    = process.env.WALLET_API_KEY    || '';
    const API_SECRET = process.env.WALLET_API_SECRET || '';

    // --- 残高 (APIキーある場合のみ) ---
    let balance = { jpy: 'APIキー未設定', btc: 'APIキー未設定' };
    if (API_KEY && API_SECRET) {
      const path = '/api/v1/asset';
      const nonce = Date.now().toString();
      const sig = createHmac('sha256', API_SECRET).update(`${nonce}${path}`).digest('hex');
      const balRes = await fetch(`${RAKUTEN_BASE}${path}`, {
        headers: { 'API-KEY': API_KEY, 'NONCE': nonce, 'SIGNATURE': sig }
      });
      if (balRes.ok) {
        const balData = await balRes.json();
        const jpy = balData?.assets?.find(a => a.asset === 'JPY');
        const btc = balData?.assets?.find(a => a.asset === 'BTC');
        balance = {
          jpy: jpy ? `¥${parseFloat(jpy.amount).toLocaleString()}` : '0',
          btc: btc ? `${btc.amount} BTC` : '0',
        };
      }
    }

    // --- Gist から前回取引状態取得 ---
    let lastTrade = null;
    const pat   = process.env.GITHUB_PAT_GIST || '';
    const gistId = process.env.GIST_ID        || '';
    if (pat && gistId) {
      const gRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${pat}` }
      });
      if (gRes.ok) {
        const gist = await gRes.json();
        const content = gist.files?.['trade_state.json']?.content;
        if (content) { try { lastTrade = JSON.parse(content); } catch {} }
      }
    }

    return res.status(200).json({
      ok: true,
      btcPrice: isNaN(btcPrice) ? '取得失敗' : `¥${btcPrice.toLocaleString()}`,
      balance,
      lastTrade,
      config: {
        dryRun:         process.env.DRY_RUN !== 'false',
        buyThreshold:   `${process.env.BUY_THRESHOLD  || 1.5}%`,
        sellThreshold:  `${process.env.SELL_THRESHOLD || 2.0}%`,
        tradeAmountJpy: `¥${process.env.TRADE_AMOUNT_JPY || 1000}`,
        walletConfigured: !!(API_KEY && API_SECRET),
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, stack: err.stack?.split('\n')[0] });
  }
}
