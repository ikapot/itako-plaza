import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import iconv from 'iconv-lite'

const aozoraPlugin = () => ({
  name: 'aozora-api',
  configureServer(server) {
    server.middlewares.use('/api/aozora', (req, res, next) => {
      if (req.method !== 'GET') return next();
      try {
        const decodedUrl = decodeURIComponent(req.url);
        const author = decodedUrl.replace(/^\//, '').split('?')[0];
        
        if (!author) {
            res.statusCode = 400;
            return res.end('Author required');
        }
        
        // 整理された青空文庫ディレクトリへの絶対パス
        const baseDir = 'C:\\Users\\ikapo\\Downloads\\aozora\\extracted';
        const authorDir = path.join(baseDir, author);
        
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*'); // localhost CORS対応
        
        if (!fs.existsSync(authorDir)) {
           res.statusCode = 404;
           return res.end(JSON.stringify({ error: 'Author folder not found', author }));
        }
        
        const files = fs.readdirSync(authorDir).filter(f => f.endsWith('.txt'));
        if (files.length === 0) {
           res.statusCode = 404;
           return res.end(JSON.stringify({ error: 'No files found', author }));
        }
        
        // ランダムに最大3ファイルを選び、その冒頭1500文字を抽出する
        const selected = files.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        const results = selected.map(file => {
           let buffer = fs.readFileSync(path.join(authorDir, file));
           let content = iconv.decode(buffer, 'Shift_JIS');
           
           if (content.includes('\uFFFD') && buffer.toString('utf8').length > 0) {
               content = buffer.toString('utf8'); // Fallback
           }
           
           // Shift-JIS変換の名残やゴミを取る簡易パース（念のため）
           const lines = content.split('\n')
                .filter(l => l.trim().length > 0 && !l.includes('---'))
                .slice(0, 50); // 最初の方だけ
                
           return {
              title: file.replace('.txt', ''),
              excerpt: lines.join('\n').substring(0, 1500)
           };
        });
        
        res.statusCode = 200;
        res.end(JSON.stringify({ author, texts: results }));
      } catch (e) {
        console.error("Aozora API Error:", e);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
})
const ndlPlugin = () => ({
  name: 'ndl-api',
  configureServer(server) {
    server.middlewares.use('/api/ndl', async (req, res, next) => {
      if (req.method !== 'GET') return next();
      
      try {
        const searchParams = new URL(req.url, 'http://localhost').searchParams;
        const keyword = searchParams.get('keyword');
        if (!keyword) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Keyword is required' }));
        }

        const baseUrl = "https://ndlsearch.ndl.go.jp/api/opensearch";
        const query = `?cnt=8&mediatype=1&title=${encodeURIComponent(keyword)}`;
        const digitalQuery = `?cnt=5&mediatype=9&title=${encodeURIComponent(keyword)}`;
        
        const [res1, res2] = await Promise.all([
           fetch(baseUrl + query),
           fetch(baseUrl + digitalQuery)
        ]);
        
        const xmlData = (await res1.text()) + (await res2.text());
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlData)) !== null) {
          const itemContent = match[1];
          const getVal = (tag) => {
            const m = itemContent.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)) || 
                      itemContent.match(new RegExp(`<dc:${tag}>([\\s\\S]*?)<\\/dc:${tag}>`));
            return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
          };

          const title = getVal('title');
          if (title) {
            const rawLink = getVal('link') || "#";
            let description = getVal('description');
            let finalLink = rawLink.startsWith('http') ? rawLink : `https://ndlsearch.ndl.go.jp/books/${rawLink}`;

            if (description.includes("青空文庫")) {
               description = `【青空文庫】${description}`;
               const extLink = getVal('dcndl:extLink');
               if (extLink) finalLink = extLink;
            }
            
            items.push({
              id: `ndl-${Math.random().toString(36).substr(2, 9)}`,
              title,
              creator: getVal('author') || getVal('creator') || "Unknown Author",
              quote: description.substring(0, 100) + (description.length > 100 ? "..." : ""),
              link: finalLink,
              issued: getVal('date') || "Unknown Date"
            });
          }
        }

        const uniqueItems = items.reduce((acc, current) => {
          if (!acc.find(item => item.title === current.title)) acc.push(current);
          return acc;
        }, []);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = 200;
        res.end(JSON.stringify(uniqueItems));
      } catch (e) {
        console.error("NDL Proxy Error:", e);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), aozoraPlugin(), ndlPlugin()],
})
