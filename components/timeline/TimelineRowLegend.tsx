'use client';

import * as React from 'react';
import { VideoReplayIcon, Image01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

const LEGEND_WIDTH = 140;
const RULER_OFFSET = 42; // 32px scale row + 10px edit-area top margin

interface RowSpec {
  id: string;
  height: number;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accentClass: string;
}

interface TimelineRowLegendProps {
  rows: RowSpec[];
  className?: string;
}

export function TimelineRowLegend({ rows, className }: TimelineRowLegendProps) {
  return (
    <div
      className={cn(
        'shrink-0 border-r border-border/30 bg-card/50 select-none',
        className
      )}
      style={{ width: LEGEND_WIDTH }}
    >
      {/* Spacer matching the ruler row inside Timeline */}
      <div style={{ height: RULER_OFFSET }} className="border-b border-border/20" />

      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-2 px-3 border-b border-border/15"
          style={{ height: row.height }}
        >
          <span className={cn('shrink-0', row.accentClass)}>{row.icon}</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-foreground truncate">
              {row.label}
            </span>
            <span className="text-[9px] text-muted-foreground truncate leading-tight">
              {row.hint}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const TIMELINE_LEGEND_ROWS = (rowHeights: {
  animation: number;
  media: number;
}): RowSpec[] => [
  {
    id: 'animation',
    height: rowHeights.animation,
    label: 'Motion',
    hint: 'Entrance & exit per slide. Click + In / + Out.',
    icon: <VideoReplayIcon size={14} />,
    accentClass: 'text-primary',
  },
  {
    id: 'media',
    height: rowHeights.media,
    label: 'Slides',
    hint: 'Order, duration. Drag edges to retime.',
    icon: <Image01Icon size={14} />,
    accentClass: 'text-foreground/70',
  },
];

export const TIMELINE_LEGEND_WIDTH = LEGEND_WIDTH;
