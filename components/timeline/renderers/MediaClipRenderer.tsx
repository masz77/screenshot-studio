'use client';

import { Cancel01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import type { MediaAction } from '@/lib/timeline/adapters';

interface MediaClipRendererProps {
  action: MediaAction;
  isActive: boolean;
  slidesCount: number;
  onRemove?: (slideId: string) => void;
  onSelect?: (slideId: string) => void;
}

export function MediaClipRenderer({ action, isActive, slidesCount, onRemove, onSelect }: MediaClipRendererProps) {
  return (
    <div
      className={cn(
        'relative w-full h-full cursor-pointer group/clip',
        isActive && slidesCount > 1 && 'ring-1 ring-inset ring-primary/50',
      )}
      onClick={() => action.id !== 'main' && onSelect?.(action.id)}
    >
      <div className="absolute inset-1 rounded-md overflow-hidden bg-muted/30 border border-border/20">
        <div className="flex items-center gap-2 h-full px-2">
          <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-border/20">
            <img src={action.slideSrc} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-foreground/70 font-medium truncate">
              {slidesCount > 1 ? `Slide ${action.slideIndex + 1}` : 'Mockup'}
            </span>
            <span className="text-[9px] text-muted-foreground truncate">
              {action.slideName}
            </span>
          </div>
        </div>
      </div>
      {slidesCount > 1 && action.id !== 'main' && onRemove && (
        <button
          className="absolute top-0 right-0 w-4 h-4 bg-background/80 rounded-full flex items-center justify-center hover:bg-destructive z-10 opacity-0 group-hover/clip:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(action.id);
          }}
        >
          <Cancel01Icon size={8} className="text-foreground" />
        </button>
      )}
    </div>
  );
}
