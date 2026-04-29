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
  const presetId = slot === 'in' ? slide?.inPresetId ?? null : slide?.outPresetId ?? null;
  const customTracks = slot === 'in' ? slide?.inCustomTracks ?? null : slide?.outCustomTracks ?? null;

  // Mirror current values into refs so the mount effect can read them once at open
  // without subscribing to their changes (avoids tearing down mid-drag).
  const customTracksRef = React.useRef<AnimationTrack[] | null>(null);
  const presetIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    customTracksRef.current = customTracks;
    presetIdRef.current = presetId;
  }, [customTracks, presetId]);

  // Snapshot of tracks captured at mount-time. Used by handleChange when writing
  // edits back to the store via modelToTracks.
  const tracksRef = React.useRef<AnimationTrack[] | null>(null);

  // Mount the animation-timeline-js instance when the sheet opens.
  // Deps intentionally exclude `customTracks`/`presetId`: the handler writes to the
  // store, which would otherwise re-run this effect mid-drag and dispose the lib.
  React.useEffect(() => {
    if (!open || !containerRef.current || !slideId || !slot) return;

    // Compute the initial snapshot once at mount: prefer custom tracks, else clone preset.
    const snapshotCustom = customTracksRef.current;
    const snapshotPresetId = presetIdRef.current;
    let snapshot: AnimationTrack[] | null = null;
    if (snapshotCustom && snapshotCustom.length > 0) {
      snapshot = snapshotCustom;
    } else if (snapshotPresetId) {
      const preset = getAnyPresetById(snapshotPresetId);
      if (preset) {
        snapshot = clonePresetTracks(preset, { clipId: `kf-${slideId}-${slot}` });
      }
    }
    if (!snapshot) return;

    tracksRef.current = snapshot;

    const tl = new KFTimeline({ id: containerRef.current });
    tl.setModel(tracksToModel(snapshot));
    timelineRef.current = tl;

    const handleChange = () => {
      const baseTracks = tracksRef.current;
      if (!baseTracks) return;
      const model = tl.getModel();
      const next = modelToTracks(model, baseTracks);
      setSlideCustomTracks(slideId, slot, next);
    };

    tl.on('timeChanged', handleChange);
    tl.on('keyframeChanged', handleChange);

    return () => {
      tl.off('timeChanged', handleChange);
      tl.off('keyframeChanged', handleChange);
      tl.dispose?.();
      timelineRef.current = null;
      tracksRef.current = null;
    };
  }, [open, slideId, slot, setSlideCustomTracks]);

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
