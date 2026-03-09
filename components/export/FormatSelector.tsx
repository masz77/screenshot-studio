/**
 * Format selector with expanding pill animation.
 * Selected tab expands to show full label; unselected tabs show short label.
 */

import { cn } from '@/lib/utils';
import type { ExportFormat } from '@/lib/export/types';

interface FormatSelectorProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

const FORMATS: { value: ExportFormat; short: string; full: string; description: string }[] = [
  { value: 'jpeg', short: 'JPG', full: 'JPEG', description: 'Smaller files, great for sharing' },
  { value: 'png', short: 'PNG', full: 'PNG', description: 'Lossless, supports transparency' },
  { value: 'webp', short: 'WebP', full: 'WebP', description: 'Best compression, small & sharp' },
];

export function FormatSelector({ format, onFormatChange }: FormatSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Format</label>
      <div className="flex gap-1.5 p-1 bg-muted dark:bg-card/50 rounded-xl">
        {FORMATS.map((f) => {
          const isSelected = f.value === format;
          return (
            <button
              key={f.value}
              onClick={() => onFormatChange(f.value)}
              className={cn(
                'relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isSelected
                  ? 'bg-background dark:bg-accent text-foreground flex-[1.8] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground flex-1'
              )}
            >
              <span className={cn(
                'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                isSelected ? 'text-sm' : 'text-xs'
              )}>
                {isSelected ? f.full : f.short}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {FORMATS.find((f) => f.value === format)?.description}
      </p>
    </div>
  );
}
