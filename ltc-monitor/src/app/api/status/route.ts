import { NextResponse } from 'next/server';
import { fetchTradeStatus } from '../../../lib/gist';

export async function GET() {
  try {
    const data = await fetchTradeStatus();
    if (!data) {
      // Return 200 with error info to prevent frontend crashes/severed errors
      return NextResponse.json({ 
        error: 'Gist data not found. Ensure engine is running and GIST_ID/GITHUB_PAT are correct.' 
      }, { status: 200 });
    }
    return NextResponse.json(data);
  } catch (error) {
    // Return 200 even on catch to stay robust
    return NextResponse.json({ 
      error: `Internal Server Error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 200 });
  }
}
