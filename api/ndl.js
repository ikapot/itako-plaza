export default async function handler(req, res) {
    // CORSヘッダーの設定（Vercel等のサーバーレス環境用）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    try {
        const baseUrl = "https://iss.ndl.go.jp/api/opensearch";
        const query = `?cnt=3&mediatype=1&title=${encodeURIComponent(keyword)}`;

        const response = await fetch(baseUrl + query);

        if (!response.ok) {
            throw new Error("NDL Access Failed");
        }

        const xmlData = await response.text();
        // NDLはXMLを返すが、クライアント側で処理するためここではそのまま返すか、
        // あるいは通信成功のダミーを返す。ここでは元の動作に合わせてダミーJSONを返す。
        return res.status(200).json([
            {
                id: `ndl-${Date.now()}-1`,
                title: `${keyword}に関する書誌`,
                author: "国立国会図書館",
                quote: "この記録は時を超えて、あなたの言葉に呼応している。",
                ref: "NDL Digital Collection"
            }
        ]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
