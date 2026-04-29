'use client';

import * as React from 'react';
import { Timeline as KFTimeline, TimelineModel } from 'animation-timeline-js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useImageStore } from '@/lib/store';
import { getAnyPresetById } from '@/lib/animation/exit-presets';
import { clonePresetTracks } from '@/lib/animation/presets';
import type { AnimationTrack, Keyframe } from '@/types/animation';

interface KeyframeEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slideId: string | null;
  slot: 'in' | 'out' | null;
}

interface KFRow {
  title: string;
  keyframes: Array<{ val: number; meta?: unknown }>;
}

function tracksToModel(tracks: AnimationTrack[]): TimelineModel {
  const rows: KFRow[] = tracks.map((t) => ({
    title: t.name,
    keyframes: t.keyframes.map((kf) => ({ val: kf.time, meta: kf })),
  }));
  return { rows } as unknown as TimelineModel;
}

function modelToTracks(
  model: TimelineModel,
  base: AnimationTrack[],
): AnimationTrack[] {
  // animation-timeline-js stores keyframes by row in `rows[i].keyframes[j].val` (time in ms).
  // We map back by index, preserving the original keyframe properties/easing.
  // If a keyframe was added or removed in the editor, length differs — handle that.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = (model as any).rows ?? [];
  return base.map((track, ti) => {
    const row = rows[ti];
    if (!row) return track;
    const kfs: Keyframe[] = row.keyframes.map((rk: { val: number; meta?: Keyframe }, ki: number) => {
      const original = track.keyframes[ki] ?? rk.meta ?? track.keyframes[0];
      return { ...original, time: rk.val };
    });
    return { ...track, keyframes: kfs };
  });
}

export function KeyframeEditorSheet({
  open,
  onOpenChange,
  slideId,
  slot,
}: KeyframeEditorSheetProps) {
  const slides = useImageStore((s) => s.slides);
  const setSlideCustomTracks = useImageStore((s) => s.setSlideCustomTracks);
  const clearSlideCustomTracks = useImageStore((s) => s.clearSlideCustomTracks);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<KFTimeline | null>(null);

  const slide = slideId ? slides.find((s) => s.id === slideId) : null;
  const presetId = slide && slot === 'in' ? slide.inPresetId : slide?.outPresetId ?? null;
  const customTracks = slide && slot === 'in' ? slide.inCustomTracks : slide?.outCustomTracks ?? null;

  // Compute the working tracks: prefer custom, otherwise fall back to preset clone.
  const workingTracks: AnimationTrack[] | null = React.useMemo(() => {
    if (!slide || !slot) return null;
    if (customTracks && customTracks.length > 0) return customTracks;
    if (!presetId) return null;
    const preset = getAnyPresetById(presetId);
    if (!preset) return null;
    return clonePresetTracks(preset, { clipId: `kf-${slide.id}-${slot}` });
  }, [slide, slot, customTracks, presetId]);

  // Mount the animation-timeline-js instance when the sheet opens.
  React.useEffect(() => {
    if (!open || !containerRef.current || !workingTracks) return;

    const tl = new KFTimeline({ id: containerRef.current });
    tl.setModel(tracksToModel(workingTracks));
    timelineRef.current = tl;

    const handleChange = () => {
      if (!slideId || !slot) return;
      const model = tl.getModel();
      const next = modelToTracks(model, workingTracks);
      setSlideCustomTracks(slideId, slot, next);
    };

    tl.on('timeChanged', handleChange);
    tl.on('keyframeChanged', handleChange);

    return () => {
      tl.off('timeChanged', handleChange);
      tl.off('keyframeChanged', handleChange);
      tl.dispose?.();
      timelineRef.current = null;
    };
  }, [open, workingTracks, slideId, slot, setSlideCustomTracks]);

  const handleResetToPreset = () => {
    if (slideId && slot) clearSlideCustomTracks(slideId, slot);
  };

  const presetName = presetId
    ? (getAnyPresetById(presetId)?.name ?? 'Unknown')
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[640px] sm:max-w-none flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {slot === 'in' ? 'Entrance' : 'Exit'} keyframes
            {slide ? ` — ${slide.name ?? slide.id}` : ''}
          </SheetTitle>
          <SheetDescription>
            {presetName
              ? `Based on preset: ${presetName}. Drag keyframes to retime; changes save automatically.`
              : 'No preset selected.'}
          </SheetDescription>
        </SheetHeader>

        <div ref={containerRef} className="flex-1 mt-4 rounded-md border border-border/40 overflow-hidden" />

        <div className="flex justify-between mt-4 pt-3 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToPreset}
            disabled={!customTracks || customTracks.length === 0}
          >
            Reset to preset
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
