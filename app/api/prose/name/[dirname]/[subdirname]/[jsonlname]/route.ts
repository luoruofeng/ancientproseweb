import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readJsonlFile } from "@/lib/jsonl";
import { AncientProseData } from "@/lib/serialization";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dirname: string; subdirname: string; jsonlname: string }> }
) {
  const { dirname, subdirname, jsonlname } = await params;
  
  // 构建jsonl文件的完整路径
  const filePath = path.join(
    process.cwd(),
    "private",
    "resources",
    dirname,
    subdirname,
    `${jsonlname}.jsonl`
  );
  
  console.log(`Reading JSONL file: ${filePath}`);

  try {
    // 使用readJsonlFile方法读取文件内容
    const jsonObjects = await readJsonlFile(filePath);
    
    console.log(`Found ${jsonObjects.length} objects in JSONL file`);
    
    // 遍历对象数组，使用AncientProseData.fromObject方法转换为AncientProseData数组
    const ancientProseDataArray: AncientProseData[] = jsonObjects.map((obj, index) => {
      try {
        return AncientProseData.fromObject(obj);
      } catch (error) {
        console.warn(`Failed to convert object at index ${index}:`, error);
        // 返回一个默认的AncientProseData对象，或者可以选择跳过这个对象
        return new AncientProseData();
      }
    });
    
    console.log(`Successfully converted ${ancientProseDataArray.length} objects to AncientProseData`);
    
    return NextResponse.json(ancientProseDataArray);
  } catch (error) {
    console.error(`Error reading JSONL file ${filePath}:`, error);
    return NextResponse.json(
      { error: `Failed to read JSONL file: ${filePath}` },
      { status: 404 }
    );
  }
}