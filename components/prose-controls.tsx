'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Volume2, Clock, VolumeX } from 'lucide-react';
import { useProse } from '@/app/prose-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_DISPLAY_DURATION } from "@/lib/constants";

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
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTooltipVisible(false);
    }, TOOLTIP_DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-end gap-4">
      {/* 朗读按钮 */}
      <TooltipProvider>
        <Tooltip open={isTooltipVisible} onOpenChange={setIsTooltipVisible}>
          <TooltipTrigger asChild>
            <Button
              variant={isReadingAloud ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsReadingAloud(!isReadingAloud)}
            >
              {isReadingAloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>自动朗读每行原文</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 语言切换 */}
      <div className="flex items-center gap-2">
        <Button
          variant={showChinese ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowChinese(!showChinese)}
        >
          译
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