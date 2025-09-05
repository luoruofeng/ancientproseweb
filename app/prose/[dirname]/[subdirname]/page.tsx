'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, Clock, Loader2 } from 'lucide-react';
import { AncientProseData } from '@/lib/serialization';

export default function ProsePage() {
  const params = useParams();
  const [proseDataArray, setProseDataArray] = useState<AncientProseData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentId, setCurrentId] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 控制状态
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showChinese, setShowChinese] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showJapanese, setShowJapanese] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5); // 秒数
  
  // 路径参数
  const dirname = decodeURIComponent(params.dirname as string);
  const subdirname = decodeURIComponent(params.subdirname as string);
  
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
      // Reading from the ref avoids dependency on proseDataArray
      const existingIndex = proseDataRef.current.findIndex(item => item.id === currentId);

      if (existingIndex !== -1) {
        // If data exists, just sync the index
        if (currentIndex !== existingIndex) {
          setCurrentIndex(existingIndex);
        }
        return;
      }

      // If data doesn't exist, fetch it
      setContentLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/prose/index/${dirname}/${subdirname}/${currentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newDataArray: AncientProseData[] = await response.json();

        // Create the new array based on the ref's current value
        const newMergedArray = [...proseDataRef.current];
        const existingIds = new Set(newMergedArray.map(item => item.id));
        newDataArray.forEach(newItem => {
            if (!existingIds.has(newItem.id)) {
                newMergedArray.push(newItem);
            }
        });
        newMergedArray.sort((a, b) => a.id - b.id);

        const newIndex = newMergedArray.findIndex(item => item.id === currentId);

        // Batch state updates
        setProseDataArray(newMergedArray);
        if (newIndex !== -1) {
            setCurrentIndex(newIndex);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setContentLoading(false);
      }
    };

    if (totalCount > 0) {
        processData();
    }
    // This effect runs only when the ID or book changes, not when data or index changes.
  }, [currentId, dirname, subdirname, totalCount]);
  
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
    setAutoPlayInterval(intervals[nextIdx]);
  }, [autoPlayInterval]);
  
  // 获取当前显示的数据
  const currentData = proseDataArray[currentIndex];
  
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
        <div className="text-lg">暂无数据</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-end gap-4 p-4 border-b">
        {/* 朗读按钮 */}
        <Button variant="outline" size="sm">
          <Volume2 className="h-4 w-4" />
        </Button>
        
        {/* 自动翻页开关 */}
        <div className="flex items-center gap-2">
          <Switch
            checked={isAutoPlay}
            onCheckedChange={setIsAutoPlay}
          />
          {isAutoPlay ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </div>
        
        {/* 语言切换 */}
        <div className="flex items-center gap-2">
          <Button
            variant={showChinese ? "default" : "outline"}
            size="sm"
            onClick={() => setShowChinese(!showChinese)}
          >
            中
          </Button>
          <Button
            variant={showEnglish ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEnglish(!showEnglish)}
          >
            EN
          </Button>
          <Button
            variant={showJapanese ? "default" : "outline"}
            size="sm"
            onClick={() => setShowJapanese(!showJapanese)}
          >
            JP
          </Button>
        </div>
        
        {/* 秒数设置 */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInterval}
          className="flex items-center gap-1"
        >
          <Clock className="h-4 w-4" />
          {autoPlayInterval}s
        </Button>
      </div>
      
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
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">加载中...</span>
              </div>
            </div>
          )}
          <div className={`text-left space-y-6 transition-all duration-300 ${contentLoading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
            {/* 原文 */}
            <div className="text-lg font-medium text-foreground leading-relaxed">
              {currentData.original}
            </div>
            
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