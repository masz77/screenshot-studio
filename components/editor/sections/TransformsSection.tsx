'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { TRANSFORM_PRESETS, type TransformPreset } from '@/lib/constants/transform-presets';

export function TransformsSection() {
  const { perspective3D, setPerspective3D } = useImageStore();
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const idx = TRANSFORM_PRESETS.findIndex((preset) => {
      const v = preset.values;
      return (
        Math.abs(v.rotateX - perspective3D.rotateX) < 2 &&
        Math.abs(v.rotateY - perspective3D.rotateY) < 2 &&
        Math.abs(v.rotateZ - perspective3D.rotateZ) < 2
      );
    });
    setSelectedIndex(idx >= 0 ? idx : null);
  }, [perspective3D]);

  const applyPreset = (preset: TransformPreset, index: number) => {
    setPerspective3D(preset.values);
    setSelectedIndex(index);
  };

  const getTransformStyle = (preset: TransformPreset) => {
    const { perspective, rotateX, rotateY, rotateZ, translateX, translateY, scale } = preset.values;
    return {
      transform: `perspective(${perspective}px) translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
    };
  };

  return (
    <SectionWrapper title="Transforms" sectionId="transforms" defaultOpen={true}>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TRANSFORM_PRESETS.map((preset, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset, index)}
              className={cn(
                'flex-shrink-0 flex items-center justify-center bg-card/60 w-16 h-16 rounded-xl overflow-hidden transition-all cursor-pointer',
                'hover:bg-accent/60',
                isSelected && 'ring-2 ring-border'
              )}
              title={preset.name}
            >
              <div
                className="w-9 h-9 bg-primary rounded-lg"
                style={getTransformStyle(preset)}
              />
            </button>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
