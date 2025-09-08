'use client';
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define the shape of the context data
interface ProseContextType {
  isAutoPlay: boolean;
  setIsAutoPlay: (value: boolean) => void;
  showChinese: boolean;
  setShowChinese: (value: boolean) => void;
  showEnglish: boolean;
  setShowEnglish: (value: boolean) => void;
  showJapanese: boolean;
  setShowJapanese: (value: boolean) => void;
  autoPlayInterval: number;
  setAutoPlayInterval: (value: number) => void;
  toggleInterval: () => void;
}

// Create the context with a default value
const ProseContext = createContext<ProseContextType | undefined>(undefined);

// Create a provider component
export function ProseProvider({ children }: { children: ReactNode }) {
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showChinese, setShowChinese] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showJapanese, setShowJapanese] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5);

  const toggleInterval = useCallback(() => {
    const intervals = [5, 10, 20, 30];
    const currentIdx = intervals.indexOf(autoPlayInterval);
    const nextIdx = (currentIdx + 1) % intervals.length;
    setAutoPlayInterval(intervals[nextIdx]);
  }, [autoPlayInterval]);

  const value = {
    isAutoPlay,
    setIsAutoPlay,
    showChinese,
    setShowChinese,
    showEnglish,
    setShowEnglish,
    showJapanese,
    setShowJapanese,
    autoPlayInterval,
    setAutoPlayInterval,
    toggleInterval,
  };

  return <ProseContext.Provider value={value}>{children}</ProseContext.Provider>;
}

// Create a custom hook to use the context
export function useProse() {
  const context = useContext(ProseContext);
  if (context === undefined) {
    // Return default values if not within a provider
    return {
      isAutoPlay: false,
      setIsAutoPlay: () => {},
      showChinese: true,
      setShowChinese: () => {},
      showEnglish: false,
      setShowEnglish: () => {},
      showJapanese: false,
      setShowJapanese: () => {},
      autoPlayInterval: 5,
      setAutoPlayInterval: () => {},
      toggleInterval: () => {},
    };
  }
  return context;
}