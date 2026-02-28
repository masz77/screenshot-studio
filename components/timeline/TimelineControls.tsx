'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  PlayIcon,
  PauseIcon,
  RepeatIcon,
  RepeatOffIcon,
  NextIcon,
  PreviousIcon,
} from 'hugeicons-react';
import { useImageStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { trackTimelinePlayback } from '@/lib/analytics';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
}

export function TimelineControls() {
  const {
    timeline,
    togglePlayback,
    setPlayhead,
    setTimeline,
    setTimelineDuration,
  } = useImageStore();

  const { isPlaying, isLooping, playhead, duration } = timeline;

  const handleSkipToStart = () => {
    trackTimelinePlayback('skip_start');
    setPlayhead(0);
  };

  const handleSkipToEnd = () => {
    trackTimelinePlayback('skip_end');
    setPlayhead(duration);
  };

  const handleToggleLoop = () => {
    trackTimelinePlayback('toggle_loop');
    setTimeline({ isLooping: !isLooping });
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-card border-b border-border/40">
      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleSkipToStart}
        >
          <PreviousIcon size={14} />
        </button>

        <button
          className={cn(
            'h-9 w-9 flex items-center justify-center rounded-full transition-all',
            isPlaying
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-accent text-foreground hover:bg-accent/80'
          )}
          onClick={togglePlayback}
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>

        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleSkipToEnd}
        >
          <NextIcon size={14} />
        </button>
      </div>

      {/* Time display */}
      <div className="flex items-center gap-1.5 min-w-[100px] px-3 py-1.5 bg-background/30 rounded">
        <span className="text-xs font-mono text-foreground/90">
          {formatTime(playhead)}
        </span>
        <span className="text-xs text-muted-foreground/50">/</span>
        <span className="text-xs font-mono text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      {/* Duration control */}
      <div className="flex items-center gap-3 flex-1 max-w-[250px]">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Duration
        </span>
        <Slider
          value={[duration / 1000]}
          min={1}
          max={30}
          step={1}
          onValueChange={([val]) => setTimelineDuration(val * 1000)}
          className="flex-1 [&_[role=slider]]:bg-foreground [&_[role=slider]]:border-0 [&_.relative]:bg-foreground/20 [&_[data-orientation=horizontal]>.bg-primary]:bg-primary"
        />
        <span className="text-xs font-mono text-muted-foreground min-w-[28px] text-right">
          {Math.floor(duration / 1000)}s
        </span>
      </div>

      {/* Loop toggle */}
      <button
        className={cn(
          'h-7 w-7 flex items-center justify-center rounded transition-colors',
          isLooping
            ? 'bg-primary/20 text-primary'
            : 'hover:bg-accent text-muted-foreground hover:text-foreground'
        )}
        onClick={handleToggleLoop}
        title={isLooping ? 'Loop enabled' : 'Loop disabled'}
      >
        {isLooping ? <RepeatIcon size={14} /> : <RepeatOffIcon size={14} />}
      </button>
    </div>
  );
}
