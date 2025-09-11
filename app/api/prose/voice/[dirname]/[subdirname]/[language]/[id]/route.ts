import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      dirname: string;
      subdirname: string;
      language: string;
      id: string;
    }>;
  }
) {
  const { dirname, subdirname, language, id } = await context.params;

  // According to the user, the folder path is determined by the first two parameters of the url path.
  const folderPath = path.join(
    process.cwd(),
    "private",
    "resources",
    dirname,
    subdirname
  );

  // According to the user, the mp3 file name is [subdirname]-[language]_[id].mp3.
  const fileName = `${subdirname}-${language}_${id}.mp3`;
  const filePath = path.join(folderPath, fileName);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}