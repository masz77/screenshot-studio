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
    <SectionWrapper title="Drop Shadow" defaultOpen={true}>
      <div className="space-y-2">
        <Slider
          value={[imageShadow.blur]}
          onValueChange={(value) => setImageShadow({ blur: value[0], enabled: value[0] > 0 || imageShadow.offsetX !== 0 || imageShadow.offsetY !== 0 })}
          min={0}
          max={100}
          step={1}
          label="Blur"
          valueDisplay={imageShadow.blur}
        />
        <Slider
          value={[imageShadow.offsetX]}
          onValueChange={(value) => setImageShadow({ offsetX: value[0] })}
          min={-50}
          max={50}
          step={1}
          label="X"
          valueDisplay={imageShadow.offsetX}
        />
        <Slider
          value={[imageShadow.offsetY]}
          onValueChange={(value) => setImageShadow({ offsetY: value[0] })}
          min={-50}
          max={50}
          step={1}
          label="Y"
          valueDisplay={imageShadow.offsetY}
        />
        <Slider
          value={[imageShadow.spread]}
          onValueChange={(value) => setImageShadow({ spread: value[0] })}
          min={0}
          max={50}
          step={1}
          label="Spread"
          valueDisplay={imageShadow.spread}
        />
        <Slider
          value={[Math.round((imageShadow.opacity ?? 0.5) * 100)]}
          onValueChange={(value) => setImageShadow({ opacity: value[0] / 100 })}
          min={0}
          max={100}
          step={1}
          label="Opacity"
          valueDisplay={`${Math.round((imageShadow.opacity ?? 0.5) * 100)}%`}
        />

        {/* Color */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary dark:bg-background">
          <span className="text-xs text-muted-foreground shrink-0">Color</span>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="color"
              value={getColorHex()}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-7 h-7 rounded-md border border-border/40 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-muted-foreground font-mono">{getColorHex()}</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
