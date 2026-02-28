/**
 * Quality preset selector component for export options
 */

import { cn } from '@/lib/utils';
import type { ExportFormat, QualityPreset } from '@/lib/export/types';
import { QUALITY_PRESET_LABELS } from '@/lib/export/types';

interface QualityPresetSelectorProps {
  qualityPreset: QualityPreset;
  format: ExportFormat;
  onQualityPresetChange: (preset: QualityPreset) => void;
}

const PRESETS: QualityPreset[] = ['high', 'medium', 'low'];

export function QualityPresetSelector({
  qualityPreset,
  format,
  onQualityPresetChange,
}: QualityPresetSelectorProps) {
  const currentLabel = QUALITY_PRESET_LABELS[qualityPreset];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Quality</label>
      <div className="grid grid-cols-3 gap-2 p-1 bg-muted dark:bg-card/50 rounded-xl">
        {PRESETS.map((preset) => {
          const isSelected = preset === qualityPreset;
          return (
            <button
              key={preset}
              onClick={() => onQualityPresetChange(preset)}
              className={cn(
                'relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isSelected
                  ? 'bg-background dark:bg-accent text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 dark:hover:bg-accent/50'
              )}
            >
              {QUALITY_PRESET_LABELS[preset].label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {currentLabel.description[format]}
      </p>
    </div>
  );
}
