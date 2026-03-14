import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

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
        const iconv = require('iconv-lite'); // Dynamically require iconv
        
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

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), aozoraPlugin()],
})
