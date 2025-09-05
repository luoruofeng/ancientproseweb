import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readJsonlFile, getJsonlFilesSorted, getJsonlObjectCount } from "@/lib/jsonl";
import { AncientProseData } from "@/lib/serialization";

/**
 * GET API路由处理函数
 * 根据提供的参数获取古文数据
 * 
 * @param request - Next.js请求对象
 * @param params - 路由参数对象
 * @param params.dirname - 目录名，用于路径拼接
 * @param params.subdirname - 子目录名，用于路径拼接
 * @param params.id - 当前AncientProseData对象的id
 * @returns 返回AncientProseData数组的JSON响应
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
  // 这个路径指向包含JSONL文件的目录
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
    // 返回的数组大小作为文件数量
    const jsonlFiles = getJsonlFilesSorted(folderPath);
    
    if (jsonlFiles.length === 0) {
      return NextResponse.json(
        { error: `No JSONL files found in folder: ${folderPath}` },
        { status: 404 }
      );
    }
    
    // 获取文件总数
    const totalFiles = jsonlFiles.length;
    
    // 获取第一个JSONL文件的完整路径（first_jsonl_path）
    // 将结果的第一个元素（jsonl文件名）和文件夹路径拼接
    const firstJsonlPath = path.join(folderPath, jsonlFiles[0]);
    
    // 调用jsonl.ts的getJsonlObjectCount方法获取每个JSONL文件的对象数量
    // 传入第一个jsonl文件路径作为参数
    const objectsPerFile = getJsonlObjectCount(firstJsonlPath);
    
    console.log(`Total files: ${totalFiles}, Objects per file: ${objectsPerFile}`);
    
    // 调用serialization.ts的getFileIndexById方法计算文件索引
    // 传入用户提供的id、totalFiles和objectsPerFile作为参数
    const fileIndex = AncientProseData.getFileIndexById(numericId, totalFiles, objectsPerFile);
    
    console.log(`File index for id ${numericId}: ${fileIndex}`);
    
    // 构建目标JSONL文件路径
    // 拼接逻辑：将first_jsonl_path路径的jsonl文件名按照'-'分割后的后半部分替换为上面方法返回的index
    // 路径的其他部分保持不变
    const firstFileName = jsonlFiles[0];
    const fileNameParts = firstFileName.split('-');
    
    if (fileNameParts.length < 2) {
      return NextResponse.json(
        { error: `Invalid file name format: ${firstFileName}` },
        { status: 500 }
      );
    }
    
    // 将分割后的最后一部分（原来是数字）替换为计算得到的fileIndex，保持.jsonl扩展名
    // 注意：fileIndex是从0开始的，但文件名的数字部分是从1开始的，所以需要加1
    fileNameParts[fileNameParts.length - 1] = `${fileIndex + 1}.jsonl`;
    const targetFileName = fileNameParts.join('-');
    const targetFilePath = path.join(folderPath, targetFileName);
    
    console.log(`Target file path: ${targetFilePath}`);
    
    // 调用jsonl.ts的readJsonlFile方法读取目标JSONL文件
    // 将构建好的目标文件路径作为参数传入
    const jsonObjects = await readJsonlFile(targetFilePath);
    
    console.log(`Found ${jsonObjects.length} objects in JSONL file`);
    
    // 遍历获取到的jsonObjects对象数组，使用AncientProseData.fromObject方法转换为AncientProseData数组
    // 这是数据转换的核心步骤，将原始JSON对象转换为类型化的AncientProseData对象
    const ancientProseDataArray: AncientProseData[] = jsonObjects.map((obj, index) => {
      try {
        return AncientProseData.fromObject(obj);
      } catch (error) {
        console.warn(`Failed to convert object at index ${index}:`, error);
        // 如果转换失败，返回一个默认的AncientProseData对象
        return new AncientProseData();
      }
    });
    
    console.log(`Successfully converted ${ancientProseDataArray.length} objects to AncientProseData`);
    
    // 将转换后的AncientProseData数组作为路由的响应结果返回
    return NextResponse.json(ancientProseDataArray);
  } catch (error) {
    // 捕获并处理整个流程中可能出现的任何错误
    console.error(`Error processing request for id ${numericId}:`, error);
    return NextResponse.json(
      { error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}