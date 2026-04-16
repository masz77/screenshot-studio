'use client';

import { VideoReplayIcon, Cancel01Icon } from 'hugeicons-react';
import type { AnimationAction } from '@/lib/timeline/adapters';

interface AnimationClipRendererProps {
  action: AnimationAction;
  onRemove: (clipId: string) => void;
}

export function AnimationClipRenderer({ action, onRemove }: AnimationClipRendererProps) {
  return (
    <div className="relative w-full h-full rounded-lg bg-primary/15 border border-primary/30 group cursor-grab overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 h-full overflow-hidden pointer-events-none">
        <VideoReplayIcon size={12} className="text-primary shrink-0" />
        <span className="text-[10px] text-primary font-medium truncate">
          {action.clipName}
        </span>
      </div>
      <button
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-sm z-10 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(action.id);
        }}
      >
        <Cancel01Icon size={8} className="text-destructive-foreground" />
      </button>
    </div>
  );
}
