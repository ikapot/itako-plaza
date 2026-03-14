// Aozora Bunko Local Integration

/**
 * 整理されたローカルの青空文庫テキストから、著者のデータをランダムに読み込む
 * Vite dev serverのカスタムプラグイン(/api/aozora/:author)を利用
 */
export const fetchAozoraContext = async (authorName) => {
    if (!authorName) return null;
    
    try {
        const response = await fetch(`/api/aozora/${encodeURIComponent(authorName)}`);
        
        if (!response.ok) {
            if (response.status === 404) {
               console.log(`[Aozora] No texts found for author: ${authorName}`);
               return null;
            }
            throw new Error(`Aozora fetch failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.texts || data.texts.length === 0) return null;

        // ランダムに選ばれたテキストからコンテキストを組み立てる
        let contextBlock = `【青空文庫からの生きた霊脈（${authorName}の著作）】\n`;
        data.texts.forEach(t => {
            contextBlock += `\n--- 作品斷片: ${t.title} ---\n${t.excerpt}\n`;
        });

        console.log(`[Aozora] Successfully loaded ${data.texts.length} text fragments for ${authorName}`);
        return contextBlock;
    } catch (error) {
        console.error("Aozora Context Error:", error);
        return null;
    }
};
