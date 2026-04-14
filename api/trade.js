// api/trade.js — 楽天ウォレット LTC V2 執行エンドポイント
// 戦略: Zen-LTC-Quant V2 同調
//   - Gist から最新の指標 (RSI, Z-score) を取得
//   - 閾値判定に基づき執行

import crypto from 'crypto';

const RAKUTEN_BASE = 'https://exchange.rakuten-wallet.co.jp';
const LTC_SYMBOL_ID = 10;
const TRADE_AMOUNT   = parseFloat(process.env.TRADE_AMOUNT_JPY || '1000');
const DRY_RUN        = process.env.DRY_RUN !== 'false';

const WALLET_API_KEY    = process.env.WALLET_API_KEY    || '';
const WALLET_API_SECRET = process.env.WALLET_API_SECRET || '';
const DISCORD_WEBHOOK   = process.env.DISCORD_WEBHOOK_URL || '';
const GITHUB_PAT        = process.env.GITHUB_PAT_GIST   || '';
const GIST_ID           = process.env.GIST_ID           || '';

function createHmacSig(nonce, pathOrBody) {
  return crypto.createHmac('sha256', WALLET_API_SECRET).update(`${nonce}${pathOrBody}`).digest('hex');
}

async function rakutenRequest(method, path, body = null) {
  const nonce = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const sig = createHmacSig(nonce, method === 'GET' ? path : bodyStr);

  const res = await fetch(`${RAKUTEN_BASE}${path}`, {
    method,
    headers: { 'API-KEY': WALLET_API_KEY, 'NONCE': nonce, 'SIGNATURE': sig, 'Content-Type': 'application/json' },
    body: body ? bodyStr : undefined,
  });
  return res.json();
}

async function getStrategyState() {
  if (!GITHUB_PAT || !GIST_ID) return null;
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GITHUB_PAT}` }
  });
  if (!res.ok) return null;
  const gist = await res.json();
  const content = gist.files?.['strategy_state.json']?.content;
  return content ? JSON.parse(content) : null;
}

async function notifyDiscord(message, color = 0x888888) {
  if (!DISCORD_WEBHOOK) return;
  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: DRY_RUN ? '🧪 [V2-LTC] DRY RUN' : '💹 [V2-LTC] EXECUTION',
        description: message,
        color,
        timestamp: new Date().toISOString()
      }]
    }),
  });
}

async function runExecutionCycle() {
  const state = await getStrategyState();
  if (!state) throw new Error('Strategy state not found in Gist');

  const { price, Z_score, RSI_14, signal: botSignal } = state;
  let action = botSignal === 'BUY' || botSignal === 'SELL' ? botSignal : 'HOLD';
  let reason = `AI/Quants Signal: ${botSignal} (Z=${Z_score?.toFixed(2)}, RSI=${RSI_14?.toFixed(1)})`;

  let orderResult = null;
  if (action !== 'HOLD') {
    if (!DRY_RUN) {
      const ltcAmount = (TRADE_AMOUNT / price).toFixed(2);
      orderResult = await rakutenRequest('POST', '/api/v1/cfd/order', {
        symbolId: LTC_SYMBOL_ID,
        side: action,
        amount: parseFloat(ltcAmount),
        type: 'MARKET',
        behavior: 'NEW'
      });
    }
  }

  const color = action === 'BUY' ? 0xf15a24 : action === 'SELL' ? 0x000000 : 0x888888;
  const message = [
    `**LTC/JPY**: ¥${price.toLocaleString()}`,
    `**Action**: ${action}`,
    `**Reason**: ${reason}`,
    orderResult ? `**Result**: \`${JSON.stringify(orderResult)}\`` : ''
  ].join('\n');

  await notifyDiscord(message, color);
  return { ok: true, action, price, reason, orderResult };
}

// ---- Vercel Handler ----
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 簡易セキュリティ: シークレットトークンで保護
  const token = req.headers['x-trade-secret'] || req.body?.secret;
  const expectedToken = process.env.TRADE_SECRET;
  if (expectedToken && token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runTradeCycle();
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('Trade cycle error:', err);
    await notifyDiscord(`❌ エラーが発生しました: ${err.message}`, 0xff0000).catch(() => {});
    return res.status(500).json({ ok: false, error: err.message });
  }
}
