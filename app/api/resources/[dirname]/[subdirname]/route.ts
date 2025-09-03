import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dirname: string; subdirname: string }> }
) {
  const { dirname, subdirname } = await params;
  
  // 直接使用完整路径：dirname/subdirname
  const fullPath = path.join(
    process.cwd(),
    "private",
    "resources",
    dirname,
    subdirname
  );
  
  console.log(`Reading directory: ${fullPath}`);

  try {
    // 读取目录下的所有文件
    const files = fs.readdirSync(fullPath);
    
    // 过滤出jsonl文件
    const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
    
    // 按照文件名中-后面的数字排序
    const sortedFiles = jsonlFiles.sort((a, b) => {
      // 提取文件名（去掉.jsonl扩展名）
      const nameA = a.replace('.jsonl', '');
      const nameB = b.replace('.jsonl', '');
      
      // 按-分割，取后半部分
      const partsA = nameA.split('-');
      const partsB = nameB.split('-');
      
      // 获取最后一部分的数字
      const numA = parseInt(partsA[partsA.length - 1]) || 0;
      const numB = parseInt(partsB[partsB.length - 1]) || 0;
      
      return numA - numB;
    });
    
    console.log(`Found ${sortedFiles.length} jsonl files:`, sortedFiles);
    
    return NextResponse.json(sortedFiles);
  } catch (error) {
    console.error(`Error reading directory ${fullPath}:`, error);
    return NextResponse.json(
      { error: `Directory not found: ${fullPath}` },
      { status: 404 }
    );
  }
}