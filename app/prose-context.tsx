'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context data
interface ProseContextType {
  showChinese: boolean;
  setShowChinese: (value: boolean) => void;
  showEnglish: boolean;
  setShowEnglish: (value: boolean) => void;
  showJapanese: boolean;
  setShowJapanese: (value: boolean) => void;
  isReadingAloud: boolean;
  setIsReadingAloud: (value: boolean) => void;
}

// Create the context with a default value
const ProseContext = createContext<ProseContextType | undefined>(undefined);

// Create a provider component
export function ProseProvider({ children }: { children: ReactNode }) {
  const [showChinese, setShowChinese] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showJapanese, setShowJapanese] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(true);

  const value = {
    showChinese,
    setShowChinese,
    showEnglish,
    setShowEnglish,
    showJapanese,
    setShowJapanese,
    isReadingAloud,
    setIsReadingAloud,
  };

  return <ProseContext.Provider value={value}>{children}</ProseContext.Provider>;
}

// Create a custom hook to use the context
export function useProse() {
  const context = useContext(ProseContext);
  if (context === undefined) {
    // Return default values if not within a provider
    return {
      showChinese: true,
      setShowChinese: () => {},
      showEnglish: false,
      setShowEnglish: () => {},
      showJapanese: false,
      setShowJapanese: () => {},
      isReadingAloud: false,
      setIsReadingAloud: () => {},
    };
  }
  return context;
}