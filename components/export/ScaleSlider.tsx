/**
 * Resolution scale slider component for export options
 */

import { Slider } from '@/components/ui/slider';

interface ScaleSliderProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const SCALE_OPTIONS = [1, 2, 3, 4, 5];

export function ScaleSlider({
  scale,
  onScaleChange,
  min = 1,
  max = 5,
  step = 1,
}: ScaleSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Resolution Scale</label>
        <span className="text-sm font-semibold text-primary tabular-nums">{scale}x</span>
      </div>

      <div className="space-y-2">
        <Slider
          value={[scale]}
          onValueChange={([value]) => onScaleChange(value)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />

        {/* Scale markers */}
        <div className="flex justify-between px-1">
          {SCALE_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onScaleChange(s)}
              className={`text-xs transition-colors ${
                s === scale
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Higher scale = better quality, larger file size
      </p>
    </div>
  );
}

