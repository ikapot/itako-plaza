import { TradeStatus } from '../types/trade';

export async function fetchTradeStatus(): Promise<TradeStatus | null> {
  const gistId = process.env.GIST_ID;
  const pat = process.env.GITHUB_PAT;

  if (!gistId) return null;

  try {
    const headers: HeadersInit = {};
    if (pat) {
      headers['Authorization'] = `token ${pat}`;
    }

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);

    const gistData = await res.json();
    const file = gistData.files['strategy_state.json'];
    
    if (!file || !file.content) return null;

    return JSON.parse(file.content) as TradeStatus;
  } catch (error) {
    console.error('Error fetching trade status:', error);
    return null;
  }
}
