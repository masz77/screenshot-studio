'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { SectionWrapper } from './SectionWrapper';

export function ShadowSection() {
  const { imageShadow, setImageShadow } = useImageStore();

  const getColorHex = () => {
    const rgbMatch = imageShadow.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
    }
    if (imageShadow.color.startsWith('#')) return imageShadow.color;
    return '#000000';
  };

  const handleColorChange = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const alphaMatch = imageShadow.color.match(/rgba\([^)]+,\s*([\d.]+)\)/);
    const currentAlpha = alphaMatch ? alphaMatch[1] : '0.6';
    setImageShadow({ color: `rgba(${r}, ${g}, ${b}, ${currentAlpha})`, enabled: true });
  };

  return (
    <SectionWrapper title="Shadow" defaultOpen={true}>
      {/* Blur */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-14 shrink-0">Blur</span>
        <Slider
          value={[imageShadow.blur]}
          onValueChange={(value) => setImageShadow({ blur: value[0], enabled: value[0] > 0 || imageShadow.offsetX !== 0 || imageShadow.offsetY !== 0 })}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{imageShadow.blur}</span>
      </div>

      {/* Offset X */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-14 shrink-0">X</span>
        <Slider
          value={[imageShadow.offsetX]}
          onValueChange={(value) => setImageShadow({ offsetX: value[0] })}
          min={-50}
          max={50}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{imageShadow.offsetX}</span>
      </div>

      {/* Offset Y */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-14 shrink-0">Y</span>
        <Slider
          value={[imageShadow.offsetY]}
          onValueChange={(value) => setImageShadow({ offsetY: value[0] })}
          min={-50}
          max={50}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{imageShadow.offsetY}</span>
      </div>

      {/* Spread */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-14 shrink-0">Spread</span>
        <Slider
          value={[imageShadow.spread]}
          onValueChange={(value) => setImageShadow({ spread: value[0] })}
          min={0}
          max={50}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{imageShadow.spread}</span>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-14 shrink-0">Opacity</span>
        <Slider
          value={[Math.round((imageShadow.opacity ?? 0.5) * 100)]}
          onValueChange={(value) => setImageShadow({ opacity: value[0] / 100 })}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-10 text-right tabular-nums">{Math.round((imageShadow.opacity ?? 0.5) * 100)}%</span>
      </div>

      {/* Color */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-14 shrink-0">Color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={getColorHex()}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-9 h-9 rounded-lg border border-border/60 cursor-pointer bg-transparent"
          />
          <span className="text-sm text-muted-foreground font-mono">{getColorHex()}</span>
        </div>
      </div>
    </SectionWrapper>
  );
}
