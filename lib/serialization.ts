// 注释对象的接口定义
interface Annotation {
  [key: string]: string;
}

interface AncientProseObject {
  original?: string;
  description?: string;
  id?: number;
  en?: string;
  jp?: string;
  annotation?: Annotation[];
}

// 古文数据类
export class AncientProseData {
  original: string;
  description: string;
  id: number;
  en: string;
  jp: string;
  annotation: Annotation[];

  constructor(
    original: string = '',
    description: string = '',
    id: number = 0,
    en: string = '',
    jp: string = '',
    annotation: Annotation[] = []
  ) {
    this.original = original;
    this.description = description;
    this.id = id;
    this.en = en;
    this.jp = jp;
    this.annotation = annotation;
  }

  // 序列化方法：将类实例转换为JSON字符串
  serialize(): string {
    return JSON.stringify({
      original: this.original,
      description: this.description,
      id: this.id,
      en: this.en,
      jp: this.jp,
      annotation: this.annotation
    });
  }

  // 序列化为对象
  toObject(): object {
    return {
      original: this.original,
      description: this.description,
      id: this.id,
      en: this.en,
      jp: this.jp,
      annotation: this.annotation
    };
  }

  // 静态反序列化方法：从JSON字符串创建类实例
  static deserialize(jsonString: string): AncientProseData {
    try {
      const data = JSON.parse(jsonString);
      return AncientProseData.fromObject(data);
    } catch (error) {
      throw new Error(`反序列化失败: ${error}`);
    }
  }

  // 静态方法：从对象创建类实例
  static fromObject(obj: AncientProseObject): AncientProseData {
    if (!obj || typeof obj !== 'object') {
      throw new Error('无效的对象数据');
    }

    return new AncientProseData(
      obj.original || '',
      obj.description || '',
      obj.id || 0,
      obj.en || '',
      obj.jp || '',
      obj.annotation || []
    );
  }

  // 验证数据完整性
  validate(): boolean {
    return (
      typeof this.original === 'string' &&
      typeof this.description === 'string' &&
      typeof this.id === 'number' &&
      typeof this.en === 'string' &&
      typeof this.jp === 'string' &&
      Array.isArray(this.annotation)
    );
  }

  // 克隆方法
  clone(): AncientProseData {
    return AncientProseData.fromObject(this.toObject());
  }

  // 更新方法
  update(updates: Partial<AncientProseData>): void {
    Object.assign(this, updates);
  }

  // 获取注释的便捷方法
  getAnnotationByKey(key: string): string | undefined {
    const annotation = this.annotation.find(ann => ann[key]);
    return annotation ? annotation[key] : undefined;
  }

  // 添加注释
  addAnnotation(key: string, value: string): void {
    this.annotation.push({ [key]: value });
  }

  // 移除注释
  removeAnnotation(key: string): boolean {
    const index = this.annotation.findIndex(ann => ann[key]);
    if (index !== -1) {
      this.annotation.splice(index, 1);
      return true;
    }
    return false;
  }

  // 静态方法：根据id计算对象在第几个jsonl文件中
  static getFileIndexById(id: number, totalFiles: number, objectsPerFile: number): number {
    if (id < 0 || totalFiles <= 0 || objectsPerFile <= 0) {
      throw new Error('参数必须为正数');
    }
    
    // 计算文件索引（从0开始）
    const fileIndex = Math.floor(id / objectsPerFile);
    
    // 检查是否超出文件范围
    if (fileIndex >= totalFiles) {
      throw new Error(`ID ${id} 超出了文件范围（总共 ${totalFiles} 个文件，每个文件 ${objectsPerFile} 个对象）`);
    }
    
    return fileIndex;
  }
}

// 导出类型定义
export type { Annotation };

// 使用示例（注释形式）
/*
// 创建实例
const proseData = new AncientProseData(
  "行也宜，立也宜，坐也宜，偎傍更相宜。",
  "无论行走、站立、坐着都显得优雅得体，而依偎在一起时更是格外相配宜人。",
  6,
  "Whether walking, standing, or sitting, they appear graceful and dignified, and are particularly harmonious and pleasing when snuggled together.\n",
  "歩く時も、立つ時も、座っている時も、優雅で品格があり、寄り添う時は特に相性が良く、心地よい。\n",
  [{"行": "行走"}, {"宜": "适宜，恰当"}, {"立": "站立"}, {"坐": "坐着"}, {"偎傍": "依偎在一起"}, {"更": "更加"}, {"相": "相互"}, {"宜": "适宜，相配"}]
);

// 序列化
const jsonString = proseData.serialize();
console.log(jsonString);

// 反序列化
const newProseData = AncientProseData.deserialize(jsonString);
console.log(newProseData);

// 从对象创建
const objData = {
  "original": "行也宜，立也宜，坐也宜，偎傍更相宜。",
  "description": "无论行走、站立、坐着都显得优雅得体，而依偎在一起时更是格外相配宜人。",
  "id": 6,
  "en": "Whether walking, standing, or sitting, they appear graceful and dignified, and are particularly harmonious and pleasing when snuggled together.\n",
  "jp": "歩く時も、立つ時も、座っている時も、優雅で品格があり、寄り添う時は特に相性が良く、心地よい。\n",
  "annotation": [{"行": "行走"}, {"宜": "适宜，恰当"}, {"立": "站立"}, {"坐": "坐着"}, {"偎傍": "依偎在一起"}, {"更": "更加"}, {"相": "相互"}, {"宜": "适宜，相配"}]
};
const fromObjData = AncientProseData.fromObject(objData);
console.log(fromObjData);
*/
