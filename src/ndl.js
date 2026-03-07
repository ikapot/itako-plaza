/**
 * 国立国会図書館 (NDL) OpenSearch API 連携
 */
export const searchNDLArchive = async (keyword) => {
    if (!keyword) return [];

    try {
        const baseUrl = "/api/ndl";
        const query = `?keyword=${encodeURIComponent(keyword)}`;

        // プロキシ経由でアクセス
        const response = await fetch(baseUrl + query);

        if (!response.ok) throw new Error("NDL Access Failed");

        const data = await response.json();
        return data;
    } catch (error) {
        // 連携失敗時の文学的フォールバック（深淵のアーカイブ）
        return [
            {
                id: `ndl-${Date.now()}-2`,
                author: "NDL Archive",
                title: `「${keyword}」の断片`,
                quote: "書庫の奥深くで、カビの臭いと共に沈黙していた記録。それはあなたの問いかけに、かすかな震えで答えた。",
                ref: "消えかけた書誌情報"
            }
        ];
    }
};
