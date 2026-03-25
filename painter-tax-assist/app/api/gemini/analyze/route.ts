import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { extractReceiptData } from '../../../../lib/gemini';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

export async function POST(req: Request) {
  const session = await getServerSession() as any;
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
  }

  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 1. Google Drive から画像データを取得
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    const metaRes = await drive.files.get({ fileId, fields: 'mimeType' });
    
    const buffer = Buffer.from(res.data as ArrayBuffer);
    const mimeType = metaRes.data.mimeType || 'image/jpeg';

    // 2. Gemini で解析
    const analysis = await extractReceiptData(buffer, mimeType);

    if (!analysis) {
      return NextResponse.json({ error: 'AIによる解析に失敗しました。画像が鮮明か確認してください。' }, { status: 500 });
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
