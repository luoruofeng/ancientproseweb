import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dirname: string }> }
) {
  const { dirname } = await params;
  const directoryPath = path.join(
    process.cwd(),
    "private",
    "resources",
    dirname
  );

  try {
    const files = fs.readdirSync(directoryPath);
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { error: `Directory not found for ${dirname}` },
      { status: 404 }
    );
  }
}