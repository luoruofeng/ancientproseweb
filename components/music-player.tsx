'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLTIP_DISPLAY_DURATION } from "@/lib/constants";

const MusicPlayer = () => {
  const [musicFiles, setMusicFiles] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTooltipVisible(false);
    }, TOOLTIP_DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchMusicFiles = async () => {
      try {
        const response = await fetch('/api/music');
        if (response.ok) {
          const files = await response.json();
          setMusicFiles(files);
        }
      } catch (error) {
        console.error('Failed to fetch music files:', error);
      }
    };

    fetchMusicFiles();
  }, []);

  useEffect(() => {
    if (musicFiles.length > 0 && audioRef.current) {
      const audio = audioRef.current;
      const newSrc = `/background_music/${musicFiles[currentTrack]}`;
      
      if (!audio.src.endsWith(newSrc)) {
        audio.src = newSrc;
      }

      if (isPlaying) {
        audio.play().catch(e => {
          console.error("Play failed", e);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    }
  }, [currentTrack, musicFiles, isPlaying]);

  const handlePlayPause = () => {
    if (musicFiles.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setCurrentTrack(prev => (prev + 1) % musicFiles.length);
    setIsPlaying(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip open={isTooltipVisible} onOpenChange={setIsTooltipVisible}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handlePlayPause}>
              <Music className={`h-5 w-5 ${isPlaying ? 'text-blue-500' : 'text-gray-500'}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>来段音乐助兴吧！</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
      />
    </>
  );
};

export default MusicPlayer;