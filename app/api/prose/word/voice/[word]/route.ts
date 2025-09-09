import { NextResponse } from 'next/server';
import { getEnglishWordVoice } from '@/lib/youdao';

export async function GET(
  request: Request,
  { params }: { params: { word: string } }
) {
  try {
        const word = (await params).word;
    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }
    const audioBuffer = await getEnglishWordVoice(word);
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error(`Error getting word voice: ${error}`);
    return NextResponse.json({ error: 'Failed to get word voice' }, { status: 500 });
  }
}