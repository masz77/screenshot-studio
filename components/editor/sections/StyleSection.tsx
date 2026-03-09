'use client';

import * as React from 'react';
import { useImageStore, type ImageStylePreset } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';

const stylePresets: { value: ImageStylePreset; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'glass-light', label: 'Glass Light' },
  { value: 'glass-dark', label: 'Glass Dark' },
  { value: 'outline', label: 'Outline' },
  { value: 'border-light', label: 'Border' },
  { value: 'border-dark', label: 'Border Dark' },
];

function StylePreview({ preset }: { preset: ImageStylePreset }) {
  const outerBg = preset === 'glass-dark' || preset === 'border-dark'
    ? 'rgb(176, 176, 180)'
    : 'rgb(200, 200, 204)';

  const getInnerStyle = (): React.CSSProperties => {
    switch (preset) {
      case 'default':
        return {
          background: 'rgb(255, 255, 255)',
          borderRadius: '8px',
        };
      case 'glass-light':
        return {
          background: 'rgba(255, 255, 255, 0.25)',
          padding: '3px',
          borderRadius: '11px',
        };
      case 'glass-dark':
        return {
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '3px',
          borderRadius: '11px',
        };
      case 'outline':
        return {
          background: 'rgba(255, 255, 255, 0.35)',
          padding: '2px',
          borderRadius: '10px',
        };
      case 'border-light':
        return {
          background: 'rgb(255, 255, 255)',
          padding: '5px',
          borderRadius: '12px',
        };
      case 'border-dark':
        return {
          background: 'rgb(26, 26, 26)',
          padding: '5px',
          borderRadius: '12px',
        };
    }
  };

  const hasWrapper = preset !== 'default';

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1',
        backgroundColor: outerBg,
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
          ...(hasWrapper ? getInnerStyle() : {}),
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '8px',
            ...(preset === 'default' ? { borderRadius: '8px' } : {}),
          }}
        />
      </div>
    </div>
  );
}

export function StyleSection() {
  const { imageStylePreset, setImageStylePreset, imageBorder, setImageBorder } = useImageStore();

  const isNonDefault = imageStylePreset !== 'default';
  const currentOpacity = imageBorder.opacity ?? 0.3;
  const currentPadding = imageBorder.padding ?? 2;

  return (
    <SectionWrapper title="Style" defaultOpen={true}>
      <div className="space-y-3">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
          }}
        >
          {stylePresets.map(({ value, label }) => {
            const isSelected = imageStylePreset === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setImageStylePreset(value)}
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
                <StylePreview preset={value} />
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

        {isNonDefault && (
          <>
            <Slider
              value={[currentPadding]}
              onValueChange={(value) => setImageBorder({ padding: value[0] })}
              min={0}
              max={8}
              step={0.5}
              label="Padding"
              valueDisplay={currentPadding.toFixed(1)}
            />
            <Slider
              value={[Math.round(currentOpacity * 100)]}
              onValueChange={(value) => setImageBorder({ opacity: value[0] / 100 })}
              min={5}
              max={100}
              step={1}
              label="Opacity"
              valueDisplay={`${Math.round(currentOpacity * 100)}%`}
            />
          </>
        )}
      </div>
    </SectionWrapper>
  );
}
