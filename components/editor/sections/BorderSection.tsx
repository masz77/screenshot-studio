'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';

const borderPresets = [
  { value: 0, label: 'Sharp' },
  { value: 12, label: 'Curved' },
  { value: 20, label: 'Round' },
] as const;

function BorderPreview({ radius }: { radius: number }) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1',
        backgroundColor: 'rgb(200, 200, 204)',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '19.5%',
          left: '19.5%',
          width: '95.5%',
          height: '95.5%',
          backgroundColor: 'rgb(255, 255, 255)',
          borderRadius: radius === 0 ? '0px' : radius === 12 ? '12px' : '20px',
        }}
      />
    </div>
  );
}

export function BorderSection() {
  const { borderRadius, setBorderRadius, imageScale, setImageScale } = useImageStore();

  return (
    <SectionWrapper title="Border" defaultOpen={true}>
      <div className="space-y-3">
        {/* Preset buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
          }}
        >
          {borderPresets.map(({ value, label }) => {
            const isSelected = borderRadius === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setBorderRadius(value)}
                className={cn(
                  'flex flex-col items-center cursor-pointer transition-all',
                )}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: 'none',
                  background: isSelected ? 'var(--muted)' : 'transparent',
                  boxShadow: isSelected
                    ? '0 0 0 2px var(--primary)'
                    : '0 0 0 1px var(--border)',
                }}
              >
                <BorderPreview radius={value} />
                <span
                  style={{
                    fontSize: '10px',
                    lineHeight: '10px',
                    color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fine-tune slider */}
        <Slider
          value={[borderRadius]}
          onValueChange={(value) => setBorderRadius(value[0])}
          min={0}
          max={50}
          step={1}
          label="Radius"
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
