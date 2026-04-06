// api/trade.js — 楽天ウォレット 自動売買エンドポイント (Vercel Serverless)
// 戦略: 前回比較型（シンプル推奨）
//   - 前回より BUY_THRESHOLD % 以上下落 → 買い
//   - 前回より SELL_THRESHOLD % 以上上昇 → 売り

import crypto from 'crypto';

// ---- 設定値 ----
const RAKUTEN_BASE = 'https://exchange.rakuten-wallet.co.jp';
const BTC_SYMBOL_ID = 7; // BTC/JPY
const BUY_THRESHOLD  = parseFloat(process.env.BUY_THRESHOLD  || '1.5'); // % 下落で買い
const SELL_THRESHOLD = parseFloat(process.env.SELL_THRESHOLD || '2.0'); // % 上昇で売り
const TRADE_AMOUNT   = parseFloat(process.env.TRADE_AMOUNT_JPY || '1000'); // JPY
const DRY_RUN        = process.env.DRY_RUN !== 'false'; // デフォルトはドライラン

const WALLET_API_KEY    = process.env.WALLET_API_KEY    || '';
const WALLET_API_SECRET = process.env.WALLET_API_SECRET || '';
const DISCORD_WEBHOOK   = process.env.DISCORD_WEBHOOK_URL || '';
const GITHUB_PAT        = process.env.GITHUB_PAT_GIST   || '';
const GIST_ID           = process.env.GIST_ID           || '';

// ---- 楽天ウォレット HMAC 署名 ----
function getSignature(nonce, method, pathOrBody) {
  const message = method === 'GET'
    ? `${nonce}${pathOrBody}` // GET → nonce + path
    : `${nonce}${pathOrBody}`; // POST → nonce + body
  return crypto.createHmac('sha256', WALLET_API_SECRET)
    .update(message).digest('hex');
}

async function rakutenRequest(method, path, body = null) {
  const nonce = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const signTarget = method === 'GET' ? path : bodyStr;
  const sig = getSignature(nonce, method, signTarget);

  const res = await fetch(`${RAKUTEN_BASE}${path}`, {
    method,
    headers: {
      'API-KEY': WALLET_API_KEY,
      'NONCE': nonce,
      'SIGNATURE': sig,
      'Content-Type': 'application/json',
    },
    body: body ? bodyStr : undefined,
  });

  const data = await res.json().catch(() => ({ error: 'parse_error' }));
  if (!res.ok) throw Object.assign(new Error(`Rakuten API Error ${res.status}`), { data });
  return data;
}

// ---- 公開ティッカー (認証不要) ----
async function getTicker() {
  const res = await fetch(`${RAKUTEN_BASE}/api/v1/ticker?symbolId=${BTC_SYMBOL_ID}`);
  if (!res.ok) throw new Error(`Ticker fetch failed: ${res.status}`);
  return res.json();
}

// ---- GitHub Gist 状態管理 ----
const GIST_FILE = 'trade_state.json';

async function loadState() {
  if (!GITHUB_PAT || !GIST_ID) {
    console.warn('⚠️ GITHUB_PAT_GIST または GIST_ID が未設定です。');
    return { lastPrice: null, lastAction: null, lastTradeAt: null };
  }
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GITHUB_PAT}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!res.ok) return { lastPrice: null, lastAction: null, lastTradeAt: null };
  const gist = await res.json();
  const fileContent = gist.files?.[GIST_FILE]?.content;
  if (!fileContent) return { lastPrice: null, lastAction: null, lastTradeAt: null };
  try { return JSON.parse(fileContent); } catch { return { lastPrice: null, lastAction: null, lastTradeAt: null }; }
}

async function saveState(state) {
  if (!GITHUB_PAT || !GIST_ID) return;
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GITHUB_PAT}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(state, null, 2) } } }),
  });
}

// ---- Discord 通知 ----
async function notifyDiscord(content, color = 0x888888) {
  if (!DISCORD_WEBHOOK) return;
  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: DRY_RUN ? '🧪 [DRY RUN] 取引シグナル' : '💹 取引シグナル',
        description: content,
        color,
        timestamp: new Date().toISOString(),
        footer: { text: 'Itako Plaza AutoTrader v3' }
      }]
    }),
  });
}

// ---- メインロジック ----
async function runTradeCycle() {
  const [ticker, state] = await Promise.all([getTicker(), loadState()]);

  const currentPrice = parseFloat(ticker.last || ticker.ltp || ticker.close);
  if (isNaN(currentPrice)) throw new Error(`価格の取得に失敗しました: ${JSON.stringify(ticker)}`);

  const lastPrice = state.lastPrice;
  let action = 'HOLD';
  let reason = '';

  if (lastPrice) {
    const changePercent = ((currentPrice - lastPrice) / lastPrice) * 100;
    const changeFmt = changePercent.toFixed(2);

    if (changePercent <= -BUY_THRESHOLD) {
      action = 'BUY';
      reason = `前回比 ${changeFmt}% 下落（閾値: -${BUY_THRESHOLD}%）`;
    } else if (changePercent >= SELL_THRESHOLD) {
      action = 'SELL';
      reason = `前回比 +${changeFmt}% 上昇（閾値: +${SELL_THRESHOLD}%）`;
    } else {
      reason = `前回比 ${changeFmt}% → シグナルなし（買い閾値: -${BUY_THRESHOLD}%, 売り閾値: +${SELL_THRESHOLD}%）`;
    }
  } else {
    reason = '初回実行 → 価格を記録しました（次回から判定開始）';
  }

  let orderResult = null;
  let color = 0x888888; // gray = HOLD

  if (action === 'BUY' || action === 'SELL') {
    color = action === 'BUY' ? 0x00cc44 : 0xff4444;

    if (!DRY_RUN) {
      // BTCの取引量に変換（概算）
      const btcAmount = (TRADE_AMOUNT / currentPrice).toFixed(6);
      try {
        orderResult = await rakutenRequest('POST', '/api/v1/cfd/order', {
          symbolId: BTC_SYMBOL_ID,
          side: action,
          amount: parseFloat(btcAmount),
          type: 'MARKET',
        });
      } catch (e) {
        orderResult = { error: e.message };
      }
    }
  }

  const newState = {
    lastPrice: currentPrice,
    lastAction: action,
    lastTradeAt: new Date().toISOString(),
  };
  await saveState(newState);

  const message = [
    `**BTC/JPY**: ¥${currentPrice.toLocaleString()}`,
    `**アクション**: ${action}`,
    `**理由**: ${reason}`,
    DRY_RUN ? '*（DRY RUN モード: 実際の注文は出ていません）*' : '',
    orderResult ? `**注文結果**: \`${JSON.stringify(orderResult)}\`` : '',
  ].filter(Boolean).join('\n');

  await notifyDiscord(message, color);

  return { action, currentPrice, reason, dryRun: DRY_RUN, orderResult };
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
