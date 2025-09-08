'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, Clock, Loader2 } from 'lucide-react';
import { AncientProseData } from '@/lib/serialization';
import { useProse } from '@/app/prose-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ProsePage() {
  const params = useParams();
  const [proseDataArray, setProseDataArray] = useState<AncientProseData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentId, setCurrentId] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isAutoPlay,
    autoPlayInterval,
    showChinese,
    showEnglish,
    showJapanese,
  } = useProse();
  
  // 路径参数
  const dirname = decodeURIComponent(params.dirname as string);
  const subdirname = decodeURIComponent(params.subdirname as string);
  
  // 处理上一条
  const handlePrevious = useCallback(() => {
    const newId = currentId - 1;
    if (newId >= 0) {
      setCurrentId(newId);
    }
  }, [currentId]);
  
  // 处理下一条
  const handleNext = useCallback(() => {
    const newId = currentId + 1;
    if (newId < totalCount) {
      setCurrentId(newId);
    }
  }, [currentId, totalCount]);
  
  // 自动翻页定时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlay) {
      timer = setInterval(() => {
        handleNext();
      }, autoPlayInterval * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPlay, autoPlayInterval, currentIndex]);

  // 键盘左右箭头事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevious, handleNext]);
  
  // 获取总数量的函数
  const loadTotalCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/prose/count/${dirname}/${subdirname}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTotalCount(data.count);
    } catch (err) {
      console.error('Failed to load total count:', err);
    }
  }, [dirname, subdirname]);
  
  // 当书本（目录）变化时，重置状态
  useEffect(() => {
    setContentLoading(true);
    setProseDataArray([]);
    setCurrentId(0);
    setCurrentIndex(0);
    loadTotalCount();
  }, [dirname, subdirname]);
  
  const proseDataRef = useRef<AncientProseData[]>([]);

  useEffect(() => {
    proseDataRef.current = proseDataArray;
  }, [proseDataArray]);

  useEffect(() => {
    const processData = async () => {
      const existingIndex = proseDataRef.current.findIndex(item => item.id === currentId);

      if (existingIndex !== -1 && currentIndex === existingIndex) {
        return;
      }

      setContentLoading(true);
      await new Promise(res => setTimeout(res, 300));

      if (existingIndex !== -1) {
        if (currentIndex !== existingIndex) {
          setCurrentIndex(existingIndex);
        }
        setContentLoading(false);
        return;
      }

      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch(`/api/prose/index/${dirname}/${subdirname}/${currentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newDataArray: AncientProseData[] = await response.json();

        const newMergedArray = [...proseDataRef.current];
        const existingIds = new Set(newMergedArray.map(item => item.id));
        newDataArray.forEach(newItem => {
            if (!existingIds.has(newItem.id)) {
                newMergedArray.push(newItem);
            }
        });
        newMergedArray.sort((a, b) => a.id - b.id);

        const newIndex = newMergedArray.findIndex(item => item.id === currentId);

        setProseDataArray(newMergedArray);
        if (newIndex !== -1) {
            setCurrentIndex(newIndex);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setIsFetching(false);
        setContentLoading(false);
      }
    };

    if (totalCount > 0) {
        processData();
    } else {
        setContentLoading(false);
        setProseDataArray([]);
    }
  }, [currentId, dirname, subdirname, totalCount, currentIndex]);
  
  // 处理slider变化
  const handleSliderChange = useCallback((value: number[]) => {
    const newId = value[0]; // slider从0开始，ID也从0开始
    
    setCurrentId(newId);
  }, []);
  
  // 切换秒数设置
  const toggleInterval = useCallback(() => {
    const intervals = [5, 10, 20, 30];
    const currentIdx = intervals.indexOf(autoPlayInterval);
    const nextIdx = (currentIdx + 1) % intervals.length;
// 需要从 useProse 中获取 setAutoPlayInterval 函数
const { setAutoPlayInterval } = useProse();
setAutoPlayInterval(intervals[nextIdx]);
  }, [autoPlayInterval]);
  
  // 获取当前显示的数据
  const currentData = proseDataArray[currentIndex];
  
  // 处理原文中的注释词汇，添加Tooltip和下划线
  const processOriginalText = useCallback((text: string, annotations: any[]) => {
    if (!text || !annotations || annotations.length === 0) {
      return <span>{text}</span>;
    }
    
    // 收集所有注释的key和对应的value
    const annotationMap: { [key: string]: string } = {};
    annotations.forEach(annotation => {
      Object.keys(annotation).forEach(key => {
        if (text.includes(key)) {
          annotationMap[key] = annotation[key];
        }
      });
    });
    
    const annotationKeys = Object.keys(annotationMap);
    
    if (annotationKeys.length === 0) {
      return <span>{text}</span>;
    }
    
    // 按长度降序排序，避免短词覆盖长词
    annotationKeys.sort((a, b) => b.length - a.length);
    
    // 创建一个数组来存储文本片段和组件
    let parts: (string | React.ReactElement)[] = [text];
    
    // 为每个匹配的词添加Tooltip
    annotationKeys.forEach((key, index) => {
      const newParts: (string | React.ReactElement)[] = [];
      
      parts.forEach(part => {
        if (typeof part === 'string') {
          const regex = new RegExp(`(${key})`, 'g');
          const segments = part.split(regex);
          
          segments.forEach((segment, segIndex) => {
            if (segment === key) {
              newParts.push(
                <Tooltip key={`${index}-${segIndex}`}>
                   <TooltipTrigger asChild>
                     <span 
                       className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:[text-decoration-color:gray]"
                       style={{
                         textDecoration: 'underline',
                         textDecorationColor: 'var(--primary)',
                         textUnderlineOffset: '6px',
                         textDecorationThickness: '2px',
                         cursor: 'help'
                       }}
                     >
                       {segment}
                     </span>
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>{annotationMap[key]}</p>
                   </TooltipContent>
                 </Tooltip>
              );
            } else if (segment) {
              newParts.push(segment);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      
      parts = newParts;
    });
    
    return <span>{parts}</span>;
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">错误: {error}</div>
      </div>
    );
  }

  if (contentLoading && proseDataArray.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!currentData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">加载数据</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 主要内容区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        {/* 左侧上一条按钮 */}
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          className="mr-8"
          disabled={contentLoading || currentId === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        {/* 中央内容显示区域 */}
        <div className="flex-1 max-w-4xl mx-8 relative">
          {contentLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
              {isFetching && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              )}
            </div>
          )}
          <div className={`text-left space-y-6 transition-all duration-300 ${contentLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {/* 原文 */}
            <TooltipProvider>
              <div className="text-lg font-medium text-foreground leading-relaxed">
                {processOriginalText(currentData.original, currentData.annotation)}
              </div>
            </TooltipProvider>
            
            {/* 中文描述 */}
            {showChinese && currentData.description && (
              <div className="text-lg text-muted-foreground leading-relaxed">
                {currentData.description}
              </div>
            )}
            
            {/* 英文翻译 */}
            {showEnglish && currentData.en && (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {currentData.en}
              </div>
            )}
            
            {/* 日文翻译 */}
            {showJapanese && currentData.jp && (
              <div className="text-lg text-muted-foreground leading-relaxed">
                {currentData.jp}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧下一条按钮 */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          className="ml-8"
          disabled={contentLoading || currentId >= totalCount - 1}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
      
      {/* 底部slider */}
      <div className="p-6 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="mb-2 text-sm text-muted-foreground text-center">
            {currentId + 1} / {totalCount}
          </div>
          <Slider
            value={[currentId]} // slider值从0开始，ID也从0开始
            onValueChange={handleSliderChange}
            max={totalCount - 1}
            min={0}
            step={1}
            className={`w-full transition-opacity duration-200 ${contentLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
          />
        </div>
      </div>
    </div>
  );
}