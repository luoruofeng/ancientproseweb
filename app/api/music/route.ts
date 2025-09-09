import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), 'public', 'background_music');
    const filenames = fs.readdirSync(musicDir);
    const mp3Files = filenames.filter((file) => file.endsWith('.mp3'));
    return NextResponse.json(mp3Files);
  } catch (error) {
    console.error('Error reading music directory:', error);
    return NextResponse.json({ error: 'Failed to read music files' }, { status: 500 });
  }
}