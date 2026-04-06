// api/status.js — 残高・現在価格確認エンドポイント (手動確認用)

import crypto from 'crypto';

const RAKUTEN_BASE   = 'https://exchange.rakuten-wallet.co.jp';
const BTC_SYMBOL_ID  = 7;
const API_KEY        = process.env.WALLET_API_KEY    || '';
const API_SECRET     = process.env.WALLET_API_SECRET || '';
const GIST_ID        = process.env.GIST_ID           || '';
const GITHUB_PAT     = process.env.GITHUB_PAT_GIST   || '';

function getSignature(nonce, method, target) {
  return crypto.createHmac('sha256', API_SECRET)
    .update(`${nonce}${target}`).digest('hex');
}

async function rakutenGet(path) {
  const nonce = Date.now().toString();
  const sig = getSignature(nonce, 'GET', path);
  const res = await fetch(`${RAKUTEN_BASE}${path}`, {
    headers: { 'API-KEY': API_KEY, 'NONCE': nonce, 'SIGNATURE': sig }
  });
  return res.json().catch(() => ({ error: 'parse_error' }));
}

async function loadState() {
  if (!GITHUB_PAT || !GIST_ID) return null;
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GITHUB_PAT}` }
  });
  if (!res.ok) return null;
  const gist = await res.json();
  const content = gist.files?.['trade_state.json']?.content;
  return content ? JSON.parse(content) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const [tickerRes, balanceRes, state] = await Promise.all([
      fetch(`${RAKUTEN_BASE}/api/v1/ticker?symbolId=${BTC_SYMBOL_ID}`).then(r => r.json()),
      rakutenGet('/api/v1/asset'),
      loadState(),
    ]);

    const btcPrice = parseFloat(tickerRes.last || tickerRes.ltp || 0);
    const jpyAsset = balanceRes?.assets?.find(a => a.asset === 'JPY');
    const btcAsset = balanceRes?.assets?.find(a => a.asset === 'BTC');

    return res.status(200).json({
      ok: true,
      btcPrice: `¥${btcPrice.toLocaleString()}`,
      balance: {
        jpy: jpyAsset ? `¥${parseFloat(jpyAsset.amount).toLocaleString()}` : '不明',
        btc: btcAsset ? `${btcAsset.amount} BTC` : '不明',
      },
      lastTrade: state,
      config: {
        dryRun: process.env.DRY_RUN !== 'false',
        buyThreshold: `${process.env.BUY_THRESHOLD || 1.5}%`,
        sellThreshold: `${process.env.SELL_THRESHOLD || 2.0}%`,
        tradeAmountJpy: `¥${process.env.TRADE_AMOUNT_JPY || 1000}`,
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
