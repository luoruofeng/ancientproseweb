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
    
    // 排除 prop.json 文件
    const filteredFiles = files.filter(file => file !== 'prop.json');
    
    // 尝试读取 prop.json 文件来获取排序信息
    const propJsonPath = path.join(directoryPath, 'prop.json');
    let sortedFiles = filteredFiles;
    
    if (fs.existsSync(propJsonPath)) {
      try {
        const propJsonContent = fs.readFileSync(propJsonPath, 'utf-8');
        const propData = JSON.parse(propJsonContent);
        
        if (propData.sort && Array.isArray(propData.sort)) {
          // 按照 prop.json 中的 sort 字段排序
          const sortOrder = propData.sort;
          sortedFiles = sortOrder.filter((fileName: string) => filteredFiles.includes(fileName));
          
          // 添加任何不在 sort 列表中但存在于目录中的文件
          const remainingFiles = filteredFiles.filter(file => !sortOrder.includes(file));
          sortedFiles = [...sortedFiles, ...remainingFiles];
        }
      } catch (parseError) {
        console.warn(`Failed to parse prop.json for ${dirname}:`, parseError);
        // 如果解析失败，使用原始文件列表
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