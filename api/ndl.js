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
        const baseUrl = "https://iss.ndl.go.jp/api/opensearch";
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
                items.push({
                    id: `ndl-${Math.random().toString(36).substr(2, 9)}`,
                    title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ""),
                    author: authorMatch ? authorMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "") : "Unknown Author",
                    quote: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 100) + "..." : "時を経て、この記述があなたの言葉に呼応しています。",
                    link: linkMatch ? linkMatch[1] : "#",
                    year: dateMatch ? dateMatch[1] : ""
                });
            }
        }

        // If no results, return a more poetic fallback than an error
        if (items.length === 0) {
            return res.status(200).json([{
                id: 'ndl-fallback',
                title: "沈黙する書架",
                author: "Archives of Silence",
                quote: `「${keyword}」についての記録は、まだこの書庫には見当たりません。`,
                link: "#"
            }]);
        }

        return res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
