'use client';

import * as React from 'react';
import { VideoReplayIcon, Add01Icon, Cancel01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { getAnyPresetById } from '@/lib/animation/exit-presets';
import type { SlotAction } from '@/lib/timeline/adapters';

interface SlotRendererProps {
  action: SlotAction
  selectedSlot: { slideId: string; slot: 'in' | 'out' } | null
  onSlotClick: (slideId: string, slot: 'in' | 'out') => void
  onClearSlot: (slideId: string, slot: 'in' | 'out') => void
}

export function SlotRenderer({
  action,
  selectedSlot,
  onSlotClick,
  onClearSlot,
}: SlotRendererProps) {
  const inPreset = action.inPresetId ? getAnyPresetById(action.inPresetId) : null
  const outPreset = action.outPresetId ? getAnyPresetById(action.outPresetId) : null

  const isInSelected =
    selectedSlot?.slideId === action.slideId && selectedSlot?.slot === 'in'
  const isOutSelected =
    selectedSlot?.slideId === action.slideId && selectedSlot?.slot === 'out'

  return (
    <div className="flex w-full h-full gap-px">
      {/* In slot (50%) */}
      <button
        className={cn(
          'flex-1 flex items-center gap-1 px-2 rounded-l-lg overflow-hidden transition-all',
          inPreset
            ? 'bg-primary/15 border border-primary/30'
            : 'bg-muted/30 border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5',
          isInSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSlotClick(action.slideId, 'in')
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {inPreset ? (
          <>
            <VideoReplayIcon size={10} className="text-primary shrink-0" />
            <span className="text-[9px] text-primary font-medium truncate">
              {inPreset.name}
            </span>
            <button
              className="ml-auto shrink-0 w-3.5 h-3.5 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onClearSlot(action.slideId, 'in')
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Cancel01Icon size={7} className="text-destructive-foreground" />
            </button>
          </>
        ) : (
          <>
            <Add01Icon size={10} className="text-muted-foreground shrink-0" />
            <span className="text-[9px] text-muted-foreground truncate">In</span>
          </>
        )}
      </button>

      {/* Out slot (50%) */}
      <button
        className={cn(
          'flex-1 flex items-center gap-1 px-2 rounded-r-lg overflow-hidden transition-all',
          outPreset
            ? 'bg-primary/15 border border-primary/30'
            : 'bg-muted/30 border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5',
          isOutSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSlotClick(action.slideId, 'out')
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {outPreset ? (
          <>
            <VideoReplayIcon size={10} className="text-primary shrink-0" />
            <span className="text-[9px] text-primary font-medium truncate">
              {outPreset.name}
            </span>
            <button
              className="ml-auto shrink-0 w-3.5 h-3.5 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onClearSlot(action.slideId, 'out')
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Cancel01Icon size={7} className="text-destructive-foreground" />
            </button>
          </>
        ) : (
          <>
            <Add01Icon size={10} className="text-muted-foreground shrink-0" />
            <span className="text-[9px] text-muted-foreground truncate">Out</span>
          </>
        )}
      </button>
    </div>
  )
}
