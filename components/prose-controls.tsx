'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Volume2, Clock } from 'lucide-react';
import { useProse } from '@/app/prose-context';

export function ProseControls() {
  const {
    isAutoPlay,
    setIsAutoPlay,
    showChinese,
    setShowChinese,
    showEnglish,
    setShowEnglish,
    showJapanese,
    setShowJapanese,
    autoPlayInterval,
    toggleInterval,
  } = useProse();

  return (
    <div className="flex items-center justify-end gap-4">
      {/* 朗读按钮 */}
      <Button variant="outline" size="sm">
        <Volume2 className="h-4 w-4" />
      </Button>

      {/* 自动翻页开关 */}
      <div className="flex items-center gap-2">
        <Switch checked={isAutoPlay} onCheckedChange={setIsAutoPlay} />
        {isAutoPlay ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </div>

      {/* 语言切换 */}
      <div className="flex items-center gap-2">
        <Button
          variant={showChinese ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowChinese(!showChinese)}
        >
          中
        </Button>
        <Button
          variant={showEnglish ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowEnglish(!showEnglish)}
        >
          EN
        </Button>
        <Button
          variant={showJapanese ? 'default' : 'outline'}
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
  );
}