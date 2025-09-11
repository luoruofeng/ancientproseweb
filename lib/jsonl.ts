import fs from 'fs';
import path from 'path';

/**
 * 读取指定路径的JSONL文件，解析每一行的JSON对象
 * @param filePath JSONL文件的路径
 * @returns 包含所有JSON对象的数组
 */
export async function readJsonlFile<T = any>(filePath: string): Promise<T[]> {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 按行分割内容
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    const jsonObjects: T[] = [];
    
    // 遍历每一行，解析JSON
    for (let i = 0; i < lines.length; i++) {
      try {
        const jsonObject = JSON.parse(lines[i]);
        jsonObjects.push(jsonObject);
      } catch (parseError) {
        console.warn(`第 ${i + 1} 行JSON解析失败:`, parseError);
        // 可以选择跳过错误行或抛出异常
        // throw new Error(`第 ${i + 1} 行JSON解析失败: ${parseError}`);
      }
    }
    
    return jsonObjects;
  } catch (error) {
    console.error('读取JSONL文件时发生错误:', error);
    throw error;
  }
}

/**
 * 同步版本的JSONL文件读取函数
 * @param filePath JSONL文件的路径
 * @returns 包含所有JSON对象的数组
 */
export function readJsonlFileSync<T = any>(filePath: string): T[] {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 按行分割内容
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    const jsonObjects: T[] = [];
    
    // 遍历每一行，解析JSON
    for (let i = 0; i < lines.length; i++) {
      try {
        const jsonObject = JSON.parse(lines[i]);
        jsonObjects.push(jsonObject);
      } catch (parseError) {
        console.warn(`第 ${i + 1} 行JSON解析失败:`, parseError);
        // 可以选择跳过错误行或抛出异常
        // throw new Error(`第 ${i + 1} 行JSON解析失败: ${parseError}`);
      }
    }
    
    return jsonObjects;
  } catch (error) {
    console.error('读取JSONL文件时发生错误:', error);
    throw error;
  }
}

/**
 * 写入JSONL文件
 * @param filePath 要写入的文件路径
 * @param jsonObjects 要写入的JSON对象数组
 */
export function writeJsonlFile<T = any>(filePath: string, jsonObjects: T[]): void {
  try {
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 将JSON对象转换为JSONL格式
    const jsonlContent = jsonObjects.map(obj => JSON.stringify(obj)).join('\n');
    
    // 写入文件
    fs.writeFileSync(filePath, jsonlContent, 'utf-8');
  } catch (error) {
    console.error('写入JSONL文件时发生错误:', error);
    throw error;
  }
}

/**
 * 追加内容到JSONL文件
 * @param filePath 要追加的文件路径
 * @param jsonObject 要追加的JSON对象
 */
export function appendToJsonlFile<T = any>(filePath: string, jsonObject: T): void {
  try {
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 将JSON对象转换为字符串并添加换行符
    const jsonLine = JSON.stringify(jsonObject) + '\n';
    
    // 追加到文件
    fs.appendFileSync(filePath, jsonLine, 'utf-8');
  } catch (error) {
    console.error('追加到JSONL文件时发生错误:', error);
    throw error;
  }
}

/**
 * 获取JSONL文件中的对象数量
 * @param filePath JSONL文件的路径
 * @returns 文件中JSON对象的数量
 */
export function getJsonlObjectCount(filePath: string): number {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 按行分割内容并过滤空行
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    let count = 0;
    
    // 遍历每一行，验证是否为有效JSON并计数
    for (let i = 0; i < lines.length; i++) {
      try {
        JSON.parse(lines[i]);
        count++;
      } catch (parseError) {
        console.warn(`第 ${i + 1} 行JSON解析失败，跳过计数:`, parseError);
        // 解析失败的行不计入总数
      }
    }
    
    return count;
  } catch (error) {
    console.error('获取JSONL文件对象数量时发生错误:', error);
    throw error;
  }
}

/**
 * 遍历指定文件夹中的所有JSONL文件，返回按文件名中'-'后数字排序的文件名数组
 * @param folderPath 文件夹路径
 * @returns 排序后的JSONL文件名数组
 */
export function getJsonlFilesSorted(folderPath: string): string[] {
  try {
    // 检查文件夹是否存在
    if (!fs.existsSync(folderPath)) {
      throw new Error(`文件夹不存在: ${folderPath}`);
    }

    // 检查是否为文件夹
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      throw new Error(`路径不是文件夹: ${folderPath}`);
    }

    // 读取文件夹中的所有文件
    const files = fs.readdirSync(folderPath);
    
    // 过滤出JSONL文件
    const jsonlFiles = files.filter(file => {
      const filePath = path.join(folderPath, file);
      const fileStats = fs.statSync(filePath);
      return fileStats.isFile() && path.extname(file).toLowerCase() === '.jsonl';
    });

    // 按照文件名中'-'后面的数字进行排序
    const sortedFiles = jsonlFiles.sort((a, b) => {
      // 提取文件名中'-'后面的数字
      const getNumberAfterDash = (filename: string): number => {
        const nameWithoutExt = path.parse(filename).name;
        const dashIndex = nameWithoutExt.lastIndexOf('-');
        if (dashIndex === -1) {
          return 0; // 如果没有'-'，返回0作为默认值
        }
        const numberStr = nameWithoutExt.substring(dashIndex + 1);
        const number = parseInt(numberStr, 10);
        return isNaN(number) ? 0 : number;
      };

      const numberA = getNumberAfterDash(a);
      const numberB = getNumberAfterDash(b);
      
      return numberA - numberB;
    });

    return sortedFiles;
  } catch (error) {
    console.error('遍历JSONL文件时发生错误:', error);
    throw error;
  }
}

/**
 * 获取指定文件夹中所有JSONL文件的对象总数量
 * @param folderPath 文件夹路径
 * @returns 所有JSONL文件中JSON对象的总数量
 */
export function getTotalJsonlObjectCount(folderPath: string): number {
  try {
    // 获取排序后的JSONL文件列表
    const sortedFiles = getJsonlFilesSorted(folderPath);
    
    if (sortedFiles.length === 0) {
      return 0; // 没有JSONL文件
    }
    
    if (sortedFiles.length === 1) {
      // 只有一个文件，直接获取其对象数量
      const filePath = path.join(folderPath, sortedFiles[0]);
      return getJsonlObjectCount(filePath);
    }
    
    // 多个文件，使用公式计算：第一个文件对象数量*(文件数量-1)+最后一个文件对象数量
    const firstFilePath = path.join(folderPath, sortedFiles[0]);
    const lastFilePath = path.join(folderPath, sortedFiles[sortedFiles.length - 1]);
    
    const firstFileCount = getJsonlObjectCount(firstFilePath);
    const lastFileCount = getJsonlObjectCount(lastFilePath);
    
    const totalCount = firstFileCount * (sortedFiles.length - 1) + lastFileCount;
    
    return totalCount;
  } catch (error) {
    console.error('获取JSONL文件总对象数量时发生错误:', error);
    throw error;
  }
}