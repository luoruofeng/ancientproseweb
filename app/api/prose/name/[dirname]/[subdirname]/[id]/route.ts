import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readJsonlFile, getJsonlFilesSorted, getJsonlObjectCount } from "@/lib/jsonl";
import { AncientProseData } from "@/lib/serialization";

/**
 * GET API路由处理函数
 * 根据提供的ID获取单个古文数据项
 * 
 * @param request - Next.js请求对象
 * @param params - 路由参数对象
 * @param params.dirname - 目录名，用于路径拼接
 * @param params.subdirname - 子目录名，用于路径拼接
 * @param params.id - 要获取的AncientProseData对象的id
 * @returns 返回单个AncientProseData对象的JSON响应
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dirname: string; subdirname: string; id: string }> }
) {
  // 解构获取路由参数
  const { dirname, subdirname, id } = await params;
  
  // 将id转换为数字，用于后续计算文件索引
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json(
      { error: `Invalid id parameter: ${id}` },
      { status: 400 }
    );
  }
  
  // 构建文件夹路径：项目根目录/private/resources/dirname/subdirname
  const folderPath = path.join(
    process.cwd(),
    "private",
    "resources",
    dirname,
    subdirname
  );
  
  console.log(`Reading folder: ${folderPath}`);

  try {
    // 调用jsonl.ts的getJsonlFilesSorted方法获取排序后的JSONL文件列表
    const jsonlFiles = getJsonlFilesSorted(folderPath);
    
    if (jsonlFiles.length === 0) {
      return NextResponse.json(
        { error: `No JSONL files found in folder: ${folderPath}` },
        { status: 404 }
      );
    }
    
    // 获取文件总数
    const totalFiles = jsonlFiles.length;
    
    // 获取第一个JSONL文件的完整路径
    const firstJsonlPath = path.join(folderPath, jsonlFiles[0]);
    
    // 调用jsonl.ts的getJsonlObjectCount方法获取每个JSONL文件的对象数量
    const objectsPerFile = getJsonlObjectCount(firstJsonlPath);
    
    console.log(`Total files: ${totalFiles}, Objects per file: ${objectsPerFile}`);
    
    // 调用serialization.ts的getFileIndexById方法计算文件索引
    const fileIndex = AncientProseData.getFileIndexById(numericId, totalFiles, objectsPerFile);
    
    console.log(`File index for id ${numericId}: ${fileIndex}`);
    
    // 构建目标JSONL文件路径
    const firstFileName = jsonlFiles[0];
    const fileNameParts = firstFileName.split('-');
    
    if (fileNameParts.length < 2) {
      return NextResponse.json(
        { error: `Invalid file name format: ${firstFileName}` },
        { status: 500 }
      );
    }
    
    // 将分割后的最后一部分（原来是数字）替换为计算得到的fileIndex，保持.jsonl扩展名
    fileNameParts[fileNameParts.length - 1] = `${fileIndex + 1}.jsonl`;
    const targetFileName = fileNameParts.join('-');
    const targetFilePath = path.join(folderPath, targetFileName);
    
    console.log(`Target file path: ${targetFilePath}`);
    
    // 调用jsonl.ts的readJsonlFile方法读取目标JSONL文件
    const jsonObjects = await readJsonlFile(targetFilePath);
    
    console.log(`Found ${jsonObjects.length} objects in JSONL file`);
    
    // 遍历获取到的jsonObjects对象数组，找到匹配ID的对象
    let targetObject = null;
    for (const obj of jsonObjects) {
      try {
        const ancientProseData = AncientProseData.fromObject(obj);
        if (ancientProseData.id === numericId) {
          targetObject = ancientProseData;
          break;
        }
      } catch (error) {
        console.warn(`Failed to convert object:`, error);
      }
    }
    
    if (!targetObject) {
      return NextResponse.json(
        { error: `Object with id ${numericId} not found` },
        { status: 404 }
      );
    }
    
    console.log(`Successfully found object with id ${numericId}`);
    
    // 返回单个AncientProseData对象
    return NextResponse.json(targetObject);
  } catch (error) {
    // 捕获并处理整个流程中可能出现的任何错误
    console.error(`Error processing request for id ${numericId}:`, error);
    return NextResponse.json(
      { error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}