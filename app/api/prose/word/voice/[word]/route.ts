import { NextRequest, NextResponse } from 'next/server';
import { getEnglishWordVoice } from '@/lib/youdao';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ word: string }> }
) {
  try {
    const { word } = await context.params;
    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }
    const audioBuffer = await getEnglishWordVoice(word);
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error(`Error getting word voice: ${error}`);
    return NextResponse.json({ error: 'Failed to get word voice' }, { status: 500 });
  }
}