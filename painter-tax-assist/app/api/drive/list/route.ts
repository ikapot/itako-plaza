import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

export async function GET() {
  const session = await getServerSession() as any;
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 1. 'Receipts' フォルダを探す
    const folderRes = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and name = 'Receipts' and trashed = false",
      fields: "files(id, name)",
    });

    let folderId = folderRes.data.files?.[0]?.id;
    
    if (!folderId) {
      logger.info("ℹ️ 'Receipts' フォルダが見つからないため、新規作成します。");
      const newFolder = await drive.files.create({
        requestBody: {
          name: 'Receipts',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = newFolder.data.id;
      return NextResponse.json([]); // 作成直後なので空を返す
    }

    // 2. フォルダ内の画像をリスト
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed = false`,
      fields: "files(id, name, mimeType, createdTime, thumbnailLink)",
      orderBy: "createdTime desc"
    });

    return NextResponse.json(response.data.files || []);
  } catch (error: any) {
    console.error('Drive API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
