/**
 * Format selector component for export options
 */

import { cn } from '@/lib/utils';
import type { ExportFormat } from '@/lib/export/types';

interface FormatSelectorProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

const FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'png', label: 'PNG', description: 'Lossless, supports transparency' },
  { value: 'webp', label: 'WebP', description: 'Best compression, small & sharp' },
  { value: 'jpeg', label: 'JPEG', description: 'Smaller files, no transparency' },
];

export function FormatSelector({ format, onFormatChange }: FormatSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Format</label>
      <div className="grid grid-cols-3 gap-2 p-1 bg-muted dark:bg-card/50 rounded-xl">
        {FORMATS.map((f) => {
          const isSelected = f.value === format;
          return (
            <button
              key={f.value}
              onClick={() => onFormatChange(f.value)}
              className={cn(
                'relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isSelected
                  ? 'bg-background dark:bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 dark:hover:bg-accent/50'
              )}
            >
              {f.label}
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

