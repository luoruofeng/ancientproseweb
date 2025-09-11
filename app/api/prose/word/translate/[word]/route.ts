import { NextRequest, NextResponse } from 'next/server';
import { translateWord } from '@/lib/youdao';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ word: string }> }
) {
  try {
    const { word } = await context.params;
    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }
    const translations = await translateWord(word);
    return NextResponse.json(translations);
  } catch (error) {
    console.error(`Error translating word: ${error}`);
    return NextResponse.json({ error: 'Failed to translate word' }, { status: 500 });
  }
}