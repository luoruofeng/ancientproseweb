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
    const propJsonPath = path.join(directoryPath, 'prop.json');
    let sortedFiles: string[] = [];

    if (fs.existsSync(propJsonPath)) {
      try {
        const propJsonContent = fs.readFileSync(propJsonPath, 'utf-8');
        const propData = JSON.parse(propJsonContent);

        if (propData.sort && Array.isArray(propData.sort)) {
          const sortOrder = propData.sort as string[];
          const subdirectories = fs.readdirSync(directoryPath, { withFileTypes: true })
                                  .filter(dirent => dirent.isDirectory())
                                  .map(dirent => dirent.name);

          sortedFiles = sortOrder.filter(item => subdirectories.includes(item));
        }
      } catch (parseError) {
        console.warn(`Failed to parse prop.json for ${dirname}:`, parseError);
      }
    }

    return NextResponse.json(sortedFiles);
  } catch (error) {
    return NextResponse.json(
      { error: `Directory not found for ${dirname}` },
      { status: 404 }
    );
  }
}