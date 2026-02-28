'use client';

import * as React from 'react';
import { useImageStore, useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';

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

// Perspective in em units (150em = ~2400px at 16px base)
const PRESET_CATEGORIES: PresetCategory[] = [
  {
    name: 'Basic',
    presets: [
      { name: 'Default', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 0, scale: 1 } },
      { name: 'Tilt Left', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: -8, translateX: 0, translateY: 0, scale: 0.95 } },
      { name: 'Tilt Right', values: { perspective: 2400, rotateX: 0, rotateY: 0, rotateZ: 8, translateX: 0, translateY: 0, scale: 0.95 } },
      { name: 'Subtle Left', values: { perspective: 2400, rotateX: 3, rotateY: -8, rotateZ: 0, translateX: -2, translateY: 0, scale: 1 } },
      { name: 'Subtle Right', values: { perspective: 2400, rotateX: 3, rotateY: 8, rotateZ: 0, translateX: 2, translateY: 0, scale: 1 } },
      { name: 'Lean Back', values: { perspective: 2400, rotateX: -15, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 5, scale: 0.98 } },
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

// Flatten for selection detection
const ALL_PRESETS = PRESET_CATEGORIES.flatMap((cat) => cat.presets);

export function TransformsGallery() {
  const {
    uploadedImageUrl,
    perspective3D,
    setPerspective3D,
    backgroundConfig,
    borderRadius,
    imageShadow,
  } = useImageStore();

  const { screenshot } = useEditorStore();

  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // Detect which preset matches current transform
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

  // Get global index for a preset
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

  const getTransformStyle = (preset: TransformPreset): React.CSSProperties => {
    const { perspective, rotateX, rotateY, rotateZ, translateX, translateY, scale } = preset.values;
    return {
      transform: `perspective(${perspective}px) translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
    };
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    const { type, value, opacity = 1 } = backgroundConfig;

    if (type === 'image' && typeof value === 'string') {
      return {
        backgroundImage: `url(${value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity,
      };
    }

    if (type === 'solid') {
      return {
        backgroundColor: value as string,
        opacity,
      };
    }

    return {
      background: value as string,
      opacity,
    };
  };

  const previewImageUrl = uploadedImageUrl || screenshot?.src || null;

  return (
    <div className="space-y-5">
      {PRESET_CATEGORIES.map((category, categoryIndex) => (
        <div key={category.name} className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {category.name}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {category.presets.map((preset, presetIndex) => {
              const globalIndex = getGlobalIndex(categoryIndex, presetIndex);
              const isSelected = selectedIndex === globalIndex;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset, globalIndex)}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all',
                    'bg-muted/60 hover:bg-card/80',
                    'border-2',
                    isSelected
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-transparent hover:border-border/50'
                  )}
                >
                  {/* Preview container */}
                  <div
                    className="relative w-full aspect-[4/3] rounded-md overflow-hidden"
                    style={{
                      ...getBackgroundStyle(),
                    }}
                  >
                    {/* Mini preview with transform */}
                    <div className="absolute inset-0 flex items-center justify-center p-1">
                      {previewImageUrl ? (
                        <div
                          className="w-3/4 h-3/4"
                          style={getTransformStyle(preset)}
                        >
                          <img
                            src={previewImageUrl}
                            alt={preset.name}
                            className="w-full h-full object-contain rounded-sm"
                            style={{
                              borderRadius: `${Math.min(borderRadius, 4)}px`,
                              boxShadow: imageShadow.enabled
                                ? 'rgba(0, 0, 0, 0.3) 1px 1px 4px'
                                : undefined,
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className="w-3/4 h-3/4 bg-muted-foreground/40 rounded"
                          style={getTransformStyle(preset)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Preset name */}
                  <span className="text-[9px] font-medium text-foreground/70 truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

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
