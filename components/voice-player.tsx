'use client';

import { Button } from '@/components/ui/button';
import { Volume2, Loader2, AlertCircle } from 'lucide-react';

interface VoicePlayerProps {
  onTogglePlay: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export function VoicePlayer({ onTogglePlay, isPlaying, isLoading, hasError }: VoicePlayerProps) {
  const getIcon = () => {
    if (hasError) {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    if (isLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    if (isPlaying) {
      return <Volume2 className="h-5 w-5 text-primary" />;
    }
    return <Volume2 className="h-5 w-5" />;
  };

  return (
    <Button variant="ghost" size="icon" onClick={onTogglePlay} className="text-muted-foreground hover:text-foreground flex-shrink-0 -ml-2">
      {getIcon()}
    </Button>
  );
}