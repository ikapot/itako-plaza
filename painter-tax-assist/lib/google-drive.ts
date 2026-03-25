import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Google OAuth2 クライアントの初期化
 * 環境変数: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 */
export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
  );
};

/**
 * 認証URLの生成
 */
export function getAuthUrl() {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
    prompt: "consent"
  });
}

/**
 * 特定のフォルダから画像ファイル（レシート）の一覧を取得
 * @param auth 認証済みの OAuth2Client
 * @param folderName フォルダ名 (例: 'Receipts')
 */
export async function listFilesFromFolder(auth: OAuth2Client, folderName: string = "Receipts") {
  const drive = google.drive({ version: "v3", auth });
  
  try {
    // 1. フォルダの ID を検索
    const folderRes = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
      fields: "files(id, name)",
    });

    const folderId = folderRes.data.files?.[0]?.id;
    if (!folderId) {
      console.warn(`Folder '${folderName}' not found.`);
      return [];
    }

    // 2. フォルダ内の画像ファイルをリストアップ
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed = false`,
      fields: "files(id, name, mimeType, createdTime, thumbnailLink, webContentLink)",
      orderBy: "createdTime desc"
    });

    return response.data.files || [];
  } catch (error) {
    console.error("Google Drive List Error:", error);
    return [];
  }
}

/**
 * ファイルの中身を取得（Gemini解析用）
 */
export async function getFileContentBuffer(auth: OAuth2Client, fileId: string) {
  const drive = google.drive({ version: "v3", auth });
  try {
    const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
    return Buffer.from(res.data as ArrayBuffer);
  } catch (error) {
    console.error("Fetch Buffer Error:", error);
    return null;
  }
}
