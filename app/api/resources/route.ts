import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "private/resources");

  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const folders = files
      .filter((file) => file.isDirectory())
      .map((file) => file.name);
    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}