'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Volume2, Clock, VolumeX } from 'lucide-react';
import { useProse } from '@/app/prose-context';

export function ProseControls() {
  const {
    showChinese,
    setShowChinese,
    showEnglish,
    setShowEnglish,
    showJapanese,
    setShowJapanese,
    isReadingAloud,
    setIsReadingAloud,
  } = useProse();

  return (
    <div className="flex items-center justify-end gap-4">
      {/* 朗读按钮 */}
      <Button
        variant={isReadingAloud ? 'default' : 'outline'}
        size="sm"
        onClick={() => setIsReadingAloud(!isReadingAloud)}
      >
        {isReadingAloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>

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
    </div>
  );
}