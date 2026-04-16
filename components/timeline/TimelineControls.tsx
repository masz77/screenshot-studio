'use client';

import * as React from 'react';
import {
  PlayIcon,
  PauseIcon,
  RepeatIcon,
  RepeatOffIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import { useImageStore } from '@/lib/store';
import { cn } from '@/lib/utils';

function formatTimeDisplay(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface TimelineControlsProps {
  onClose?: () => void;
}

export function TimelineControls({ onClose }: TimelineControlsProps) {
  const {
    timeline,
    togglePlayback,
    setTimeline,
    setTimelineDuration,
  } = useImageStore();

  const { isPlaying, isLooping, playhead, duration } = timeline;

  const handleToggleLoop = () => setTimeline({ isLooping: !isLooping });
  const durationSeconds = duration / 1000;

  return (
    <div className="flex items-center px-3 py-2 bg-card border-b border-border/30 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {/* Loop toggle */}
        <button
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-full transition-colors',
            isLooping
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          onClick={handleToggleLoop}
          title={isLooping ? 'Loop enabled' : 'Loop disabled'}
        >
          {isLooping ? <RepeatIcon size={16} /> : <RepeatOffIcon size={16} />}
        </button>
      </div>

      {/* Center section */}
      <div className="flex-1 flex items-center justify-center">
        <button
          className="h-10 min-w-[100px] flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          onClick={togglePlayback}
        >
          {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Timestamp */}
        <div className="flex items-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatTimeDisplay(playhead)}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums ml-0.5">
            {' '}/ {formatTimeDisplay(duration)}
          </span>
        </div>

        {/* Duration slider */}
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={durationSeconds}
            onChange={(e) => setTimelineDuration(Number(e.target.value) * 1000)}
            className="w-[100px] h-1 appearance-none bg-border/40 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          {/* Zoom reset */}
          <button
            onClick={() => setTimeline({ zoom: 1 })}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors',
              timeline.zoom !== 1
                ? 'text-primary hover:bg-primary/10 cursor-pointer'
                : 'text-muted-foreground cursor-default'
            )}
            title={timeline.zoom !== 1 ? 'Reset zoom to 100%' : `Zoom: ${Math.round(timeline.zoom * 100)}%`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path fill="currentColor" d="M2 10.026c0 4.429 3.601 8.022 8.03 8.022a7.9 7.9 0 0 0 4.738-1.565l5.17 5.184c.213.208.491.313.782.313.634 0 1.072-.48 1.072-1.094 0-.292-.115-.557-.3-.764L16.34 14.96a7.93 7.93 0 0 0 1.708-4.934C18.048 5.601 14.455 2 10.03 2 5.601 2 2 5.601 2 10.026m1.532 0a6.497 6.497 0 0 1 6.498-6.494 6.5 6.5 0 0 1 6.494 6.494c0 3.581-2.917 6.498-6.494 6.498a6.503 6.503 0 0 1-6.498-6.498m3.177 0c0 .368.297.661.67.661h1.982v1.978c0 .377.292.674.669.67a.66.66 0 0 0 .661-.67v-1.978h1.974a.662.662 0 1 0 0-1.326h-1.974V7.379a.664.664 0 1 0-1.33 0v1.982H7.379a.66.66 0 0 0-.67.665" />
            </svg>
            <span className="text-[10px] font-medium tabular-nums">{Math.round(timeline.zoom * 100)}%</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border/40" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Close timeline"
        >
          <Cancel01Icon size={16} />
        </button>
      </div>
    </div>
  );
}
