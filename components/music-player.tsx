'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

const MusicPlayer = () => {
  const [musicFiles, setMusicFiles] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      if (audio.src !== newSrc) {
        audio.src = newSrc;
        // 当切换音轨时，如果正在播放，需要重新播放
        if (isPlaying) {
          audio.play().catch(e => {
            console.error("Play failed", e);
            setIsPlaying(false); // 播放失败时重置状态
          });
        }
      }
    }
  }, [currentTrack, musicFiles]);

  const handlePlayPause = async () => {
    if (!audioRef.current || musicFiles.length === 0) return;
    
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Play failed:", error);
        // 播放失败时保持暂停状态
        setIsPlaying(false);
      }
    }
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % musicFiles.length);
  };

  const handleEnded = () => {
    handleNext();
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={handlePlayPause}>
        <Music className={`h-5 w-5 ${isPlaying ? 'text-blue-500' : 'text-gray-500'}`} />
      </Button>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </>
  );
};

export default MusicPlayer;