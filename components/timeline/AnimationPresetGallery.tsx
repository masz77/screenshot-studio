'use client';

import * as React from 'react';
import { useImageStore, useEditorStore } from '@/lib/store';
import { ANIMATION_PRESETS, CATEGORY_LABELS } from '@/lib/animation/presets';
import { ALL_EXIT_PRESETS } from '@/lib/animation/exit-presets';
import { cn } from '@/lib/utils';
import type { AnimationPreset } from '@/types/animation';
import { Button } from '@/components/ui/button';
import { Delete02Icon } from 'hugeicons-react';

export function AnimationPresetGallery() {
  const {
    uploadedImageUrl,
    backgroundConfig,
    borderRadius,
    imageShadow,
    slides,
    setSlideInPreset,
    setSlideOutPreset,
    clearTimeline,
    applyPresetToAllSlides,
  } = useImageStore();

  const {
    screenshot,
    selectedSlot,
    pendingPresetId,
    setSelectedSlot,
    setPendingPresetId,
  } = useEditorStore();

  const previewImageUrl = uploadedImageUrl || screenshot?.src || null;

  // Determine which presets to show based on selected slot direction
  const showDirection: 'in' | 'out' | null = selectedSlot?.slot ?? null;

  const presetsToShow: AnimationPreset[] = React.useMemo(() => {
    if (showDirection === 'out') return ALL_EXIT_PRESETS;
    if (showDirection === 'in') return ANIMATION_PRESETS;
    // No slot selected — show all entrance presets by default
    return ANIMATION_PRESETS;
  }, [showDirection]);

  // Group presets by category
  const presetsByCategory = React.useMemo(() => {
    return presetsToShow.reduce(
      (acc, preset) => {
        if (!acc[preset.category]) {
          acc[preset.category] = [];
        }
        acc[preset.category].push(preset);
        return acc;
      },
      {} as Record<string, AnimationPreset[]>,
    );
  }, [presetsToShow]);

  const handlePresetClick = (preset: AnimationPreset) => {
    // Slot-first flow: a slot is selected, assign preset to it
    if (selectedSlot) {
      if (selectedSlot.slot === 'in') {
        setSlideInPreset(selectedSlot.slideId, preset.id);
      } else {
        setSlideOutPreset(selectedSlot.slideId, preset.id);
      }
      setSelectedSlot(null);
      return;
    }

    // Preset-first flow: no slot selected, set pending preset
    setPendingPresetId(preset.id);
  };

  const handleClearAll = () => {
    clearTimeline();
    setSelectedSlot(null);
    setPendingPresetId(null);
  };

  const hasAnyAnimations = slides.some(
    (s) => s.inPresetId !== null || s.outPresetId !== null,
  );

  const getBackgroundStyle = (): React.CSSProperties => {
    const { type, value, opacity = 1 } = backgroundConfig;
    if (type === 'image' && typeof value === 'string') {
      return { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity };
    }
    if (type === 'solid') {
      return { backgroundColor: value as string, opacity };
    }
    return { background: value as string, opacity };
  };

  // Find selected slot's slide name for banner
  const selectedSlideName = selectedSlot
    ? slides.find((s) => s.id === selectedSlot.slideId)?.name ??
      `Slide ${slides.findIndex((s) => s.id === selectedSlot.slideId) + 1}`
    : null;

  return (
    <div className="space-y-5">
      {/* Banner: slot-first flow */}
      {selectedSlot && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div>
            <span className="text-xs font-medium text-foreground/80">
              Pick an animation for{' '}
              <strong>
                {selectedSlideName} &mdash;{' '}
                {selectedSlot.slot === 'in' ? 'Entrance' : 'Exit'}
              </strong>
            </span>
          </div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedSlot(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Clear all button */}
      {hasAnyAnimations && !selectedSlot && (
        <div className="flex items-center justify-between p-3 bg-muted/50 border border-border/30 rounded-lg">
          <span className="text-xs text-foreground/60">
            Animations applied to slides
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
            onClick={handleClearAll}
          >
            <Delete02Icon size={14} className="mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Direction label */}
      {showDirection && (
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {showDirection === 'in' ? 'Entrance Animations' : 'Exit Animations'}
        </div>
      )}

      {/* Preset categories */}
      {Object.entries(presetsByCategory).map(([category, presets]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isPending = pendingPresetId === preset.id;
              // `selectedSlot?.slot` is the user's current selection if any;
              // otherwise default to the slot direction this gallery is showing.
              const effectiveSlot: 'in' | 'out' =
                selectedSlot?.slot ?? showDirection ?? 'in';
              return (
                <div
                  key={preset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePresetClick(preset)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePresetClick(preset);
                    }
                  }}
                  className={cn(
                    'group/preset relative flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all cursor-pointer',
                    'bg-muted/60 hover:bg-card/80',
                    'border-2',
                    isPending
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-border/50',
                  )}
                >
                  {/* Preview container */}
                  <div
                    className="relative w-full aspect-[4/3] rounded-md overflow-hidden"
                    style={getBackgroundStyle()}
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-1">
                      {previewImageUrl ? (
                        <div className="w-3/4 h-3/4">
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
                        <div className="w-3/4 h-3/4 bg-muted-foreground/40 rounded" />
                      )}
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-foreground/60 rounded text-[8px] text-background/80">
                      {(preset.duration / 1000).toFixed(1)}s
                    </div>
                  </div>

                  {/* Preset name */}
                  <span className="text-[9px] font-medium text-foreground/70 truncate w-full text-center">
                    {preset.name}
                  </span>

                  {/* Bulk apply pill */}
                  <button
                    type="button"
                    className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/90 text-primary-foreground opacity-0 group-hover/preset:opacity-100 transition-opacity hover:bg-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyPresetToAllSlides(preset.id, effectiveSlot);
                    }}
                    aria-label="Apply this preset to all slides"
                  >
                    All
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Instructions */}
      {!selectedSlot && !pendingPresetId && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border/30 space-y-1">
          <p className="text-xs text-foreground/60">
            Click a slot in the timeline, then pick an animation here.
          </p>
          <p className="text-[10px] text-foreground/40">
            Or click an animation here first, then click a slot to apply it.
          </p>
        </div>
      )}
    </div>
  );
}
