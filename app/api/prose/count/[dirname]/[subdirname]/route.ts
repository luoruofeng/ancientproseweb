import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getTotalJsonlObjectCount } from "@/lib/jsonl";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dirname: string; subdirname: string }> }
) {
  try {
    const { dirname, subdirname } = await params;

    // 构建文件夹的完整路径
    const folderPath = path.join(
      process.cwd(),
      "private",
      "resources",
      dirname,
      subdirname
    );

    // 获取总对象数量
    const totalCount = getTotalJsonlObjectCount(folderPath);

    return NextResponse.json({ count: totalCount });
  } catch (error) {
    console.error("Error getting total count:", error);
    return NextResponse.json(
      { error: "Failed to get total count" },
      { status: 500 }
    );
  }
}