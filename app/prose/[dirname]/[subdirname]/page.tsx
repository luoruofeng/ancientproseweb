'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from 'lucide-react';
import { AncientProseData } from '@/lib/serialization';
import { useProse } from '@/app/prose-context';
import { getReadingProgress, setReadingProgress } from '@/lib/cache';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VoicePlayer } from '@/components/voice-player';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { YoudaoTranslation } from '@/lib/youdao';
import { TOOLTIP_DISPLAY_DURATION } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';

type PlayingState = {
  language: string | null;
  isLoading: boolean;
  isPlaying: boolean;
  hasError: boolean;
};

const EnglishWord = ({ word }: { word: string }) => {
  const [translation, setTranslation] = useState<YoudaoTranslation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleOpenChange = async (open: boolean) => {
    if (open && !translation) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/prose/word/translate/${word.toLowerCase()}`);
        if (response.ok) {
          const data = await response.json();
          setTranslation(data);
        } else {
          setTranslation([]);
        }
      } catch (error) {
        console.error("Failed to fetch translation", error);
        setTranslation([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePlaySound = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsAudioLoading(true);
    try {
      const audioSrc = `/api/prose/word/voice/${word}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      
      audio.addEventListener('canplaythrough', () => {
        setIsAudioLoading(false);
        setIsPlaying(true);
        audio.play();
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        audioRef.current = null;
      });

      audio.addEventListener('error', () => {
        setIsAudioLoading(false);
        setIsPlaying(false);
      });

    } catch (error) {
      console.error("Failed to play sound", error);
      setIsAudioLoading(false);
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer">{word}</span>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          translation && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">{word}</h4>
                  <Button onClick={handlePlaySound} variant="ghost" size="sm" className="p-1 h-auto">
                    {isAudioLoading || isPlaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {translation.length > 0 ? (
                    <ul className="space-y-1">
                      {translation.slice(0, 5).map((item, index) => (
                        <li key={index}>
                          <span className="font-semibold">{item.entry}</span>: {item.explain}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No translation found.</p>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </PopoverContent>
    </Popover>
  );
};

const processEnglishText = (text: string) => {
  if (!text) return null;
  const elements: (string | React.ReactElement)[] = [];
  let lastIndex = 0;

  // Regex to find words, including those with apostrophes
  const regex = /([a-zA-Z'’]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add the text before the word
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    // Add the word component
    const word = match[0];
    elements.push(<EnglishWord key={match.index} word={word} />);
    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last word
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return <>{elements}</>;
};

export default function ProsePage() {
  const params = useParams();
  const [proseDataArray, setProseDataArray] = useState<AncientProseData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentId, setCurrentId] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigationLocked, setIsNavigationLocked] = useState(false);
  const [isNextButtonBlue, setIsNextButtonBlue] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [playingState, setPlayingState] = useState<PlayingState>({
    language: null,
    isLoading: false,
    isPlaying: false,
    hasError: false,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const [isUIVisible, setIsUIVisible] = useState(true);
  
  // 手指跟随动画状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const {
    showChinese,
    showEnglish,
    showJapanese,
    isReadingAloud,
  } = useProse();
  
  // 路径参数
  const dirname = decodeURIComponent(params.dirname as string);
  const subdirname = decodeURIComponent(params.subdirname as string);
  
  useEffect(() => {
    const savedId = getReadingProgress(dirname, subdirname);
    if (savedId !== null) {
      setCurrentId(savedId);
    }
    setLoading(false);
  }, [dirname, subdirname]);

  useEffect(() => {
    if (!loading) {
      setReadingProgress(dirname, subdirname, currentId);
    }
  }, [currentId, dirname, subdirname, loading]);

  // 处理上一条
  const handlePrevious = useCallback(() => {
    if (isNavigationLocked) return;
    const newId = currentId - 1;
    if (newId >= 0) {
      setCurrentId(newId);
    }
  }, [currentId, isNavigationLocked]);
  
  // 处理下一条
  const handleNext = useCallback(() => {
    if (isNavigationLocked) return;
    const newId = currentId + 1;
    if (newId < totalCount) {
      setCurrentId(newId);
    }
  }, [currentId, totalCount, isNavigationLocked]);
  
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

  // 手指跟随触摸手势支持
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isNavigationLocked || isAnimating) return;
      
      const touch = e.touches[0];
      setStartX(touch.clientX);
      setCurrentX(touch.clientX);
      setIsDragging(true);
      setDragOffset(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
       if (!isDragging || isNavigationLocked || isAnimating) return;
       
       const touch = e.touches[0];
       const deltaX = touch.clientX - startX;
       const maxOffset = window.innerWidth * 0.3; // 最大拖拽距离为屏幕宽度的30%
       
       // 边界检测和阻尼效果
       let limitedOffset = deltaX;
       
       // 如果已经是第一页，限制向右滑动
       if (currentId === 0 && deltaX > 0) {
         limitedOffset = deltaX * 0.3; // 强阻尼
       }
       // 如果已经是最后一页，限制向左滑动
       else if (currentId === totalCount - 1 && deltaX < 0) {
         limitedOffset = deltaX * 0.3; // 强阻尼
       }
       // 正常范围内的阻尼效果
       else if (Math.abs(deltaX) > maxOffset) {
         const excess = Math.abs(deltaX) - maxOffset;
         const dampedExcess = excess * 0.2; // 阻尼系数
         limitedOffset = deltaX > 0 ? maxOffset + dampedExcess : -(maxOffset + dampedExcess);
       }
       
       setCurrentX(touch.clientX);
       setDragOffset(limitedOffset);
     };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging || isNavigationLocked || isAnimating) return;
      
      const deltaX = dragOffset;
      const threshold = window.innerWidth * 0.15; // 切换阈值为屏幕宽度的15%
      
      setIsDragging(false);
      setIsAnimating(true);
      
      // 判断是否需要切换页面
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && currentId > 0) {
          // 向右滑动，显示上一条
          handlePrevious();
        } else if (deltaX < 0 && currentId < totalCount - 1) {
          // 向左滑动，显示下一条
          handleNext();
        }
      }
      
      // 重置动画状态
      setTimeout(() => {
        setDragOffset(0);
        setIsAnimating(false);
      }, 300);
    };

    const element = containerRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
       element.removeEventListener('touchstart', handleTouchStart);
       element.removeEventListener('touchmove', handleTouchMove);
       element.removeEventListener('touchend', handleTouchEnd);
     };
   }, [isMobile, handlePrevious, handleNext, isNavigationLocked, isDragging, startX, dragOffset, isAnimating, currentId, totalCount]);

  // 移动端UI显示逻辑（移除自动隐藏功能）
  useEffect(() => {
    if (!isMobile) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      // 检查点击的是否是空白区域（不是按钮、链接等交互元素）
      const target = e.target as HTMLElement;
      if (!target.closest('button') && !target.closest('a') && !target.closest('[role="slider"]')) {
        setIsUIVisible(true); // 保持UI可见
      }
    };

    // 确保UI在移动端始终可见
    setIsUIVisible(true);

    document.addEventListener('click', handleClick);
    document.addEventListener('touchend', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchend', handleClick);
    };
  }, [isMobile]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsNextButtonBlue(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (isInitialLoad) {
      setIsTooltipVisible(true);
      const timer = setTimeout(() => {
        setIsTooltipVisible(false);
        setIsInitialLoad(false);
      }, TOOLTIP_DISPLAY_DURATION);
      return () => clearTimeout(timer);
    }
  }, [currentId, isInitialLoad]);
  
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
    const savedId = getReadingProgress(dirname, subdirname);
    setCurrentId(savedId !== null ? savedId : 0);
    setCurrentIndex(0);
    setIsInitialLoad(true);
    loadTotalCount();
  }, [dirname, subdirname, loadTotalCount]);
  
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

  const handleTogglePlay = useCallback(async (language: string) => {
    const langParam = language === 'description' ? 'cn' : language;
    const audioSrc = `/api/prose/voice/${dirname}/${subdirname}/${langParam}/${currentId}`;
  
    if (playingState.language === language && playingState.isPlaying) {
      audioRef.current?.pause();
      setPlayingState(prev => ({ ...prev, isPlaying: false }));
      return;
    }
  
    if (audioRef.current && playingState.language === language) {
      audioRef.current.play();
      setPlayingState(prev => ({ ...prev, isPlaying: true }));
      return;
    }
  
    if (audioRef.current) {
      audioRef.current.pause();
    }
  
    setPlayingState({ language, isLoading: true, isPlaying: false, hasError: false });
  
    try {
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
  
      audio.addEventListener('canplaythrough', () => {
        setPlayingState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
        audio.play();
      });
  
      audio.addEventListener('ended', () => {
        setPlayingState(prev => ({ ...prev, isPlaying: false }));
      });
  
      audio.addEventListener('error', () => {
        setPlayingState({ language, isLoading: false, isPlaying: false, hasError: true });
      });
  
    } catch {
      setPlayingState({ language, isLoading: false, isPlaying: false, hasError: true });
    }
  }, [dirname, subdirname, currentId, playingState.language, playingState.isPlaying]);

  // 用于跟踪上一次的状态
  const prevIsReadingAloudRef = useRef(isReadingAloud);
  const prevContentLoadingRef = useRef(contentLoading);

  // isReadingAloud 状态变化时触发
  useEffect(() => {
    if (prevIsReadingAloudRef.current !== isReadingAloud) {
      if (isReadingAloud) {
        // 如果开启自动朗读，并且当前没有在播放或加载，则开始播放
        if ((playingState.language !== 'original' || !playingState.isPlaying) && !playingState.isLoading) {
          handleTogglePlay('original');
        }
      } else {
        // 如果关闭自动朗读，并且当前正在播放，则停止
        if (playingState.language === 'original' && playingState.isPlaying) {
          handleTogglePlay('original'); // 这会调用 pause
        }
      }
      prevIsReadingAloudRef.current = isReadingAloud;
    }
  }, [isReadingAloud, playingState.language, playingState.isPlaying, playingState.isLoading, handleTogglePlay]);

  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // currentId 变化时，停止当前播放
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingState({
      language: null,
      isLoading: false,
      isPlaying: false,
      hasError: false,
    });
  }, [currentId]);

  // 内容加载完成后，如果自动朗读开启，则播放新内容
  useEffect(() => {
    // 当 contentLoading 从 true 变为 false 时
    if (prevContentLoadingRef.current && !contentLoading && isReadingAloud) {
      handleTogglePlay('original');
    }
    prevContentLoadingRef.current = contentLoading;
  }, [contentLoading, isReadingAloud, handleTogglePlay]);
  
  useEffect(() => {
    if (contentLoading) {
      setIsNavigationLocked(true);
    } else {
      setIsNavigationLocked(false); // 立即解锁导航，无延迟
    }
  }, [contentLoading]);

  // 处理slider变化
  const handleSliderChange = useCallback((value: number[]) => {
    if (isNavigationLocked) return;
    const newId = value[0]; // slider从0开始，ID也从0开始
    
    setCurrentId(newId);
  }, [isNavigationLocked]);
  
  // 获取当前显示的数据
  const currentData = proseDataArray[currentIndex];
  
  // 处理原文中的注释词汇，添加Tooltip和下划线
  const processOriginalText = useCallback((text: string, annotations: Record<string, string>[]) => {
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
      
      parts.forEach((part, partIndex) => {
        if (typeof part === 'string') {
          const regex = new RegExp(`(${key})`, 'g');
          const segments = part.split(regex);
          
          segments.forEach((segment, segIndex) => {
            if (segment === key) {
              const TooltipWrapper = () => {
                const [isOpen, setIsOpen] = useState(false);
                const touchStartTimeRef = useRef<number>(0);
                const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
                
                const handleTouchStart = (e: React.TouchEvent) => {
                  if (isMobile) {
                    touchStartTimeRef.current = Date.now();
                    const touch = e.touches[0];
                    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
                  }
                };
                
                const handleTouchEnd = (e: React.TouchEvent) => {
                  if (isMobile) {
                    const touchEndTime = Date.now();
                    const touchDuration = touchEndTime - touchStartTimeRef.current;
                    const touch = e.changedTouches[0];
                    const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
                    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);
                    
                    // 只有在短时间点击且没有明显移动时才显示tooltip
                    if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(!isOpen);
                    }
                  }
                };
                
                const handleClick = (e: React.MouseEvent) => {
                  if (!isMobile) {
                    // 桌面端保持原有行为
                    setIsOpen(!isOpen);
                  }
                };
                
                return (
                  <Tooltip open={isMobile ? isOpen : undefined} onOpenChange={isMobile ? setIsOpen : undefined}>
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
                         onTouchStart={handleTouchStart}
                         onTouchEnd={handleTouchEnd}
                         onClick={handleClick}
                       >
                         {segment}
                       </span>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p className="font-alimama-shuheiti">{annotationMap[key]}</p>
                     </TooltipContent>
                   </Tooltip>
                );
              };
              
              newParts.push(<TooltipWrapper key={`${index}-${partIndex}-${segIndex}`} />);
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
  }, [isMobile]);
  
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
    <div 
      ref={containerRef}
      className="flex flex-col h-screen bg-background"
    >
      {/* 主要内容区域 */}
      <div 
        className={`flex-1 flex ${isMobile ? 'items-start' : 'items-center'} justify-center ${isMobile ? 'p-4' : 'p-8'}`}
        style={{
          ...(isMobile && (isDragging || isAnimating) ? {
            transform: `translateX(${dragOffset}px)`,
            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none'
          } : {})
        }}
      >
        {/* 左侧上一条按钮 - 桌面端显示 */}
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrevious}
                  className="mr-8"
                  disabled={isNavigationLocked || currentId === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>上一行</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* 中央内容显示区域 */}
        <div 
          ref={contentRef}
          className={`flex-1 max-w-4xl relative ${isMobile ? 'mx-2' : 'mx-8'}`}
          style={{
            ...(isMobile ? { fontSize: '18px', lineHeight: '1.8', wordWrap: 'break-word', overflowWrap: 'break-word' } : {})
          }}
        >
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
          <div className={`text-left transition-all duration-300 ${isMobile ? 'space-y-4' : 'space-y-6'} ${contentLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {/* 原文 */}
            <TooltipProvider>
              <div className={`flex items-center gap-2 font-medium text-foreground leading-relaxed font-alimama ${isMobile ? 'text-2xl' : 'text-lg'}`} style={isMobile ? { wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' } : {}}>
                <VoicePlayer
                  onTogglePlay={() => handleTogglePlay('original')}
                  isPlaying={playingState.language === 'original' && playingState.isPlaying}
                  isLoading={playingState.language === 'original' && playingState.isLoading}
                  hasError={playingState.language === 'original' && playingState.hasError}
                />
                <span>{processOriginalText(currentData.original, currentData.annotation)}</span>
              </div>
            </TooltipProvider>
            
            {/* 中文描述 */}
            {showChinese && currentData.description && (
              <div className={`flex items-center gap-2 text-muted-foreground leading-relaxed font-alimama-fangyuanti ${isMobile ? 'text-xl' : 'text-sm'}`} style={isMobile ? { wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' } : {}}>
                <VoicePlayer
                  onTogglePlay={() => handleTogglePlay('description')}
                  isPlaying={playingState.language === 'description' && playingState.isPlaying}
                  isLoading={playingState.language === 'description' && playingState.isLoading}
                  hasError={playingState.language === 'description' && playingState.hasError}
                />
                <span>
                  <span className="font-alimama-shuheiti">译文：</span>
                  {currentData.description}
                </span>
              </div>
            )}
            
            {/* 英文翻译 */}
            {showEnglish && currentData.en && (
              <div className={`flex items-center gap-2 text-muted-foreground leading-relaxed ${isMobile ? 'text-xl' : 'text-sm'}`} style={isMobile ? { wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' } : {}}>
                <VoicePlayer
                  onTogglePlay={() => handleTogglePlay('en')}
                  isPlaying={playingState.language === 'en' && playingState.isPlaying}
                  isLoading={playingState.language === 'en' && playingState.isLoading}
                  hasError={playingState.language === 'en' && playingState.hasError}
                />
                <span>{processEnglishText(currentData.en)}</span>
              </div>
            )}
            
            {/* 日文翻译 */}
            {showJapanese && currentData.jp && (
              <div className={`flex items-center gap-2 text-muted-foreground leading-relaxed ${isMobile ? 'text-xl' : 'text-lg'}`} style={isMobile ? { wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' } : {}}>
                <VoicePlayer
                  onTogglePlay={() => handleTogglePlay('jp')}
                  isPlaying={playingState.language === 'jp' && playingState.isPlaying}
                  isLoading={playingState.language === 'jp' && playingState.isLoading}
                  hasError={playingState.language === 'jp' && playingState.hasError}
                />
                <span>{currentData.jp}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧下一条按钮 - 桌面端显示 */}
        {!isMobile && (
          <TooltipProvider>
            <Tooltip open={isTooltipVisible}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleNext}
                  className={`ml-8 ${isNextButtonBlue ? 'animate-border-pulse-blue' : ''}`}
                  disabled={isNavigationLocked || currentId === totalCount - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>下一行，也可以按键盘&quot;→&quot;显示</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* 底部slider */}
      <div className={`border-t ${isMobile ? 'p-3' : 'p-6'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`mb-2 text-muted-foreground text-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {currentId + 1} / {totalCount}
            {isMobile && (
              <span className="block text-xs text-muted-foreground/70 mt-1">
                左右滑动翻页
              </span>
            )}
          </div>
          <Slider
            value={[currentId]} // slider值从0开始，ID也从0开始
            onValueChange={handleSliderChange}
            max={totalCount - 1}
            min={0}
            step={1}
            className={`w-full transition-opacity duration-200 ${isNavigationLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
          />
        </div>
      </div>
    </div>
  );
}