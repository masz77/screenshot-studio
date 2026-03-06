'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import type { AnnotationToolType } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { Delete02Icon } from 'hugeicons-react';

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: { id: AnnotationToolType; label: string; svg: React.ReactNode }[] = [
  {
    id: 'arrow',
    label: 'Arrow',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 14L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 4L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'curved-arrow',
    label: 'Curve',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 13C4 13 5 5 10 5C13 5 14 7 14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M11.5 5.5L14.5 7L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'Line',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 14L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    label: 'Rect',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'blur',
    label: 'Blur',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2" />
        <path d="M7 8h4M6 10h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
];

const COLORS = [
  { value: '#ef4444', name: 'Red' },
  { value: '#f97316', name: 'Orange' },
  { value: '#eab308', name: 'Yellow' },
  { value: '#22c55e', name: 'Green' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#000000', name: 'Black' },
  { value: '#ffffff', name: 'White' },
];

const STROKE_PRESETS = [2, 4, 6, 8, 12];

// ── Component ─────────────────────────────────────────────────────────────────

export function AnnotateSection() {
  const {
    annotations,
    activeAnnotationTool,
    setActiveAnnotationTool,
    selectedAnnotationId,
    setSelectedAnnotationId,
    clearAnnotations,
    annotationDefaults,
    setAnnotationDefaults,
    updateAnnotation,
    blurRegions,
    updateBlurRegion,
    removeBlurRegion,
    clearBlurRegions,
    removeAnnotation,
  } = useImageStore();

  const selectedAnnotation = selectedAnnotationId
    ? annotations.find((a) => a.id === selectedAnnotationId) ?? null
    : null;

  const currentColor = selectedAnnotation?.strokeColor ?? annotationDefaults.strokeColor;
  const currentWidth = selectedAnnotation?.strokeWidth ?? annotationDefaults.strokeWidth;

  const handleToolClick = (toolId: AnnotationToolType) => {
    setActiveAnnotationTool(activeAnnotationTool === toolId ? null : toolId);
    setSelectedAnnotationId(null);
  };

  const handleColorChange = (color: string) => {
    if (selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { strokeColor: color });
    }
    setAnnotationDefaults({ strokeColor: color });
  };

  const handleWidthChange = (width: number) => {
    if (selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, { strokeWidth: width });
    }
    setAnnotationDefaults({ strokeWidth: width });
  };

  const handleDeleteSelected = () => {
    if (selectedAnnotationId) {
      removeAnnotation(selectedAnnotationId);
      setSelectedAnnotationId(null);
    }
  };

  const totalItems = annotations.length + blurRegions.length;

  return (
    <SectionWrapper title="Annotate" defaultOpen={true}>
      <div className="space-y-4">

        {/* ── Tool grid ── */}
        <div className="grid grid-cols-3 gap-1.5">
          {TOOLS.map((tool) => {
            const isActive = activeAnnotationTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label} — click, then draw on canvas`}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tool.svg}
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Active tool hint ── */}
        {activeAnnotationTool && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-[11px] text-primary/80">
              {activeAnnotationTool === 'blur'
                ? 'Draw a region on the canvas to blur'
                : `Click and drag on canvas to draw ${activeAnnotationTool}`}
            </span>
          </div>
        )}

        {/* ── Selected annotation controls ── */}
        {selectedAnnotation && !activeAnnotationTool && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/30">
            <span className="text-xs text-muted-foreground">
              Selected: <span className="text-foreground font-medium capitalize">{selectedAnnotation.type}</span>
            </span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Delete02Icon size={13} />
              Delete
            </button>
          </div>
        )}

        {/* ── Color + stroke (only for non-blur tools) ── */}
        {activeAnnotationTool !== 'blur' && (
          <div className="space-y-3">
            {/* Color label */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Color</span>
            </div>

            {/* Color palette */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLORS.map(({ value, name }) => (
                <button
                  key={value}
                  onClick={() => handleColorChange(value)}
                  title={name}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all duration-150 shrink-0',
                    currentColor === value
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                      : 'hover:scale-110 hover:ring-1 hover:ring-border hover:ring-offset-1 hover:ring-offset-background'
                  )}
                  style={{
                    backgroundColor: value,
                    boxShadow: value === '#ffffff' ? 'inset 0 0 0 1px hsl(var(--border))' : undefined,
                  }}
                />
              ))}
            </div>

            {/* Stroke width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Stroke</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{currentWidth}px</span>
              </div>

              {/* Stroke presets */}
              <div className="flex items-center gap-1.5">
                {STROKE_PRESETS.map((w) => (
                  <button
                    key={w}
                    onClick={() => handleWidthChange(w)}
                    className={cn(
                      'flex-1 flex items-center justify-center h-8 rounded-md transition-all duration-150',
                      currentWidth === w
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                    title={`${w}px`}
                  >
                    <div
                      className="rounded-full bg-foreground"
                      style={{
                        width: `${Math.max(4, w * 1.5)}px`,
                        height: `${Math.max(4, w * 1.5)}px`,
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Fine control slider */}
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={currentWidth}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ── Blur regions list ── */}
        {blurRegions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Blur Regions
              </span>
              {blurRegions.length > 1 && (
                <button
                  onClick={clearBlurRegions}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {blurRegions.map((region, index) => (
                <div
                  key={region.id}
                  className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-muted/30 border border-border/20 group hover:border-border/40 transition-colors"
                >
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-3 shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={region.blurAmount}
                    onChange={(e) =>
                      updateBlurRegion(region.id, { blurAmount: Number(e.target.value) })
                    }
                    className="flex-1 h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[11px] text-muted-foreground tabular-nums w-6 text-right shrink-0">
                    {region.blurAmount}px
                  </span>
                  <button
                    onClick={() => removeBlurRegion(region.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  >
                    <Delete02Icon size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer: count + clear ── */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-border/20">
            <span className="text-[11px] text-muted-foreground">
              {annotations.length > 0 && `${annotations.length} shape${annotations.length !== 1 ? 's' : ''}`}
              {annotations.length > 0 && blurRegions.length > 0 && ' · '}
              {blurRegions.length > 0 && `${blurRegions.length} blur`}
            </span>
            <button
              onClick={() => { clearAnnotations(); clearBlurRegions(); }}
              className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
