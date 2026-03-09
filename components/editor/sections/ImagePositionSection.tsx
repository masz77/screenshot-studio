'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { useEditorStore } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';

type PositionKey = 'auto' | 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';

const positions: { key: PositionKey; label: string; x: number; y: number }[] = [
  { key: 'auto', label: 'AUTO', x: 0, y: 0 },
  { key: 'tl', label: 'Top Left', x: -1, y: -1 },
  { key: 'tc', label: 'Top', x: 0, y: -1 },
  { key: 'tr', label: 'Top Right', x: 1, y: -1 },
  { key: 'ml', label: 'Left', x: -1, y: 0 },
  { key: 'mc', label: 'Center', x: 0, y: 0 },
  { key: 'mr', label: 'Right', x: 1, y: 0 },
  { key: 'bl', label: 'Bottom Left', x: -1, y: 1 },
  { key: 'bc', label: 'Bottom', x: 0, y: 1 },
  { key: 'br', label: 'Bottom Right', x: 1, y: 1 },
];

function PositionIcon({ x, y }: { x: number; y: number }) {
  // Show a small rectangle positioned within a container to visualize placement
  const rectW = 10;
  const rectH = 7;
  const pad = 1.5;
  const cx = 9 + x * (9 - rectW / 2 - pad);
  const cy = 9 + y * (9 - rectH / 2 - pad);

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="block">
      <rect x="0.5" y="0.5" width="17" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="0.8" opacity={0.3} />
      <rect
        x={cx - rectW / 2}
        y={cy - rectH / 2}
        width={rectW}
        height={rectH}
        rx="1"
        fill="currentColor"
        opacity={0.7}
      />
    </svg>
  );
}

export function ImagePositionSection() {
  const { canvasDimensions } = useImageStore();
  const { screenshot, setScreenshot } = useEditorStore();

  const [activePosition, setActivePosition] = React.useState<PositionKey>('auto');

  const handlePosition = (pos: typeof positions[number]) => {
    if (!canvasDimensions) return;

    const { canvasW, canvasH, framedW, framedH } = canvasDimensions;

    // Maximum offset from center before the frame goes off-canvas edge
    const maxX = Math.max(0, (canvasW - framedW) / 2);
    const maxY = Math.max(0, (canvasH - framedH) / 2);

    const offsetX = Math.round(pos.x * maxX);
    const offsetY = Math.round(pos.y * maxY);

    setScreenshot({ offsetX, offsetY });
    setActivePosition(pos.key);
  };

  // Detect if user manually dragged (offset doesn't match any preset)
  React.useEffect(() => {
    if (!canvasDimensions) return;
    const { canvasW, canvasH, framedW, framedH } = canvasDimensions;
    const maxX = Math.max(0, (canvasW - framedW) / 2);
    const maxY = Math.max(0, (canvasH - framedH) / 2);

    // Check if current offset matches any preset
    const match = positions.find((p) => {
      const px = Math.round(p.x * maxX);
      const py = Math.round(p.y * maxY);
      return Math.abs(screenshot.offsetX - px) < 2 && Math.abs(screenshot.offsetY - py) < 2;
    });

    if (match) {
      setActivePosition(match.key);
    } else {
      setActivePosition('auto'); // fallback
    }
  }, [screenshot.offsetX, screenshot.offsetY, canvasDimensions]);

  return (
    <SectionWrapper title="Position" defaultOpen={true}>
      <div className="grid grid-cols-5 gap-1 p-1">
        {/* AUTO button - spans first column */}
        <button
          type="button"
          onClick={() => handlePosition(positions[0])}
          className={cn(
            'col-span-2 flex items-center justify-center rounded-md h-8 text-[10px] font-semibold tracking-wide transition-all',
            activePosition === 'auto'
              ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          AUTO
        </button>

        {/* 3x3 position grid */}
        {positions.slice(1).map((pos) => (
          <button
            key={pos.key}
            type="button"
            title={pos.label}
            onClick={() => handlePosition(pos)}
            className={cn(
              'flex items-center justify-center rounded-md h-8 transition-all',
              activePosition === pos.key
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <PositionIcon x={pos.x} y={pos.y} />
          </button>
        ))}
      </div>
    </SectionWrapper>
  );
}
