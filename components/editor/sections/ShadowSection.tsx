'use client';

import * as React from 'react';
import { useImageStore, type ShadowPreset } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';

const shadowPresets: { value: ShadowPreset; label: string; shadow: string }[] = [
  { value: 'none', label: 'None', shadow: 'none' },
  { value: 'hug', label: 'Hug', shadow: 'rgba(0,0,0,0.2) 0px 2px 12px 0px, rgba(0,0,0,0.14) 0px 1px 4px 0px' },
  { value: 'soft', label: 'Soft', shadow: 'rgba(0,0,0,0.28) 0px 12px 48px 0px, rgba(0,0,0,0.18) 0px 4px 12px 0px' },
  { value: 'strong', label: 'Strong', shadow: 'rgba(0,0,0,0.45) 0px 24px 80px 0px, rgba(0,0,0,0.3) 0px 8px 24px 0px' },
];

function ShadowPreview({ shadow }: { shadow: string }) {
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
          top: '26%',
          left: '26%',
          width: '95%',
          height: '95%',
          backgroundColor: 'rgb(255, 255, 255)',
          borderRadius: '10px',
          boxShadow: shadow,
        }}
      />
    </div>
  );
}

export function ShadowSection() {
  const { shadowPreset, setShadowPreset } = useImageStore();

  return (
    <SectionWrapper title="Shadow" defaultOpen={true}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}
      >
        {shadowPresets.map(({ value, label, shadow }) => {
          const isSelected = shadowPreset === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setShadowPreset(value)}
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
              <ShadowPreview shadow={shadow} />
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
    </SectionWrapper>
  );
}
