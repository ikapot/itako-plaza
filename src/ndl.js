/**
 * 国立国会図書館 (NDL) OpenSearch API 連携
 */
export const searchNDLArchive = async (keyword) => {
    if (!keyword) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const baseUrl = "/api/ndl";
        const query = `?keyword=${encodeURIComponent(keyword)}`;

        // プロキシ経由でアクセス、タイムアウト付き
        const response = await fetch(baseUrl + query, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`NDL Access Failed: [${response.status}] ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("[API Error] NDL Integration:", error);
        // 連携失敗時の文学的フォールバック（深淵のアーカイブ）
        return [
            {
                id: `ndl-${Date.now()}-2`,
                author: "System Error",
                title: `「${keyword}」に関する検索の失敗`,
                quote: "APIエンドポイントからの応答が途絶。ネットワークの深淵に要求が吸い込まれました。",
                ref: error.name === 'AbortError' ? "Timeout" : "Connection Refused"
            }
        ];
    }
};
