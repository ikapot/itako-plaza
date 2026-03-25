import Encoding from 'encoding-japanese';
import { ExtractionResult } from "./gemini";

/**
 * 円簿会計（弥生会計データCSV形式）に準拠した25列のCSVを生成
 */
export function generateEnboCSV(data: ExtractionResult[], creditAccount: string = "現金"): string {
  // 弥生形式の25項目ヘッダー（通常は不要だが、項目順を把握するために列挙）
  // 0:識別フラグ, 1:伝票No, 2:決算, 3:取引日付, 4:借方勘定科目, 5:借方補助科目, 6:借方部門, 7:借方税区分, 8:借方金額, 9:借方消費税額, 
  // 10:貸方勘定科目, 11:貸方補助科目, 12:貸方部門, 13:貸方税区分, 14:貸方金額, 15:貸方消費税額, 16:摘要, 17:番号, 18:期日, 19:タイプ, 20:生成元, 21:仕訳メモ, 22:付箋, 23:調整, 24:空白
  
  const rows = data.map(item => {
    const date = item.date.replace(/\//g, "-");
    const shopMemo = `【${item.shop}】${item.description}`.substring(0, 64); // 摘要の制限
    
    // 25列の配列を構築
    const columns = [
      "2111",              // 0: 識別コード (単一仕訳)
      "",                  // 1: 伝票No (自動)
      "",                  // 2: 決算 (通常)
      date,                // 3: 取引日付 (YYYY-MM-DD)
      item.category,       // 4: 借方勘定科目 (消耗品費, 旅費交通費等)
      "",                  // 5: 借方補助科目
      "",                  // 6: 借方部門
      "課税仕入10%",        // 7: 借方税区分 (画材や経費は標準で課税10%と仮定)
      item.totalAmount,    // 8: 借方金額
      "",                  // 9: 借方消費税額 (自動計算)
      creditAccount,       // 10: 貸方勘定科目 (現金等)
      "",                  // 11: 貸方補助科目
      "",                  // 12: 貸方部門
      "対象外",            // 13: 貸方税区分 (現金等は対象外)
      item.totalAmount,    // 14: 貸方金額
      "",                  // 15: 貸方消費税額
      shopMemo,            // 16: 摘要
      "",                  // 17: 番号
      "",                  // 18: 期日
      "0",                 // 19: タイプ
      "",                  // 20: 生成元
      "",                  // 21: 仕訳メモ
      "",                  // 22: 付箋
      "no",                // 23: 調整
      ""                   // 24: 空白
    ];

    // 各項目をダブルクォーテーションで囲む
    return columns.map(col => `"${col}"`).join(",");
  });

  return rows.join("\r\n"); // Windows (Shift-JIS環境) 準拠のCRLF
}

/**
 * 文字コードを Shift-JIS に変換してブラウザでダウンロード
 */
export function downloadShiftJISCSV(csvContent: string, filename: string = "enbo_painter_tax.csv") {
  // 1. Unicode文字列をUTF-8配列に
  const unicodeArray = Encoding.stringToCode(csvContent);
  
  // 2. Shift-JISに変換
  const sjisCodeArray = Encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE'
  });
  
  // 3. Uint8Array にして Blob 作成
  const sjisUint8 = new Uint8Array(sjisCodeArray);
  const blob = new Blob([sjisUint8], { type: "text/csv;charset=shift-jis;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
