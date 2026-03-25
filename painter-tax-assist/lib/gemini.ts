import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ExtractionResult {
  date: string;       // YYYY/MM/DD
  shop: string;       // 店名 / 発行元
  totalAmount: number; // 合計金額
  category: string;    // 勘定科目 (画家向け)
  description: string; // 内容 (例: カドミウムレッド, F50キャンバス等)
}

/**
 * 画像からレシート情報を抽出（画家/個人事業主向け）
 */
export async function extractReceiptData(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    あなたは、画家のための非常に優秀な経理アシスタント（青色申告・確定申告支援）です。
    提供されたレシート画像を詳細に読み取り、画家の創作活動を考慮した上で、以下の項目を日本語のJSON形式で正確に抽出してください。

    【抽出項目】
    - date: 日付 (YYYY/MM/DD)
    - shop: 店名 / 発行元
    - totalAmount: 合計金額 (数値のみ)
    - category: 勘定科目 (以下のルールを厳守)
      1. 世界堂や文房具店など『画材店』での購入 -> 「消耗品費」
      2. ギャラリー、美術館、アトリエへの移動費 -> 「旅費交通費」
      3. 美術展のチケット、図録、画集の購入 -> 「取材費」
      4. 画廊の手数料、展覧会出品料、額装代 -> 「支払手数料」
      5. 顧客や関係者との飲食、会食 -> 「接待交際費」
      6. その他一般的な事務用品 -> 「消耗品費」
    - description: 内容 (例: カドミウムレッド、F50キャンバス、美術館チケット 等)

    【重要ルール】
    - 出力はJSONのみとしてください。余計な文章は一切含めないでください。
    - 画家の活動を深く理解し、創作にまつわる経費を適切に分類してください。
    - 数字が見えにくい場合は null を返してください。
    
    フォーマット:
    {
      "date": "...",
      "shop": "...",
      "totalAmount": 0,
      "category": "...",
      "description": "..."
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType,
        },
      },
    ]);

    const text = result.response.text();
    // JSONのパース（バックチックスをトリム）
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr) as ExtractionResult;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
}
