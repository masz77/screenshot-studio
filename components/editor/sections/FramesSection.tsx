'use client';

import * as React from 'react';
import { useImageStore, type ImageBorder } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';

const frameOptions = [
  { value: 'none', label: 'None', image: 'https://assets.picyard.in/images/none.webp' },
  { value: 'arc-light', label: 'Arc Light', image: 'https://assets.picyard.in/images/arc-light.webp' },
  { value: 'arc-dark', label: 'Arc Dark', image: 'https://assets.picyard.in/images/arc-dark.webp' },
  { value: 'macos-dark', label: 'macOS Dark', image: 'https://assets.picyard.in/images/macos-black.webp' },
  { value: 'macos-light', label: 'macOS Light', image: 'https://assets.picyard.in/images/macos-white.webp' },
  { value: 'windows-dark', label: 'Windows Dark', image: 'https://assets.picyard.in/images/macos-black.webp' },
  { value: 'windows-light', label: 'Windows Light', image: 'https://assets.picyard.in/images/macos-white.webp' },
  { value: 'photograph', label: 'Polaroid', image: 'https://assets.picyard.in/images/photograph.webp' },
] as const;

type FrameType = (typeof frameOptions)[number]['value'];

export function FramesSection() {
  const { imageBorder, setImageBorder } = useImageStore();

  const handleSelect = (value: FrameType) => {
    const wasArc = imageBorder.type === 'arc-light' || imageBorder.type === 'arc-dark';
    const next: Partial<ImageBorder> = {
      type: value,
      enabled: value !== 'none',
    };
    // Set default width and opacity for arc frames
    if (value === 'arc-light' || value === 'arc-dark') {
      // Keep current width if already on arc, otherwise default to 8
      next.width = wasArc ? imageBorder.width : 8;
      next.opacity = imageBorder.opacity ?? (value === 'arc-light' ? 0.5 : 0.7);
    }
    // Set default title for macOS/Windows frames
    if (value === 'macos-light' || value === 'macos-dark') {
      next.title = imageBorder.title || 'file';
    }
    setImageBorder(next);
  };

  const isSelected = (value: FrameType) => imageBorder.type === value;
  const isArcFrame = ['arc-light', 'arc-dark'].includes(imageBorder.type);
  const showTitleInput = ['macos-light', 'macos-dark', 'windows-light', 'windows-dark'].includes(imageBorder.type);

  return (
    <SectionWrapper title="Window Frame" defaultOpen={true}>
      {/* Scrollable horizontal frame selector */}
      <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide select-none">
        {frameOptions.map(({ value, label, image }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <div
              className={cn(
                'flex h-20 w-24 items-center justify-center rounded-lg border-2 bg-muted/50 transition-all p-1.5',
                isSelected(value)
                  ? 'border-border bg-card/50'
                  : 'border-border/40 hover:border-border hover:bg-card/30'
              )}
            >
              <img
                src={image}
                alt={label}
                className="h-auto max-h-16 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <span className={cn(
              'text-xs whitespace-nowrap',
              isSelected(value) ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {isArcFrame && (
        <div className="space-y-2 pt-2">
          <Slider
            value={[imageBorder.width]}
            onValueChange={(value) => setImageBorder({ width: value[0], enabled: true })}
            min={1}
            max={20}
            step={1}
            label="Width"
            valueDisplay={`${imageBorder.width}px`}
          />
          <Slider
            value={[Math.round((imageBorder.opacity ?? (imageBorder.type === 'arc-light' ? 0.5 : 0.7)) * 100)]}
            onValueChange={(value) => setImageBorder({ opacity: value[0] / 100, enabled: true })}
            min={0}
            max={100}
            step={1}
            label="Opacity"
            valueDisplay={`${Math.round((imageBorder.opacity ?? (imageBorder.type === 'arc-light' ? 0.5 : 0.7)) * 100)}%`}
          />
        </div>
      )}

      {showTitleInput && (
        <div className="pt-2">
          <Input
            type="text"
            value={imageBorder.title || ''}
            onChange={(e) => setImageBorder({ title: e.target.value, enabled: true })}
            placeholder="Window title"
            className="h-9 text-sm bg-muted/50 border-border/60 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </SectionWrapper>
  );
}
