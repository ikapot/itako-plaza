// api/ping.js — 疎通確認用の最シンプルなエンドポイント
export default async function handler(req, res) {
  return res.status(200).json({ ok: true, message: 'pong', time: new Date().toISOString() });
}
