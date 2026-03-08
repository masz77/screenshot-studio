'use client';

import * as React from 'react';
import { useImageStore, useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getBackgroundCSS } from '@/lib/constants/backgrounds';
import { aspectRatios } from '@/lib/constants/aspect-ratios';

interface TransformPreset {
  name: string;
  values: {
    perspective: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    translateX: number;
    translateY: number;
    scale: number;
  };
}

interface PresetCategory {
  name: string;
  presets: TransformPreset[];
}

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    name: 'Popular',
    presets: [
      { name: 'Default', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 0, scale: 1 } },
      { name: 'SaaS Hero', values: { perspective: 2400, rotateX: 8, rotateY: -6, rotateZ: 0, translateX: 0, translateY: -2, scale: 0.98 } },
      { name: 'Product Shot', values: { perspective: 2000, rotateX: 5, rotateY: 12, rotateZ: 0, translateX: 3, translateY: -1, scale: 0.97 } },
      { name: 'App Preview', values: { perspective: 2400, rotateX: 12, rotateY: -10, rotateZ: 0, translateX: -2, translateY: -3, scale: 0.96 } },
      { name: 'Clean Angle', values: { perspective: 2400, rotateX: 6, rotateY: 8, rotateZ: -2, translateX: 2, translateY: -1, scale: 0.98 } },
      { name: 'Landing Page', values: { perspective: 1800, rotateX: 15, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -5, scale: 0.95 } },
    ],
  },
  {
    name: 'Basic',
    presets: [
      { name: 'Tilt Left', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: -8, translateX: 0, translateY: 0, scale: 0.95 } },
      { name: 'Tilt Right', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: 8, translateX: 0, translateY: 0, scale: 0.95 } },
      { name: 'Subtle Left', values: { perspective: 2400, rotateX: 3, rotateY: -8, rotateZ: 0, translateX: -2, translateY: 0, scale: 1 } },
      { name: 'Subtle Right', values: { perspective: 2400, rotateX: 3, rotateY: 8, rotateZ: 0, translateX: 2, translateY: 0, scale: 1 } },
      { name: 'Lean Back', values: { perspective: 2400, rotateX: -15, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 5, scale: 0.98 } },
      { name: 'Lean Forward', values: { perspective: 2400, rotateX: 18, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -4, scale: 0.97 } },
    ],
  },
  {
    name: 'Dramatic',
    presets: [
      { name: 'Dramatic Left', values: { perspective: 2400, rotateX: 10, rotateY: -20, rotateZ: 8, translateX: -4, translateY: -2, scale: 0.95 } },
      { name: 'Dramatic Right', values: { perspective: 2400, rotateX: 10, rotateY: 20, rotateZ: -8, translateX: 4, translateY: -2, scale: 0.95 } },
      { name: 'Hero Left', values: { perspective: 1800, rotateX: 8, rotateY: -25, rotateZ: 5, translateX: -6, translateY: 0, scale: 0.92 } },
      { name: 'Hero Right', values: { perspective: 1800, rotateX: 8, rotateY: 25, rotateZ: -5, translateX: 6, translateY: 0, scale: 0.92 } },
      { name: 'Showcase L', values: { perspective: 1500, rotateX: 15, rotateY: -30, rotateZ: 5, translateX: -10, translateY: -3, scale: 0.88 } },
      { name: 'Showcase R', values: { perspective: 1500, rotateX: 15, rotateY: 30, rotateZ: -5, translateX: 10, translateY: -3, scale: 0.88 } },
    ],
  },
  {
    name: 'Perspective',
    presets: [
      { name: 'Top Down', values: { perspective: 2400, rotateX: 40, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -5, scale: 0.95 } },
      { name: 'Bottom Up', values: { perspective: 2400, rotateX: -35, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 8, scale: 0.95 } },
      { name: 'Lay Flat', values: { perspective: 2400, rotateX: 55, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -12, scale: 0.8 } },
      { name: 'Magazine', values: { perspective: 2400, rotateX: 58, rotateY: 8, rotateZ: 38, translateX: 0, translateY: -8, scale: 0.82 } },
      { name: 'Isometric L', values: { perspective: 2400, rotateX: 45, rotateY: 0, rotateZ: -45, translateX: 0, translateY: -5, scale: 0.9 } },
      { name: 'Isometric R', values: { perspective: 2400, rotateX: 38.4, rotateY: -6.4, rotateZ: 25, translateX: 0, translateY: -5.8, scale: 0.9 } },
      { name: 'Isometric Top', values: { perspective: 2400, rotateX: 50, rotateY: 0, rotateZ: 45, translateX: 0, translateY: -8, scale: 0.85 } },
      { name: 'Table Left', values: { perspective: 2400, rotateX: 55, rotateY: 10, rotateZ: -35, translateX: 0, translateY: -10, scale: 0.8 } },
    ],
  },
  {
    name: 'Zoom',
    presets: [
      { name: 'Zoom Center', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 0, scale: 1.2 } },
      { name: 'Zoom Left', values: { perspective: 2400, rotateX: 0, rotateY: 8, rotateZ: 0, translateX: 15, translateY: 0, scale: 1.15 } },
      { name: 'Zoom Right', values: { perspective: 2400, rotateX: 0, rotateY: -8, rotateZ: 0, translateX: -15, translateY: 0, scale: 1.15 } },
      { name: 'Zoom Top', values: { perspective: 2400, rotateX: 5, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 12, scale: 1.15 } },
      { name: 'Zoom Bottom', values: { perspective: 2400, rotateX: -5, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -12, scale: 1.15 } },
    ],
  },
  {
    name: 'Half Section',
    presets: [
      { name: 'Half Left', values: { perspective: 2400, rotateX: 0, rotateY: 12, rotateZ: -2, translateX: 20, translateY: 0, scale: 1.25 } },
      { name: 'Half Right', values: { perspective: 2400, rotateX: 0, rotateY: -12, rotateZ: 2, translateX: -20, translateY: 0, scale: 1.25 } },
      { name: 'Half Top', values: { perspective: 2400, rotateX: 10, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 18, scale: 1.25 } },
      { name: 'Half Bottom', values: { perspective: 2400, rotateX: -10, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -18, scale: 1.25 } },
    ],
  },
  {
    name: 'Float',
    presets: [
      { name: 'Float Up', values: { perspective: 2400, rotateX: 12, rotateY: 0, rotateZ: 0, translateX: 0, translateY: -10, scale: 1.05 } },
      { name: 'Float Down', values: { perspective: 2400, rotateX: -8, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 10, scale: 1.05 } },
      { name: 'Hover Left', values: { perspective: 2000, rotateX: 5, rotateY: -15, rotateZ: 3, translateX: -8, translateY: -5, scale: 1.02 } },
      { name: 'Hover Right', values: { perspective: 2000, rotateX: 5, rotateY: 15, rotateZ: -3, translateX: 8, translateY: -5, scale: 1.02 } },
    ],
  },
];

const ALL_PRESETS = PRESET_CATEGORIES.flatMap((cat) => cat.presets);

export function TransformsGallery() {
  const {
    uploadedImageUrl,
    perspective3D,
    setPerspective3D,
    backgroundConfig,
    backgroundBorderRadius,
    borderRadius,
    imageShadow,
  } = useImageStore();

  const { screenshot } = useEditorStore();

  const selectedAspectRatio = useImageStore((s) => s.selectedAspectRatio);
  const ar = aspectRatios.find((a) => a.id === selectedAspectRatio);
  const cssAspectRatio = ar ? `${ar.width} / ${ar.height}` : '4 / 3';

  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['Popular'])
  );

  React.useEffect(() => {
    const idx = ALL_PRESETS.findIndex((preset) => {
      const v = preset.values;
      return (
        Math.abs(v.rotateX - perspective3D.rotateX) < 2 &&
        Math.abs(v.rotateY - perspective3D.rotateY) < 2 &&
        Math.abs(v.rotateZ - perspective3D.rotateZ) < 2
      );
    });
    setSelectedIndex(idx >= 0 ? idx : null);
  }, [perspective3D]);

  const getGlobalIndex = (categoryIndex: number, presetIndex: number): number => {
    let index = 0;
    for (let i = 0; i < categoryIndex; i++) {
      index += PRESET_CATEGORIES[i].presets.length;
    }
    return index + presetIndex;
  };

  const applyPreset = (preset: TransformPreset, index: number) => {
    setPerspective3D(preset.values);
    setSelectedIndex(index);
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const previewImageUrl = uploadedImageUrl || screenshot?.src || null;

  // Use the same background CSS as the main canvas
  const backgroundStyle = getBackgroundCSS(backgroundConfig);
  const previewBorderRadius = Math.round(backgroundBorderRadius * 0.15);
  const previewImageRadius = Math.round(Math.min(borderRadius, 20) * 0.3);

  return (
    <div className="space-y-3">
      {PRESET_CATEGORIES.map((category, categoryIndex) => {
        const isExpanded = expandedCategories.has(category.name);
        return (
          <div key={category.name}>
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center gap-2 py-1.5 group"
            >
              <span className={cn(
                'text-[10px] font-semibold uppercase tracking-widest transition-colors',
                isExpanded ? 'text-muted-foreground' : 'text-muted-foreground/60'
              )}>
                {category.name}
              </span>
              <div className="flex-1 h-px bg-border/30" />
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className={cn(
                  'text-muted-foreground/50 transition-transform duration-200',
                  !isExpanded && '-rotate-90'
                )}
              >
                <path d="M3 2L7 5L3 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isExpanded && (
              <div className="space-y-2 pt-1 pb-2">
                {category.presets.map((preset, presetIndex) => {
                  const globalIndex = getGlobalIndex(categoryIndex, presetIndex);
                  const isSelected = selectedIndex === globalIndex;
                  const { perspective, rotateX, rotateY, rotateZ, translateX, translateY, scale } = preset.values;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset, globalIndex)}
                      className={cn(
                        'relative w-full rounded-xl overflow-hidden transition-all duration-200 group/card',
                        'border-2',
                        isSelected
                          ? 'border-primary shadow-lg shadow-primary/15 ring-1 ring-primary/20'
                          : 'border-border/30 hover:border-border/60 hover:shadow-md'
                      )}
                      style={{ aspectRatio: cssAspectRatio }}
                    >
                      {/* Background - same as canvas */}
                      <div
                        className="absolute inset-0"
                        style={{
                          ...backgroundStyle,
                          borderRadius: `${previewBorderRadius}px`,
                        }}
                      />

                      {/* 3D transform preview - perspective on parent, transform on child */}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ perspective: `${perspective}px` }}
                      >
                        {previewImageUrl ? (
                          <div
                            className="w-[85%] h-[85%] transition-transform duration-150"
                            style={{
                              transform: `translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <img
                              src={previewImageUrl}
                              alt={preset.name}
                              className="w-full h-full object-contain"
                              style={{
                                borderRadius: `${previewImageRadius}px`,
                                filter: imageShadow.enabled
                                  ? `drop-shadow(${imageShadow.offsetX * 0.15}px ${imageShadow.offsetY * 0.15}px ${(imageShadow.blur + imageShadow.spread) * 0.15}px ${imageShadow.color})`
                                  : undefined,
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-[85%] h-[85%] bg-muted-foreground/20 rounded-md border border-border/20"
                            style={{
                              transform: `translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                              transformOrigin: 'center center',
                            }}
                          />
                        )}
                      </div>

                      {/* Name badge */}
                      <div className={cn(
                        'absolute bottom-0 inset-x-0 flex justify-center pb-1.5 transition-opacity duration-150',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                      )}>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md',
                          isSelected
                            ? 'bg-primary/90 text-primary-foreground'
                            : 'bg-foreground/60 text-background'
                        )}>
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {!previewImageUrl && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            Upload an image to see transform previews
          </p>
        </div>
      )}
    </div>
  );
}
