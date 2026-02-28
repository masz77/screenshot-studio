'use client';

import * as React from 'react';
import { useImageStore, type ImageFilters } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { RotateClockwiseIcon } from 'hugeicons-react';

type FilterTarget = 'foreground' | 'background';

export function SettingsSection() {
  const {
    imageFilters,
    backgroundBorderRadius,
    backgroundBlur,
    backgroundNoise,
    setImageFilter,
    resetImageFilters,
    setBackgroundBorderRadius,
    setBackgroundBlur,
    setBackgroundNoise,
  } = useImageStore();

  const [filterTarget, setFilterTarget] = React.useState<FilterTarget>('foreground');

  const foregroundFilters: { key: keyof ImageFilters; label: string; min: number; max: number; defaultValue: number }[] = [
    { key: 'brightness', label: 'Brightness', min: 0, max: 200, defaultValue: 100 },
    { key: 'contrast', label: 'Contrast', min: 0, max: 200, defaultValue: 100 },
    { key: 'saturate', label: 'Saturation', min: 0, max: 200, defaultValue: 100 },
    { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, defaultValue: 0 },
    { key: 'sepia', label: 'Sepia', min: 0, max: 100, defaultValue: 0 },
    { key: 'hueRotate', label: 'Hue', min: 0, max: 360, defaultValue: 0 },
    { key: 'blur', label: 'Blur', min: 0, max: 20, defaultValue: 0 },
    { key: 'invert', label: 'Invert', min: 0, max: 100, defaultValue: 0 },
  ];

  const isFiltersModified = Object.entries(imageFilters).some(([key, value]) => {
    const filter = foregroundFilters.find((f) => f.key === key);
    return filter && value !== filter.defaultValue;
  });

  const isBackgroundFiltersModified = backgroundBlur !== 0 || backgroundNoise !== 0;

  const resetBackgroundFilters = () => {
    setBackgroundBlur(0);
    setBackgroundNoise(0);
  };

  return (
    <>
      {/* Filters Section */}
      <SectionWrapper title="Filters" defaultOpen={true}>
        <div className="space-y-4">
          {/* Foreground/Background Toggle - Segmented Control */}
          <div className="relative flex p-0.5 bg-muted dark:bg-muted/80 rounded-lg border border-border/30">
            {/* Sliding background indicator */}
            <div
              className={cn(
                'absolute top-0.5 bottom-0.5 w-[calc(50%-4px)] bg-background dark:bg-accent rounded-md shadow-sm transition-all duration-200 ease-out',
                filterTarget === 'foreground' ? 'left-0.5' : 'left-[calc(50%+2px)]'
              )}
            />
            <button
              onClick={() => setFilterTarget('foreground')}
              className={cn(
                'relative z-10 flex-1 py-2 text-xs font-medium rounded-md transition-colors duration-150',
                filterTarget === 'foreground'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-muted-foreground'
              )}
            >
              Image
            </button>
            <button
              onClick={() => setFilterTarget('background')}
              className={cn(
                'relative z-10 flex-1 py-2 text-xs font-medium rounded-md transition-colors duration-150',
                filterTarget === 'background'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-muted-foreground'
              )}
            >
              Background
            </button>
          </div>

          {/* Foreground Filters */}
          {filterTarget === 'foreground' && (
            <div className="space-y-3">
              {foregroundFilters.map((filter) => (
                <div key={filter.key} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20 shrink-0">{filter.label}</span>
                  <Slider
                    value={[imageFilters[filter.key]]}
                    onValueChange={(value) => setImageFilter(filter.key, value[0])}
                    min={filter.min}
                    max={filter.max}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">
                    {imageFilters[filter.key]}{filter.key === 'hueRotate' ? '°' : filter.key === 'blur' ? 'px' : ''}
                  </span>
                </div>
              ))}

              {/* Reset Filters Button */}
              {isFiltersModified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetImageFilters}
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateClockwiseIcon size={14} className="mr-2" />
                  Reset All Filters
                </Button>
              )}
            </div>
          )}

          {/* Background Filters */}
          {filterTarget === 'background' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-20 shrink-0">Blur</span>
                <Slider
                  value={[backgroundBlur]}
                  onValueChange={(value) => setBackgroundBlur(value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{backgroundBlur}px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-20 shrink-0">Noise</span>
                <Slider
                  value={[backgroundNoise]}
                  onValueChange={(value) => setBackgroundNoise(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{backgroundNoise}%</span>
              </div>

              {/* Reset Background Filters Button */}
              {isBackgroundFiltersModified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetBackgroundFilters}
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateClockwiseIcon size={14} className="mr-2" />
                  Reset Background Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Canvas Section */}
      <SectionWrapper title="Canvas" defaultOpen={true}>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground w-20 shrink-0">Radius</span>
          <Slider
            value={[backgroundBorderRadius]}
            onValueChange={(value) => setBackgroundBorderRadius(value[0])}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{backgroundBorderRadius}px</span>
        </div>
      </SectionWrapper>
    </>
  );
}
