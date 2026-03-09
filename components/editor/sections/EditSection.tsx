'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { SectionWrapper } from './SectionWrapper';

export function EditSection() {
  const {
    borderRadius,
    imageScale,
    setBorderRadius,
    setImageScale,
  } = useImageStore();

  return (
    <SectionWrapper title="Image Style" defaultOpen={true}>
      <div className="space-y-2">
        <Slider
          value={[borderRadius]}
          onValueChange={(value) => setBorderRadius(value[0])}
          min={0}
          max={50}
          step={1}
          label="Round"
          valueDisplay={borderRadius}
        />
        <Slider
          value={[imageScale / 100]}
          onValueChange={(value) => setImageScale(Math.round(value[0] * 100))}
          min={0.1}
          max={2}
          step={0.01}
          label="Scale"
          valueDisplay={(imageScale / 100).toFixed(1)}
        />
      </div>
    </SectionWrapper>
  );
}
