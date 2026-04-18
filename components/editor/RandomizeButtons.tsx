// components/editor/RandomizeButtons.tsx
'use client';

import * as React from 'react';
import { ShuffleIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/lib/store';

interface RandomizeButtonsProps {
  variant: 'left' | 'right';
  className?: string;
}

interface ButtonDef {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

export function RandomizeButtons({ variant, className }: RandomizeButtonsProps) {
  const randomizeFrame = useImageStore((s) => s.randomizeFrame);
  const randomizeBackground = useImageStore((s) => s.randomizeBackground);
  const randomize3D = useImageStore((s) => s.randomize3D);
  const randomizeMotion = useImageStore((s) => s.randomizeMotion);

  const buttons: ButtonDef[] =
    variant === 'left'
      ? [
          { label: 'Frame', ariaLabel: 'Randomize frame styling', onClick: randomizeFrame },
          { label: 'Background', ariaLabel: 'Randomize background', onClick: randomizeBackground },
        ]
      : [
          { label: '3D', ariaLabel: 'Randomize 3D perspective', onClick: randomize3D },
          { label: 'Motion', ariaLabel: 'Randomize motion preset', onClick: randomizeMotion },
        ];

  return (
    <div className={cn('grid grid-cols-2 gap-1.5', className)}>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          aria-label={b.ariaLabel}
          className={cn(
            'flex items-center justify-between gap-2 h-9 px-3 rounded-lg',
            'bg-muted/80 dark:bg-muted/50 border border-border/20',
            'text-sm text-foreground',
            'hover:bg-accent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <span className="font-medium truncate">{b.label}</span>
          <ShuffleIcon size={14} className="text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
