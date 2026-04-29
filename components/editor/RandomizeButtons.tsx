// components/editor/RandomizeButtons.tsx
'use client';

import * as React from 'react';
import { ShuffleIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/lib/store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RandomizeButtonsProps {
  variant: 'left' | 'right';
  className?: string;
}

interface ButtonDef {
  label: string;
  ariaLabel: string;
  tooltip: string;
  onClick: () => void;
  primary?: boolean;
}

export function RandomizeButtons({ variant, className }: RandomizeButtonsProps) {
  const randomizeFrame = useImageStore((s) => s.randomizeFrame);
  const randomizeBackground = useImageStore((s) => s.randomizeBackground);
  const randomize3D = useImageStore((s) => s.randomize3D);
  const randomizeMotion = useImageStore((s) => s.randomizeMotion);

  const buttons: ButtonDef[] =
    variant === 'left'
      ? [
          {
            label: 'Frame',
            ariaLabel: 'Randomize frame styling',
            tooltip: 'Randomize style, border radius, opacity, and shadow.',
            onClick: randomizeFrame,
            primary: true,
          },
          {
            label: 'Background',
            ariaLabel: 'Randomize background',
            tooltip: 'Pick a random background — image, gradient, mesh, or magic gradient.',
            onClick: randomizeBackground,
            primary: true,
          },
        ]
      : [
          {
            label: 'Motion',
            ariaLabel: 'Randomize motion preset',
            tooltip: 'Pick a different random entrance animation for each slide.',
            onClick: randomizeMotion,
            primary: true,
          },
          {
            label: '3D',
            ariaLabel: 'Randomize 3D perspective',
            tooltip: 'Apply a random 3D perspective preset (tilt, rotation, scale).',
            onClick: randomize3D,
          },
        ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        {buttons.map((b) => (
          <Tooltip key={b.label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={b.onClick}
                aria-label={b.ariaLabel}
                className={cn(
                  'flex items-center justify-between gap-2 h-9 px-3 rounded-lg',
                  'text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  b.primary
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80 hover:shadow-md'
                    : 'bg-muted/80 dark:bg-muted/50 border border-border/20 text-foreground hover:bg-accent'
                )}
              >
                <span className="font-medium truncate">{b.label}</span>
                <ShuffleIcon
                  size={14}
                  className={cn(
                    'shrink-0',
                    b.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side={variant === 'left' ? 'right' : 'left'} className="max-w-[220px]">
              {b.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
