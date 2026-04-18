'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import type { AnnotationToolType } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { Delete02Icon } from 'hugeicons-react';
import { Slider } from '@/components/ui/slider';

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: { id: AnnotationToolType; label: string; svg: React.ReactNode }[] = [
  {
    id: 'arrow',
    label: 'Arrow',
    svg: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 15L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 5L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'curved-arrow',
    label: 'Curve',
    svg: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 14C5 14 6 6 11 6C14 6 15 8 15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M12.5 6.5L15.5 8L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'Line',
    svg: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 15L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    label: 'Rect',
    svg: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3.5" y="5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    svg: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'blur',
    label: 'Blur',
    svg: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3.5" y="5" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2" />
        <path d="M7.5 9h5M7 11h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
];

const COLORS = [
  { value: '#ef4444', name: 'Red' },
  { value: '#f97316', name: 'Orange' },
  { value: '#eab308', name: 'Yellow' },
  { value: '#22c55e', name: 'Green' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#f43f5e', name: 'Rose' },
  { value: '#171717', name: 'Black' },
  { value: '#6b7280', name: 'Gray' },
  { value: '#ffffff', name: 'White' },
];

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

  const totalItems = annotations.length + blurRegions.length;

  return (
    <SectionWrapper title="Draw & Markup" sectionId="annotate" defaultOpen={true}>
      <div className="space-y-3">

        {/* ── Tool grid ── */}
        <div className="grid grid-cols-3 gap-1.5 p-1">
          {TOOLS.map((tool) => {
            const isActive = activeAnnotationTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label} — click, then draw on canvas`}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {tool.svg}
                <span className="leading-none">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Active tool hint ── */}
        {activeAnnotationTool && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary/8 border border-primary/15">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs text-primary/90">
              {activeAnnotationTool === 'blur'
                ? 'Draw a region on the canvas to blur'
                : `Click and drag on canvas to draw ${activeAnnotationTool}`}
            </span>
          </div>
        )}

        {/* ── Editing hint (when annotation selected, no tool active) ── */}
        {selectedAnnotation && !activeAnnotationTool && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/6 border border-primary/12">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60 shrink-0" />
            <span className="text-xs text-primary/80">
              Editing <span className="font-medium capitalize">{selectedAnnotation.type}</span> — click canvas to deselect
            </span>
          </div>
        )}

        {/* ── Color + stroke (only for non-blur tools) ── */}
        {activeAnnotationTool !== 'blur' && (
          <div className="space-y-3">
            {/* Color palette */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Color</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLORS.map(({ value, name }) => (
                  <button
                    key={value}
                    onClick={() => handleColorChange(value)}
                    title={name}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all duration-150 shrink-0',
                      currentColor === value
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{
                      backgroundColor: value,
                      boxShadow: value === '#ffffff'
                        ? 'inset 0 0 0 1.5px hsl(var(--border))'
                        : '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  />
                ))}
                <div className="w-px h-5 bg-border/40 mx-0.5" />
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  title="Pick any color"
                  className="w-7 h-7 rounded-full cursor-pointer border border-border/50 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                />
              </div>
            </div>

            {/* Stroke width */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Stroke</span>
              <Slider
                value={[currentWidth]}
                onValueChange={(v) => handleWidthChange(v[0])}
                min={1}
                max={24}
                step={1}
                valueDisplay={`${currentWidth}px`}
              />
            </div>
          </div>
        )}

        {/* ── Blur regions list ── */}
        {blurRegions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Blur Regions</span>
            {blurRegions.map((region, index) => (
              <div
                key={region.id}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-muted/30 border border-border/30"
              >
                <span className="text-[11px] text-muted-foreground shrink-0 w-8">#{index + 1}</span>
                <Slider
                  value={[region.blurAmount]}
                  onValueChange={(v) =>
                    updateBlurRegion(region.id, { blurAmount: v[0] })
                  }
                  min={2}
                  max={30}
                  step={1}
                  valueDisplay={`${region.blurAmount}px`}
                />
                <button
                  onClick={() => removeBlurRegion(region.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0 rounded hover:bg-destructive/10"
                  title="Remove"
                >
                  <Delete02Icon size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer: count + clear ── */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground tabular-nums">
              {annotations.length > 0 && `${annotations.length} shape${annotations.length !== 1 ? 's' : ''}`}
              {annotations.length > 0 && blurRegions.length > 0 && ', '}
              {blurRegions.length > 0 && `${blurRegions.length} blur region${blurRegions.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => { clearAnnotations(); clearBlurRegions(); }}
              className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
