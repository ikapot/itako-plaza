export default async function handler(req, res) {
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
        const baseUrl = "https://ndlsearch.ndl.go.jp/api/opensearch";
        // mediatype=1 (books), cnt=5
        const query = `?cnt=5&mediatype=1&title=${encodeURIComponent(keyword)}`;

        const response = await fetch(baseUrl + query);

        if (!response.ok) {
            throw new Error("NDL Access Failed");
        }

        const xmlData = await response.text();
        
        // Simple XML parsing using regex for the serverless environment
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlData)) !== null) {
            const itemContent = match[1];
            
            const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
            const authorMatch = itemContent.match(/<author>([\s\S]*?)<\/author>/) || itemContent.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/);
            const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
            const descriptionMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
            const dateMatch = itemContent.match(/<dc:date>([\s\S]*?)<\/dc:date>/);

            if (titleMatch) {
                const rawLink = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "#";
                items.push({
                    id: `ndl-${Math.random().toString(36).substr(2, 9)}`,
                    title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
                    creator: authorMatch ? authorMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "著者不明",
                    author: authorMatch ? authorMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "著者不明", // 互換性のため両方保持
                    quote: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 100) + "..." : "時を経て、この記述があなたの言葉に呼応しています。",
                    link: rawLink,
                    issued: dateMatch ? dateMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "",
                    year: dateMatch ? dateMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "" // 互換性のため両方保持
                });
            }
        }

        // If no results, return a poetic fallback
        if (items.length === 0) {
            return res.status(200).json([{
                id: 'ndl-fallback',
                title: "沈黙する書架",
                creator: "Archives of Silence",
                author: "Archives of Silence",
                quote: `「${keyword}」についての記録は、まだこの書庫には見当たりません。`,
                link: "#",
                issued: "Deep Archive",
                year: "Deep Archive"
            }]);
        }

        return res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
