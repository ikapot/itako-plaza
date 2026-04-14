import { NextResponse } from 'next/server';
import { fetchTradeStatus } from '../../../lib/gist';

export async function GET() {
  try {
    const data = await fetchTradeStatus();
    if (!data) {
      return NextResponse.json(
        { error: 'Gist data not found. Check GIST_ID and GITHUB_PAT.' }, 
        { status: 500 }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
