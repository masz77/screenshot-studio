# Slide Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual animation clip timeline with a simplified per-slide in/out animation model — two fixed 50/50 boxes per slide, no drag/resize, duration auto-computed from centralized config.

**Architecture:** Per-slide `inPresetId`/`outPresetId` on the `Slide` type replace the stored `animationClips[]` and `timeline.tracks[]`. At playback/export time, `buildPlaybackData()` computes clips and tracks on-the-fly from preset IDs + timing config. The existing interpolation engine (`getClipInterpolatedProperties`) remains unchanged. Timeline UI renders two fixed-width slot boxes per slide via the existing `@xzdarcy/react-timeline-editor` library's custom action renderer.

**Tech Stack:** React 19, Zustand, TypeScript, `@xzdarcy/react-timeline-editor`, existing animation interpolation engine

**Spec:** `docs/superpowers/specs/2026-04-16-slide-transitions-design.md`

**No test framework configured.** Verification is via `pnpm build` + manual browser testing at `localhost:3000`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/animation/config.ts` | **Create** | Centralized timing ratios + `getSlideAnimationTiming()` |
| `types/animation.ts` | **Modify** | Add `PresetDirection`, `direction` field to `AnimationPreset` |
| `lib/animation/presets.ts` | **Modify** | Add `direction: 'in'` to all presets |
| `lib/animation/exit-presets.ts` | **Create** | Auto-reverse generator + dedicated exit presets + `getAllPresets()` |
| `lib/store/index.ts` | **Modify** | Update `Slide` type, add `setSlideInPreset`/`setSlideOutPreset`, remove old clip/track state+actions |
| `lib/animation/build-playback-data.ts` | **Create** | Computes `AnimationClip[]` + `AnimationTrack[]` from slides at playback time |
| `lib/timeline/adapters.ts` | **Modify** | Replace `clipsToActions` with `slidesToSlotActions`, update `toTimelineRows` |
| `components/timeline/renderers/SlotRenderer.tsx` | **Create** | Renders the two 50/50 in/out boxes for a slide |
| `components/timeline/TimelineEditor.tsx` | **Modify** | Wire new slot renderer, remove clip-related logic |
| `components/timeline/TimelineControls.tsx` | **Modify** | Remove clip-specific controls, add banner for preset-first flow |
| `components/timeline/AnimationPresetGallery.tsx` | **Modify** | Direction filtering, banner, bidirectional selection flow |
| `components/timeline/hooks/useTimelinePlayback.tsx` | **Modify** | Use `buildPlaybackData()` instead of reading stored clips/tracks |
| `lib/render-slideFrame.ts` | **Modify** | `streamAnimationToEncoder` uses `buildPlaybackData()` |
| `components/timeline/renderers/AnimationClipRenderer.tsx` | **Delete** | Replaced by `SlotRenderer` |

---

### Task 1: Centralized Timing Config

**Files:**
- Create: `lib/animation/config.ts`

- [ ] **Step 1: Create config file**

```typescript
// lib/animation/config.ts

export const SLIDE_ANIMATION_CONFIG = {
  /** Fraction of slide duration used for entrance animation */
  inRatio: 0.10,
  /** Fraction of slide duration used for exit animation */
  outRatio: 0.10,
  /** Minimum animation duration in ms (prevents too-short on short slides) */
  minDurationMs: 200,
  /** Maximum animation duration in ms (prevents too-long on long slides) */
  maxDurationMs: 2000,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getSlideAnimationTiming(slideDurationMs: number): {
  inMs: number
  outMs: number
  holdMs: number
} {
  const { inRatio, outRatio, minDurationMs, maxDurationMs } = SLIDE_ANIMATION_CONFIG
  const inMs = clamp(slideDurationMs * inRatio, minDurationMs, maxDurationMs)
  const outMs = clamp(slideDurationMs * outRatio, minDurationMs, maxDurationMs)
  const holdMs = Math.max(0, slideDurationMs - inMs - outMs)
  return { inMs, outMs, holdMs }
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Clean build (new file has no consumers yet)

- [ ] **Step 3: Commit**

```bash
git add lib/animation/config.ts
git commit -m "feat: add centralized slide animation timing config"
```

---

### Task 2: Add PresetDirection to Types + Presets

**Files:**
- Modify: `types/animation.ts`
- Modify: `lib/animation/presets.ts`

- [ ] **Step 1: Add `PresetDirection` type and update `AnimationPreset`**

In `types/animation.ts`, add the direction type and update the preset interface:

```typescript
// Add after AnimationPresetCategory (line 101):
export type PresetDirection = 'in' | 'out'
```

Update `AnimationPreset` interface (line 82-90) to include direction:

```typescript
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: AnimationPresetCategory;
  duration: number;
  tracks: AnimationTrack[];
  thumbnail?: string;
  direction: PresetDirection;
}
```

- [ ] **Step 2: Add `direction: 'in'` to all presets in `lib/animation/presets.ts`**

Every preset in `ANIMATION_PRESETS` needs `direction: 'in'` added. There are ~40 presets. Each preset object looks like:

```typescript
{
  id: 'hero-landing',
  name: 'Hero Landing',
  description: '...',
  category: 'reveal',
  duration: 1200,
  tracks: [...],
  direction: 'in',  // ADD THIS LINE to every preset
},
```

Add `direction: 'in' as const,` to every preset object in the array. Use find-and-replace: replace `    tracks: [` with `    direction: 'in' as const,\n    tracks: [` across all presets. Alternatively, add it manually to each.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add types/animation.ts lib/animation/presets.ts
git commit -m "feat: add PresetDirection type and direction field to all presets"
```

---

### Task 3: Create Exit Presets

**Files:**
- Create: `lib/animation/exit-presets.ts`

- [ ] **Step 1: Create exit presets file**

```typescript
// lib/animation/exit-presets.ts

import { ANIMATION_PRESETS } from './presets'
import type { AnimationPreset, AnimationTrack } from '@/types/animation'

/**
 * Reverse a track's keyframe property values.
 * First keyframe gets last's values, last gets first's — timing structure stays the same.
 */
function reverseTrack(track: AnimationTrack): AnimationTrack {
  const keyframes = track.keyframes
  if (keyframes.length < 2) return { ...track, keyframes: [...keyframes] }

  // Swap property values between mirrored positions
  const reversed = keyframes.map((kf, i) => {
    const mirrorIndex = keyframes.length - 1 - i
    return {
      ...kf,
      properties: { ...keyframes[mirrorIndex].properties },
    }
  })

  return { ...track, keyframes: reversed }
}

/**
 * Generate an exit name from an entrance name.
 * "Fade In" -> "Fade Out", "Hero Landing" -> "Hero Landing Out"
 */
function getExitName(name: string): string {
  if (name.endsWith(' In')) {
    return name.replace(/ In$/, ' Out')
  }
  if (name.endsWith(' In 3D')) {
    return name.replace(/ In 3D$/, ' Out 3D')
  }
  return `${name} Out`
}

/**
 * Auto-reverse an entrance preset to create an exit version.
 */
function reversePreset(preset: AnimationPreset): AnimationPreset {
  return {
    ...preset,
    id: `${preset.id}-out`,
    name: getExitName(preset.name),
    description: `Exit: ${preset.description}`,
    direction: 'out',
    tracks: preset.tracks.map(reverseTrack),
  }
}

/** All entrance presets auto-reversed to exit versions */
export const REVERSED_EXIT_PRESETS: AnimationPreset[] =
  ANIMATION_PRESETS.map(reversePreset)

/** Dedicated exit presets that don't map to a reversed entrance */
export const DEDICATED_EXIT_PRESETS: AnimationPreset[] = [
  {
    id: 'fade-out-dedicated',
    name: 'Fade Out',
    description: 'Simple opacity fade to transparent',
    category: 'fade',
    duration: 800,
    direction: 'out',
    tracks: [
      {
        id: 'fade-out-track',
        name: 'Fade Out',
        type: 'opacity',
        keyframes: [
          { id: 'fo-kf1', time: 0, properties: { imageOpacity: 1 }, easing: 'ease-in' },
          { id: 'fo-kf2', time: 800, properties: { imageOpacity: 0 }, easing: 'ease-in' },
        ],
        isLocked: false,
        isVisible: true,
      },
    ],
  },
  {
    id: 'shrink-away',
    name: 'Shrink Away',
    description: 'Scales down slightly while fading out',
    category: 'fade',
    duration: 800,
    direction: 'out',
    tracks: [
      {
        id: 'shrink-transform',
        name: 'Shrink Away',
        type: 'transform',
        keyframes: [
          { id: 'sa-kf1', time: 0, properties: { scale: 1 }, easing: 'ease-in' },
          { id: 'sa-kf2', time: 800, properties: { scale: 0.95 }, easing: 'ease-in-cubic' },
        ],
        isLocked: false,
        isVisible: true,
      },
      {
        id: 'shrink-opacity',
        name: 'Shrink Away Fade',
        type: 'opacity',
        keyframes: [
          { id: 'sa-kf3', time: 0, properties: { imageOpacity: 1 }, easing: 'ease-in' },
          { id: 'sa-kf4', time: 800, properties: { imageOpacity: 0 }, easing: 'ease-in' },
        ],
        isLocked: false,
        isVisible: true,
      },
    ],
  },
  {
    id: 'push-away',
    name: 'Push Away',
    description: 'Pushes into the screen with perspective while fading',
    category: 'depth',
    duration: 1000,
    direction: 'out',
    tracks: [
      {
        id: 'push-transform',
        name: 'Push Away',
        type: 'transform',
        keyframes: [
          { id: 'pa-kf1', time: 0, properties: { scale: 1, rotateX: 0, perspective: 2400 }, easing: 'ease-in' },
          { id: 'pa-kf2', time: 1000, properties: { scale: 0.95, rotateX: -10, perspective: 2400 }, easing: 'ease-in-cubic' },
        ],
        isLocked: false,
        isVisible: true,
      },
      {
        id: 'push-opacity',
        name: 'Push Away Fade',
        type: 'opacity',
        keyframes: [
          { id: 'pa-kf3', time: 400, properties: { imageOpacity: 1 }, easing: 'ease-in' },
          { id: 'pa-kf4', time: 1000, properties: { imageOpacity: 0 }, easing: 'ease-in' },
        ],
        isLocked: false,
        isVisible: true,
      },
    ],
  },
]

/** All exit presets: auto-reversed + dedicated */
export const ALL_EXIT_PRESETS: AnimationPreset[] = [
  ...REVERSED_EXIT_PRESETS,
  ...DEDICATED_EXIT_PRESETS,
]

/** Combined lookup map of all presets (entrance + exit) by ID */
const ALL_PRESETS_MAP = new Map<string, AnimationPreset>()
ANIMATION_PRESETS.forEach((p) => ALL_PRESETS_MAP.set(p.id, p))
ALL_EXIT_PRESETS.forEach((p) => ALL_PRESETS_MAP.set(p.id, p))

/** Look up any preset (entrance or exit) by ID */
export function getAnyPresetById(id: string): AnimationPreset | undefined {
  return ALL_PRESETS_MAP.get(id)
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add lib/animation/exit-presets.ts
git commit -m "feat: add auto-reversed exit presets and dedicated exit animations"
```

---

### Task 4: Update Store — Slide Type + New Actions + Remove Old

**Files:**
- Modify: `lib/store/index.ts`

This is the largest task. It updates the Slide type, adds new actions, and removes old clip/track state and actions. Consumers that reference removed actions will also need updating in subsequent tasks — but we update all references in this task and the next few tasks to keep the build green.

- [ ] **Step 1: Update `Slide` interface**

At `lib/store/index.ts:45-50`, change:

```typescript
interface Slide {
  id: string;
  src: string;
  name: string | null;
  duration: number;
}
```

to:

```typescript
interface Slide {
  id: string;
  src: string;
  name: string | null;
  duration: number;
  inPresetId: string | null;
  outPresetId: string | null;
}
```

- [ ] **Step 2: Update `ImageState` — replace old animation fields with new actions**

In the `ImageState` type definition (around lines 625-651), replace:

```typescript
  // Timeline / Animation
  timeline: TimelineState;
  showTimeline: boolean;
  animationClips: AnimationClip[];
  setTimeline: (updates: Partial<TimelineState>) => void;
  setShowTimeline: (show: boolean) => void;
  toggleTimeline: () => void;
  setPlayhead: (time: number) => void;
  togglePlayback: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  addKeyframe: (trackId: string, keyframe: Omit<Keyframe, 'id'>) => void;
  updateKeyframe: (trackId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  removeKeyframe: (trackId: string, keyframeId: string) => void;
  addTrack: (track: Omit<AnimationTrack, 'id'>) => void;
  updateTrack: (trackId: string, updates: Partial<AnimationTrack>) => void;
  removeTrack: (trackId: string) => void;
  applyAnimationPreset: (presetId: string) => void;
  clearTimeline: () => void;
  setTimelineDuration: (duration: number) => void;
  // Animation clips
  addAnimationClip: (presetId: string, startTime: number) => void;
  applyAnimationToAllSlides: (presetId: string) => void;
  randomizeAnimationsAcrossSlides: () => void;
  updateAnimationClip: (clipId: string, updates: Partial<AnimationClip>) => void;
  removeAnimationClip: (clipId: string) => void;
  clearAnimationClips: () => void;
```

with:

```typescript
  // Timeline / Animation
  timeline: Omit<TimelineState, 'tracks' | 'snapToKeyframes'>;
  showTimeline: boolean;
  setTimeline: (updates: Partial<Omit<TimelineState, 'tracks' | 'snapToKeyframes'>>) => void;
  setShowTimeline: (show: boolean) => void;
  toggleTimeline: () => void;
  setPlayhead: (time: number) => void;
  togglePlayback: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setTimelineDuration: (duration: number) => void;
  clearTimeline: () => void;
  // Per-slide animation assignment
  setSlideInPreset: (slideId: string, presetId: string | null) => void;
  setSlideOutPreset: (slideId: string, presetId: string | null) => void;
```

- [ ] **Step 3: Update initial state**

Where `timeline` is initialized in the store's initial state (look for `timeline: DEFAULT_TIMELINE_STATE`), change to:

```typescript
timeline: {
  duration: 3000,
  playhead: 0,
  isPlaying: false,
  isLooping: true,
  zoom: 1,
},
```

Remove the `animationClips: [],` initial state line.

- [ ] **Step 4: Update `addImages` to include new fields**

In `addImages` (around line 1360), update the new slide creation:

```typescript
const newSlides = files.map((file) => ({
  id: `slide-${crypto.randomUUID()}`,
  src: URL.createObjectURL(file),
  name: file.name,
  duration: slideshow.defaultDuration,
  inPresetId: null,
  outPresetId: null,
}));
```

- [ ] **Step 5: Add new actions, remove old action implementations**

Add the two new actions:

```typescript
setSlideInPreset: (slideId, presetId) => {
  set((state) => ({
    slides: state.slides.map((s) =>
      s.id === slideId ? { ...s, inPresetId: presetId } : s
    ),
  }));
},

setSlideOutPreset: (slideId, presetId) => {
  set((state) => ({
    slides: state.slides.map((s) =>
      s.id === slideId ? { ...s, outPresetId: presetId } : s
    ),
  }));
},
```

Update `clearTimeline` to clear all slide presets:

```typescript
clearTimeline: () => {
  set((state) => ({
    timeline: {
      ...state.timeline,
      playhead: 0,
      isPlaying: false,
    },
    slides: state.slides.map((s) => ({
      ...s,
      inPresetId: null,
      outPresetId: null,
    })),
  }));
},
```

Update `setTimelineDuration` — remove the `animationClips` clamping logic:

```typescript
setTimelineDuration: (duration) => {
  set((state) => {
    const newDuration = Math.max(500, duration);
    return {
      timeline: {
        ...state.timeline,
        duration: newDuration,
        playhead: Math.min(state.timeline.playhead, newDuration),
      },
    };
  });
},
```

**Delete** all of these action implementations (the function bodies from the store):
- `addKeyframe` (keyframe CRUD)
- `updateKeyframe`
- `removeKeyframe`
- `addTrack`
- `updateTrack`
- `removeTrack`
- `applyAnimationPreset`
- `addAnimationClip`
- `applyAnimationToAllSlides`
- `randomizeAnimationsAcrossSlides`
- `updateAnimationClip`
- `removeAnimationClip`
- `clearAnimationClips`

Also remove the `animationClips` state field (the `animationClips: [],` line in initial state).

Remove any unused imports at the top of the file — `ANIMATION_PRESETS`, `clonePresetTracks`, `AnimationClip`, `AnimationTrack`, `Keyframe` if they are no longer used by remaining code. Keep `TimelineState` and `DEFAULT_TIMELINE_STATE` if still referenced (though `DEFAULT_TIMELINE_STATE` may need updating since we dropped `tracks` and `snapToKeyframes`).

- [ ] **Step 6: Verify build**

Run: `pnpm build`
Expected: Build errors from consumers still referencing removed state/actions. These will be fixed in subsequent tasks. Note the specific errors.

- [ ] **Step 7: Commit (WIP)**

```bash
git add lib/store/index.ts
git commit -m "refactor: replace animation clip model with per-slide in/out presets in store"
```

---

### Task 5: Create buildPlaybackData

**Files:**
- Create: `lib/animation/build-playback-data.ts`

- [ ] **Step 1: Create the utility**

```typescript
// lib/animation/build-playback-data.ts

import type { AnimationClip, AnimationTrack } from '@/types/animation'
import { getSlideAnimationTiming } from '@/animation/config'
import { getAnyPresetById } from '@/animation/exit-presets'
import { clonePresetTracks } from '@/animation/presets'

interface SlideInput {
  id: string
  duration: number
  inPresetId: string | null
  outPresetId: string | null
}

/**
 * Compute animation clips and tracks from slide preset IDs.
 * Called at playback start and before export — nothing is stored.
 */
export function buildPlaybackData(
  slides: SlideInput[],
  defaultDuration: number,
): { clips: AnimationClip[]; tracks: AnimationTrack[] } {
  const clips: AnimationClip[] = []
  const tracks: AnimationTrack[] = []
  let slideStartMs = 0

  for (const slide of slides) {
    const slideDurationMs = (slide.duration || defaultDuration) * 1000
    const timing = getSlideAnimationTiming(slideDurationMs)

    if (slide.inPresetId) {
      const preset = getAnyPresetById(slide.inPresetId)
      if (preset) {
        const clipId = `playback-in-${slide.id}`
        const clip: AnimationClip = {
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: slideStartMs,
          duration: timing.inMs,
          color: '#10B981',
        }
        clips.push(clip)
        tracks.push(
          ...clonePresetTracks(preset, { startTime: slideStartMs, clipId }),
        )
      }
    }

    if (slide.outPresetId) {
      const preset = getAnyPresetById(slide.outPresetId)
      if (preset) {
        const outStartMs = slideStartMs + slideDurationMs - timing.outMs
        const clipId = `playback-out-${slide.id}`
        const clip: AnimationClip = {
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: outStartMs,
          duration: timing.outMs,
          color: '#10B981',
        }
        clips.push(clip)
        tracks.push(
          ...clonePresetTracks(preset, { startTime: outStartMs, clipId }),
        )
      }
    }

    slideStartMs += slideDurationMs
  }

  return { clips, tracks }
}

/**
 * Check if any slide has an animation preset assigned.
 */
export function hasAnySlideAnimations(
  slides: SlideInput[],
): boolean {
  return slides.some((s) => s.inPresetId !== null || s.outPresetId !== null)
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Clean build (or existing errors from Task 4 consumer breakage — this file itself should compile)

- [ ] **Step 3: Commit**

```bash
git add lib/animation/build-playback-data.ts
git commit -m "feat: add buildPlaybackData utility for on-the-fly clip generation"
```

---

### Task 6: Update Playback Hook

**Files:**
- Modify: `components/timeline/hooks/useTimelinePlayback.tsx`

- [ ] **Step 1: Rewrite the hook to use `buildPlaybackData`**

Replace the entire file:

```typescript
// components/timeline/hooks/useTimelinePlayback.tsx
'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { getClipInterpolatedProperties } from '@/lib/animation/interpolation';
import { DEFAULT_ANIMATABLE_PROPERTIES } from '@/types/animation';
import { applyDirectDOM, restoreTransition } from '@/lib/animation/playback-refs';
import { buildPlaybackData, hasAnySlideAnimations } from '@/lib/animation/build-playback-data';

/**
 * Calculate which slide should be active at a given time.
 */
function getActiveSlideAtTime(
  slides: { id: string; duration: number }[],
  timeMs: number,
  defaultDuration: number
): string | null {
  if (slides.length === 0) return null;
  if (slides.length === 1) return slides[0].id;

  let cumulativeTime = 0;
  for (const slide of slides) {
    const slideDurationMs = (slide.duration || defaultDuration) * 1000;
    if (timeMs < cumulativeTime + slideDurationMs) {
      return slide.id;
    }
    cumulativeTime += slideDurationMs;
  }
  return slides[slides.length - 1].id;
}

export function useTimelinePlayback() {
  const {
    timeline,
    slides,
    activeSlideId,
    slideshow,
    setActiveSlide,
    setPlayhead,
    setTimeline,
    setPerspective3D,
    setImageOpacity,
  } = useImageStore();

  const { isPlaying, playhead, duration, isLooping } = timeline;
  const lastTimeRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const playheadRef = React.useRef(timeline.playhead);
  const lastInterpolatedRef = React.useRef(DEFAULT_ANIMATABLE_PROPERTIES);
  const hasPlayedRef = React.useRef(false);

  // Keep playhead ref in sync
  React.useEffect(() => {
    playheadRef.current = timeline.playhead;
  }, [timeline.playhead]);

  // Animation loop
  React.useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (hasPlayedRef.current) {
        hasPlayedRef.current = false;
        const state = useImageStore.getState();
        const last = lastInterpolatedRef.current;
        state.setPerspective3D({
          perspective: last.perspective,
          rotateX: last.rotateX,
          rotateY: last.rotateY,
          rotateZ: last.rotateZ,
          translateX: last.translateX,
          translateY: last.translateY,
          scale: last.scale,
        });
        state.setImageOpacity(last.imageOpacity);
        restoreTransition();
      }
      return;
    }

    hasPlayedRef.current = true;

    // Build playback data once at playback start
    const state = useImageStore.getState();
    const { clips, tracks } = buildPlaybackData(
      state.slides,
      state.slideshow.defaultDuration,
    );

    const animate = (currentTime: number) => {
      const state = useImageStore.getState();
      const currentPlayhead = playheadRef.current;
      const {
        duration: currentDuration,
        isLooping: currentIsLooping,
      } = state.timeline;
      const currentSlides = state.slides;
      const currentActiveSlideId = state.activeSlideId;
      const defaultSlideDuration = state.slideshow.defaultDuration;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      let newPlayhead = currentPlayhead + deltaMs;
      let shouldStop = false;

      if (newPlayhead >= currentDuration) {
        if (currentIsLooping) {
          newPlayhead = newPlayhead % currentDuration;
        } else {
          newPlayhead = currentDuration;
          shouldStop = true;
        }
      }

      playheadRef.current = newPlayhead;
      state.setPlayhead(newPlayhead);

      if (currentSlides.length > 1) {
        const targetSlideId = getActiveSlideAtTime(
          currentSlides,
          newPlayhead,
          defaultSlideDuration,
        );
        if (targetSlideId && targetSlideId !== currentActiveSlideId) {
          state.setActiveSlide(targetSlideId);
        }
      }

      const interpolated = getClipInterpolatedProperties(
        clips,
        tracks,
        newPlayhead,
        DEFAULT_ANIMATABLE_PROPERTIES,
      );

      lastInterpolatedRef.current = interpolated;

      const usedDirectDOM = applyDirectDOM(interpolated);
      if (!usedDirectDOM) {
        state.setPerspective3D({
          perspective: interpolated.perspective,
          rotateX: interpolated.rotateX,
          rotateY: interpolated.rotateY,
          rotateZ: interpolated.rotateZ,
          translateX: interpolated.translateX,
          translateY: interpolated.translateY,
          scale: interpolated.scale,
        });
        if (interpolated.imageOpacity !== undefined) {
          state.setImageOpacity(interpolated.imageOpacity);
        }
      }

      if (shouldStop) {
        state.setPerspective3D({
          perspective: interpolated.perspective,
          rotateX: interpolated.rotateX,
          rotateY: interpolated.rotateY,
          rotateZ: interpolated.rotateZ,
          translateX: interpolated.translateX,
          translateY: interpolated.translateY,
          scale: interpolated.scale,
        });
        state.setImageOpacity(interpolated.imageOpacity);
        restoreTransition();
        state.setTimeline({ isPlaying: false });
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Scrubbing effect (when not playing)
  const prevPlayheadRef = React.useRef(playhead);

  React.useEffect(() => {
    if (isPlaying) return;

    const playheadChanged = prevPlayheadRef.current !== playhead;
    prevPlayheadRef.current = playhead;

    if (playheadChanged && slides.length > 1) {
      const targetSlideId = getActiveSlideAtTime(slides, playhead, slideshow.defaultDuration);
      if (targetSlideId && targetSlideId !== useImageStore.getState().activeSlideId) {
        setActiveSlide(targetSlideId);
      }
    }

    // Build playback data for scrub position
    const { clips, tracks } = buildPlaybackData(slides, slideshow.defaultDuration);

    const interpolated = getClipInterpolatedProperties(
      clips,
      tracks,
      playhead,
      DEFAULT_ANIMATABLE_PROPERTIES,
    );

    setPerspective3D({
      perspective: interpolated.perspective,
      rotateX: interpolated.rotateX,
      rotateY: interpolated.rotateY,
      rotateZ: interpolated.rotateZ,
      translateX: interpolated.translateX,
      translateY: interpolated.translateY,
      scale: interpolated.scale,
    });

    if (interpolated.imageOpacity !== undefined) {
      setImageOpacity(interpolated.imageOpacity);
    }
  }, [playhead, isPlaying, slides, slideshow.defaultDuration, setActiveSlide, setPerspective3D, setImageOpacity]);

  // Reset to defaults when all slide animations are cleared
  React.useEffect(() => {
    if (!hasAnySlideAnimations(slides)) {
      setPerspective3D({
        perspective: DEFAULT_ANIMATABLE_PROPERTIES.perspective,
        rotateX: DEFAULT_ANIMATABLE_PROPERTIES.rotateX,
        rotateY: DEFAULT_ANIMATABLE_PROPERTIES.rotateY,
        rotateZ: DEFAULT_ANIMATABLE_PROPERTIES.rotateZ,
        translateX: DEFAULT_ANIMATABLE_PROPERTIES.translateX,
        translateY: DEFAULT_ANIMATABLE_PROPERTIES.translateY,
        scale: DEFAULT_ANIMATABLE_PROPERTIES.scale,
      });
      setImageOpacity(DEFAULT_ANIMATABLE_PROPERTIES.imageOpacity);
    }
  }, [slides, setPerspective3D, setImageOpacity]);
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: This file should compile cleanly. Other files may still have errors.

- [ ] **Step 3: Commit**

```bash
git add components/timeline/hooks/useTimelinePlayback.tsx
git commit -m "refactor: update playback hook to use buildPlaybackData instead of stored clips"
```

---

### Task 7: Update Export Pipeline

**Files:**
- Modify: `lib/render-slideFrame.ts`

- [ ] **Step 1: Update `streamAnimationToEncoder`**

In `lib/render-slideFrame.ts`, find `streamAnimationToEncoder` (around line 363). Update the imports at the top of the file to add:

```typescript
import { buildPlaybackData, hasAnySlideAnimations } from '@/lib/animation/build-playback-data';
```

Then update the function body. Replace the lines that read clips/tracks from the store:

```typescript
const store = useImageStore.getState();
const { timeline, animationClips, slides, slideshow, setActiveSlide, setPerspective3D, setImageOpacity } = store;
const { duration, tracks } = timeline;

if (tracks.length === 0 && slides.length <= 1) {
  throw new Error("No animation tracks to render");
}
```

with:

```typescript
const store = useImageStore.getState();
const { timeline, slides, slideshow, setActiveSlide, setPerspective3D, setImageOpacity } = store;
const { duration } = timeline;

// Build clips/tracks on-the-fly from slide preset IDs
const { clips: animationClips, tracks } = buildPlaybackData(slides, slideshow.defaultDuration);

if (tracks.length === 0 && slides.length <= 1) {
  throw new Error("No animation tracks to render");
}
```

The rest of the function body remains unchanged — it already uses `animationClips` and `tracks` local variables, and calls `getClipInterpolatedProperties(animationClips, tracks, time)`.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: This file should compile cleanly.

- [ ] **Step 3: Commit**

```bash
git add lib/render-slideFrame.ts
git commit -m "refactor: update animation export to use buildPlaybackData"
```

---

### Task 8: Update Timeline Adapters + Create Slot Renderer

**Files:**
- Modify: `lib/timeline/adapters.ts`
- Create: `components/timeline/renderers/SlotRenderer.tsx`

- [ ] **Step 1: Update adapters**

Rewrite `lib/timeline/adapters.ts`. The animation row now shows per-slide slot actions (not clip actions). Each slide gets one action spanning its full duration, rendered as two 50/50 boxes.

```typescript
// lib/timeline/adapters.ts

// ── Base types (structurally compatible with @xzdarcy/timeline-engine) ──

export interface TimelineActionBase {
  id: string
  start: number
  end: number
  effectId: string
  selected?: boolean
  flexible?: boolean
  movable?: boolean
  disable?: boolean
  minStart?: number
  maxEnd?: number
}

export interface TimelineRowBase {
  id: string
  actions: TimelineActionBase[]
  rowHeight?: number
  selected?: boolean
  classNames?: string[]
}

export interface TimelineEffectBase {
  id: string
  name?: string
}

// ── Extended action types ────────────────────────────────────────────

export interface SlotAction extends TimelineActionBase {
  slideId: string
  slideName: string
  inPresetId: string | null
  outPresetId: string | null
}

export interface MediaAction extends TimelineActionBase {
  slideName: string
  slideSrc: string
  slideIndex: number
}

// ── Slide type (matches store shape) ─────────────────────────────────

export interface Slide {
  id: string
  src: string
  name: string | null
  duration: number
  inPresetId: string | null
  outPresetId: string | null
}

// ── Row IDs ──────────────────────────────────────────────────────────

export const ANIMATION_ROW_ID = 'animation-row'
export const MEDIA_ROW_ID = 'media-row'

// ── Effect IDs ───────────────────────────────────────────────────────

export const SLOT_EFFECT_ID = 'slot-effect'
export const MEDIA_EFFECT_ID = 'media-effect'

// ── Effects map (required by the library) ────────────────────────────

export const timelineEffects: Record<string, TimelineEffectBase> = {
  [SLOT_EFFECT_ID]: { id: SLOT_EFFECT_ID, name: 'Animation Slot' },
  [MEDIA_EFFECT_ID]: { id: MEDIA_EFFECT_ID, name: 'Media' },
}

// ── Conversion helpers ──────────────────────────────────────────────

function msToSec(ms: number): number {
  return ms / 1000
}

// ── Slides → Slot Actions (one per slide, full width) ────────────────

function slidesToSlotActions(slides: Slide[]): SlotAction[] {
  let startSec = 0
  return slides.map((slide, index) => {
    const durationSec = slide.duration
    const action: SlotAction = {
      id: `slot-${slide.id}`,
      start: startSec,
      end: startSec + durationSec,
      effectId: SLOT_EFFECT_ID,
      slideId: slide.id,
      slideName: slide.name ?? `Slide ${index + 1}`,
      inPresetId: slide.inPresetId,
      outPresetId: slide.outPresetId,
      flexible: false,
      movable: false,
    }
    startSec += durationSec
    return action
  })
}

// ── Slides → Media Actions ──────────────────────────────────────────

function slidesToMediaActions(slides: Slide[]): MediaAction[] {
  let startSec = 0
  return slides.map((slide, index) => {
    const durationSec = slide.duration
    const action: MediaAction = {
      id: `media-${slide.id}`,
      start: startSec,
      end: startSec + durationSec,
      effectId: MEDIA_EFFECT_ID,
      slideName: slide.name ?? `Slide ${index + 1}`,
      slideSrc: slide.src,
      slideIndex: index,
      flexible: false,
      movable: false,
    }
    startSec += durationSec
    return action
  })
}

// ── Single image → Action (full duration, no slots) ─────────────────

function singleImageAction(
  imageUrl: string,
  imageName: string,
  durationMs: number,
): MediaAction[] {
  return [
    {
      id: 'main',
      start: 0,
      end: msToSec(durationMs),
      effectId: MEDIA_EFFECT_ID,
      slideName: imageName,
      slideSrc: imageUrl,
      slideIndex: 0,
      flexible: false,
      movable: false,
    },
  ]
}

// ── Build editorData ─────────────────────────────────────────────────

export function toTimelineRows(
  slides: Slide[],
  timelineDurationMs: number,
  uploadedImageUrl: string | null,
  imageName: string | null,
): TimelineRowBase[] {
  // Only show animation slots for multi-slide
  const slotActions = slides.length > 1 ? slidesToSlotActions(slides) : []

  const mediaActions =
    slides.length > 0
      ? slidesToMediaActions(slides)
      : uploadedImageUrl
        ? singleImageAction(uploadedImageUrl, imageName ?? 'Image', timelineDurationMs)
        : []

  const rows: TimelineRowBase[] = []

  if (slotActions.length > 0) {
    rows.push({
      id: ANIMATION_ROW_ID,
      actions: slotActions,
      rowHeight: 48,
    })
  }

  rows.push({
    id: MEDIA_ROW_ID,
    actions: mediaActions,
    rowHeight: 56,
  })

  return rows
}
```

- [ ] **Step 2: Create the slot renderer**

```typescript
// components/timeline/renderers/SlotRenderer.tsx
'use client';

import * as React from 'react';
import { VideoReplayIcon, Add01Icon, Cancel01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { getAnyPresetById } from '@/lib/animation/exit-presets';
import type { SlotAction } from '@/lib/timeline/adapters';

interface SlotRendererProps {
  action: SlotAction
  selectedSlot: { slideId: string; slot: 'in' | 'out' } | null
  onSlotClick: (slideId: string, slot: 'in' | 'out') => void
  onClearSlot: (slideId: string, slot: 'in' | 'out') => void
}

export function SlotRenderer({
  action,
  selectedSlot,
  onSlotClick,
  onClearSlot,
}: SlotRendererProps) {
  const inPreset = action.inPresetId ? getAnyPresetById(action.inPresetId) : null
  const outPreset = action.outPresetId ? getAnyPresetById(action.outPresetId) : null

  const isInSelected =
    selectedSlot?.slideId === action.slideId && selectedSlot?.slot === 'in'
  const isOutSelected =
    selectedSlot?.slideId === action.slideId && selectedSlot?.slot === 'out'

  return (
    <div className="flex w-full h-full gap-px">
      {/* In slot (50%) */}
      <button
        className={cn(
          'flex-1 flex items-center gap-1 px-2 rounded-l-lg overflow-hidden transition-all',
          inPreset
            ? 'bg-primary/15 border border-primary/30'
            : 'bg-muted/30 border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5',
          isInSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSlotClick(action.slideId, 'in')
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {inPreset ? (
          <>
            <VideoReplayIcon size={10} className="text-primary shrink-0" />
            <span className="text-[9px] text-primary font-medium truncate">
              {inPreset.name}
            </span>
            <button
              className="ml-auto shrink-0 w-3.5 h-3.5 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onClearSlot(action.slideId, 'in')
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Cancel01Icon size={7} className="text-destructive-foreground" />
            </button>
          </>
        ) : (
          <>
            <Add01Icon size={10} className="text-muted-foreground shrink-0" />
            <span className="text-[9px] text-muted-foreground truncate">In</span>
          </>
        )}
      </button>

      {/* Out slot (50%) */}
      <button
        className={cn(
          'flex-1 flex items-center gap-1 px-2 rounded-r-lg overflow-hidden transition-all',
          outPreset
            ? 'bg-primary/15 border border-primary/30'
            : 'bg-muted/30 border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5',
          isOutSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSlotClick(action.slideId, 'out')
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {outPreset ? (
          <>
            <VideoReplayIcon size={10} className="text-primary shrink-0" />
            <span className="text-[9px] text-primary font-medium truncate">
              {outPreset.name}
            </span>
            <button
              className="ml-auto shrink-0 w-3.5 h-3.5 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onClearSlot(action.slideId, 'out')
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Cancel01Icon size={7} className="text-destructive-foreground" />
            </button>
          </>
        ) : (
          <>
            <Add01Icon size={10} className="text-muted-foreground shrink-0" />
            <span className="text-[9px] text-muted-foreground truncate">Out</span>
          </>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: These files compile. `TimelineEditor` still has errors (next task).

- [ ] **Step 4: Commit**

```bash
git add lib/timeline/adapters.ts components/timeline/renderers/SlotRenderer.tsx
git commit -m "feat: add slot-based timeline adapters and SlotRenderer component"
```

---

### Task 9: Update TimelineEditor + TimelineControls

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx`
- Modify: `components/timeline/TimelineControls.tsx`

- [ ] **Step 1: Add selection state to `useEditorStore`**

In `lib/store/index.ts`, find the `useEditorStore` definition. Add these fields:

State fields:
```typescript
selectedSlot: { slideId: string; slot: 'in' | 'out' } | null;
pendingPresetId: string | null;
```

Actions:
```typescript
setSelectedSlot: (slot: { slideId: string; slot: 'in' | 'out' } | null) => void;
setPendingPresetId: (presetId: string | null) => void;
```

Implementations:
```typescript
selectedSlot: null,
pendingPresetId: null,
setSelectedSlot: (slot) => set({ selectedSlot: slot, pendingPresetId: null }),
setPendingPresetId: (presetId) => set({ pendingPresetId: presetId, selectedSlot: null }),
```

- [ ] **Step 2: Rewrite `TimelineEditor.tsx`**

```typescript
// components/timeline/TimelineEditor.tsx
'use client'

import * as React from 'react'
import { Timeline } from '@xzdarcy/react-timeline-editor'
import type { TimelineState } from '@xzdarcy/react-timeline-editor'
import '@xzdarcy/react-timeline-editor/dist/react-timeline-editor.css'

import { useImageStore, useEditorStore } from '@/lib/store'
import { TimelineControls } from '@/components/timeline/TimelineControls'
import { useTimelinePlayback } from '@/components/timeline/hooks/useTimelinePlayback'
import { SlotRenderer } from '@/components/timeline/renderers/SlotRenderer'
import { MediaClipRenderer } from '@/components/timeline/renderers/MediaClipRenderer'
import {
  toTimelineRows,
  timelineEffects,
  ANIMATION_ROW_ID,
  MEDIA_ROW_ID,
} from '@/lib/timeline/adapters'
import type {
  SlotAction,
  MediaAction,
  TimelineRowBase,
  TimelineActionBase,
} from '@/lib/timeline/adapters'

const TIMELINE_HEIGHT = 248
const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

const SCALE_WIDTH = 160
const SCALE_SPLIT_COUNT = 10
const START_LEFT = 120

export function TimelineEditor() {
  const {
    timeline,
    uploadedImageUrl,
    imageName,
    slides,
    activeSlideId,
    showTimeline,
    setActiveRightPanelTab,
    toggleTimeline,
    setTimeline,
    setPlayhead,
    stopPlayback,
    removeSlide,
    setActiveSlide,
    setSlideInPreset,
    setSlideOutPreset,
  } = useImageStore()

  const {
    selectedSlot,
    pendingPresetId,
    setSelectedSlot,
    setPendingPresetId,
  } = useEditorStore()

  const timelineRef = React.useRef<TimelineState>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  useTimelinePlayback()

  // Build editor data from store state
  const editorData = React.useMemo(
    () =>
      toTimelineRows(
        slides,
        timeline.duration,
        uploadedImageUrl,
        imageName,
      ),
    [slides, timeline.duration, uploadedImageUrl, imageName],
  )

  // Sync store playhead → library cursor
  React.useEffect(() => {
    if (!timelineRef.current) return
    const timeSec = timeline.playhead / 1000
    timelineRef.current.setTime(timeSec)
  }, [timeline.playhead])

  // Handle cursor drag: update store playhead
  const handleCursorDrag = React.useCallback(
    (time: number) => {
      stopPlayback()
      setPlayhead(time * 1000)
    },
    [stopPlayback, setPlayhead],
  )

  // Handle click on time ruler
  const handleClickTimeArea = React.useCallback(
    (time: number) => {
      stopPlayback()
      setPlayhead(time * 1000)
      return undefined
    },
    [stopPlayback, setPlayhead],
  )

  // Handle click on action: select slide if media track
  const handleClickAction = React.useCallback(
    (
      _e: React.MouseEvent,
      params: { action: TimelineActionBase; row: TimelineRowBase },
    ) => {
      if (params.row.id === MEDIA_ROW_ID && params.action.id !== 'main') {
        const slideId = params.action.id.replace('media-', '')
        setActiveSlide(slideId)
      }
    },
    [setActiveSlide],
  )

  // Slot click handler (supports bidirectional flow)
  const handleSlotClick = React.useCallback(
    (slideId: string, slot: 'in' | 'out') => {
      // If a preset is pending (preset-first flow), assign it
      if (pendingPresetId) {
        if (slot === 'in') {
          setSlideInPreset(slideId, pendingPresetId)
        } else {
          setSlideOutPreset(slideId, pendingPresetId)
        }
        setPendingPresetId(null)
        return
      }

      // Otherwise, select the slot (slot-first flow)
      const isSameSlot =
        selectedSlot?.slideId === slideId && selectedSlot?.slot === slot
      setSelectedSlot(isSameSlot ? null : { slideId, slot })

      // Open animate tab in right panel
      setActiveRightPanelTab('animate')
    },
    [
      pendingPresetId,
      selectedSlot,
      setSlideInPreset,
      setSlideOutPreset,
      setPendingPresetId,
      setSelectedSlot,
      setActiveRightPanelTab,
    ],
  )

  // Clear slot handler
  const handleClearSlot = React.useCallback(
    (slideId: string, slot: 'in' | 'out') => {
      if (slot === 'in') {
        setSlideInPreset(slideId, null)
      } else {
        setSlideOutPreset(slideId, null)
      }
    },
    [setSlideInPreset, setSlideOutPreset],
  )

  // Custom action renderer
  const getActionRender = React.useCallback(
    (action: TimelineActionBase, row: TimelineRowBase) => {
      if (row.id === ANIMATION_ROW_ID) {
        return (
          <SlotRenderer
            action={action as SlotAction}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
            onClearSlot={handleClearSlot}
          />
        )
      }
      if (row.id === MEDIA_ROW_ID) {
        const mediaAction = action as MediaAction
        const slideId = mediaAction.id.replace('media-', '')
        return (
          <MediaClipRenderer
            action={mediaAction}
            isActive={activeSlideId === slideId}
            slidesCount={slides.length}
            onRemove={(id) => removeSlide(id.replace('media-', ''))}
            onSelect={(id) => setActiveSlide(id.replace('media-', ''))}
          />
        )
      }
      return null
    },
    [selectedSlot, handleSlotClick, handleClearSlot, activeSlideId, slides.length, removeSlide, setActiveSlide],
  )

  // Ctrl/Cmd + mousewheel zoom handler
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const currentZoom = useImageStore.getState().timeline.zoom
      const newZoom =
        Math.round(
          Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta)) * 100,
        ) / 100
      if (newZoom !== currentZoom) {
        setTimeline({ zoom: newZoom })
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [setTimeline])

  // Clear selection on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSlot(null)
        setPendingPresetId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedSlot, setPendingPresetId])

  if (!showTimeline || (!uploadedImageUrl && slides.length === 0)) {
    return null
  }

  const handleClose = () => {
    toggleTimeline()
  }

  const durationSec = timeline.duration / 1000
  const scaleWidth = SCALE_WIDTH * timeline.zoom

  return (
    <div
      className="timeline-editor-wrapper bg-card border-t border-border/40 flex flex-col"
      style={{ height: TIMELINE_HEIGHT }}
    >
      {/* Banner for preset-first flow */}
      {pendingPresetId && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border-b border-primary/20 shrink-0">
          <span className="text-xs font-medium text-primary">
            Click a slot to apply the selected animation
          </span>
          <button
            onClick={() => setPendingPresetId(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Controls bar */}
      <TimelineControls onClose={handleClose} />

      {/* Timeline area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-hidden">
        <Timeline
          ref={timelineRef}
          editorData={editorData as TimelineRowBase[]}
          effects={timelineEffects}
          scale={durationSec > 10 ? 2 : 1}
          scaleWidth={scaleWidth}
          scaleSplitCount={SCALE_SPLIT_COUNT}
          startLeft={START_LEFT}
          minScaleCount={Math.ceil(durationSec)}
          maxScaleCount={Math.ceil(durationSec) + 2}
          rowHeight={48}
          onCursorDrag={handleCursorDrag}
          onCursorDragEnd={handleCursorDrag}
          onClickTimeArea={handleClickTimeArea}
          onClickAction={handleClickAction}
          getActionRender={getActionRender}
          autoScroll
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `TimelineControls.tsx`**

Remove clip-specific controls (Add Animation button, clear animations button, `animationClips` dependency). Simplified version:

```typescript
// components/timeline/TimelineControls.tsx
'use client';

import * as React from 'react';
import {
  PlayIcon,
  PauseIcon,
  RepeatIcon,
  RepeatOffIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import { useImageStore } from '@/lib/store';
import { cn } from '@/lib/utils';

function formatTimeDisplay(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface TimelineControlsProps {
  onClose?: () => void;
}

export function TimelineControls({ onClose }: TimelineControlsProps) {
  const {
    timeline,
    togglePlayback,
    setTimeline,
    setTimelineDuration,
  } = useImageStore();

  const { isPlaying, isLooping, playhead, duration } = timeline;

  const handleToggleLoop = () => setTimeline({ isLooping: !isLooping });
  const durationSeconds = duration / 1000;

  return (
    <div className="flex items-center px-3 py-2 bg-card border-b border-border/30 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {/* Loop toggle */}
        <button
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-full transition-colors',
            isLooping
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          onClick={handleToggleLoop}
          title={isLooping ? 'Loop enabled' : 'Loop disabled'}
        >
          {isLooping ? <RepeatIcon size={16} /> : <RepeatOffIcon size={16} />}
        </button>
      </div>

      {/* Center section */}
      <div className="flex-1 flex items-center justify-center">
        <button
          className="h-10 min-w-[100px] flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          onClick={togglePlayback}
        >
          {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Timestamp */}
        <div className="flex items-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatTimeDisplay(playhead)}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums ml-0.5">
            {' '}/ {formatTimeDisplay(duration)}
          </span>
        </div>

        {/* Duration slider */}
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={durationSeconds}
            onChange={(e) => setTimelineDuration(Number(e.target.value) * 1000)}
            className="w-[100px] h-1 appearance-none bg-border/40 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          {/* Zoom reset */}
          <button
            onClick={() => setTimeline({ zoom: 1 })}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors',
              timeline.zoom !== 1
                ? 'text-primary hover:bg-primary/10 cursor-pointer'
                : 'text-muted-foreground cursor-default'
            )}
            title={timeline.zoom !== 1 ? 'Reset zoom to 100%' : `Zoom: ${Math.round(timeline.zoom * 100)}%`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path fill="currentColor" d="M2 10.026c0 4.429 3.601 8.022 8.03 8.022a7.9 7.9 0 0 0 4.738-1.565l5.17 5.184c.213.208.491.313.782.313.634 0 1.072-.48 1.072-1.094 0-.292-.115-.557-.3-.764L16.34 14.96a7.93 7.93 0 0 0 1.708-4.934C18.048 5.601 14.455 2 10.03 2 5.601 2 2 5.601 2 10.026m1.532 0a6.497 6.497 0 0 1 6.498-6.494 6.5 6.5 0 0 1 6.494 6.494c0 3.581-2.917 6.498-6.494 6.498a6.503 6.503 0 0 1-6.498-6.498m3.177 0c0 .368.297.661.67.661h1.982v1.978c0 .377.292.674.669.67a.66.66 0 0 0 .661-.67v-1.978h1.974a.662.662 0 1 0 0-1.326h-1.974V7.379a.664.664 0 1 0-1.33 0v1.982H7.379a.66.66 0 0 0-.67.665" />
            </svg>
            <span className="text-[10px] font-medium tabular-nums">{Math.round(timeline.zoom * 100)}%</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border/40" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Close timeline"
        >
          <Cancel01Icon size={16} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Getting closer to green. `AnimationPresetGallery` still has errors.

- [ ] **Step 5: Commit**

```bash
git add lib/store/index.ts components/timeline/TimelineEditor.tsx components/timeline/TimelineControls.tsx
git commit -m "refactor: wire slot-based timeline UI, remove clip drag/resize"
```

---

### Task 10: Bidirectional Preset Panel

**Files:**
- Modify: `components/timeline/AnimationPresetGallery.tsx`
- Modify: `components/editor/RightSettingsPanel.tsx` (if it has its own `AnimationControls` — update to use `AnimationPresetGallery`)

- [ ] **Step 1: Rewrite `AnimationPresetGallery.tsx`**

```typescript
// components/timeline/AnimationPresetGallery.tsx
'use client';

import * as React from 'react';
import { useImageStore, useEditorStore } from '@/lib/store';
import { ANIMATION_PRESETS, CATEGORY_LABELS } from '@/lib/animation/presets';
import { ALL_EXIT_PRESETS } from '@/lib/animation/exit-presets';
import { cn } from '@/lib/utils';
import type { AnimationPreset } from '@/types/animation';
import { Button } from '@/components/ui/button';
import { Delete02Icon, Cancel01Icon } from 'hugeicons-react';

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
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all group',
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
                </button>
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
```

- [ ] **Step 2: Update `RightSettingsPanel.tsx` AnimationControls**

Find the inline `AnimationControls` component in `RightSettingsPanel.tsx` (around lines 412-642). Replace it with a simple wrapper that renders `AnimationPresetGallery`:

```typescript
// Replace the entire AnimationControls function body with:
function AnimationControls() {
  return <AnimationPresetGallery />;
}
```

Add the import at the top:
```typescript
import { AnimationPresetGallery } from '@/components/timeline/AnimationPresetGallery';
```

Remove any now-unused imports from `RightSettingsPanel.tsx` (like `ANIMATION_PRESETS`, `addAnimationClip`, etc.).

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build should be clean or very close to green now.

- [ ] **Step 4: Commit**

```bash
git add components/timeline/AnimationPresetGallery.tsx components/editor/RightSettingsPanel.tsx
git commit -m "feat: implement bidirectional preset panel with direction filtering and banners"
```

---

### Task 11: Delete Old Components + Final Cleanup

**Files:**
- Delete: `components/timeline/renderers/AnimationClipRenderer.tsx`
- Verify: No remaining references to deleted actions/state

- [ ] **Step 1: Delete `AnimationClipRenderer.tsx`**

```bash
rm components/timeline/renderers/AnimationClipRenderer.tsx
```

- [ ] **Step 2: Search for stale references**

Search the codebase for any remaining references to deleted store actions/state:

```
addAnimationClip
removeAnimationClip
updateAnimationClip
clearAnimationClips
applyAnimationPreset
applyAnimationToAllSlides
randomizeAnimationsAcrossSlides
addKeyframe
updateKeyframe
removeKeyframe
addTrack
updateTrack
removeTrack
animationClips
```

Fix any remaining references. Common locations:
- Other components that import from the store
- Analytics/tracking functions that reference clip actions (like `trackAnimationClipAdd`)

- [ ] **Step 3: Clean up unused type imports**

In `types/animation.ts`, all types remain useful (`AnimationClip`, `AnimationTrack`, etc.) because `buildPlaybackData` still creates them at runtime.

In `lib/timeline/adapters.ts`, remove the old `AnimationAction` type if still present and the `AnimationClip` import.

- [ ] **Step 4: Remove unused `ANIMATION_EFFECT_ID` constant**

In `lib/timeline/adapters.ts`, remove `ANIMATION_EFFECT_ID` if it was replaced by `SLOT_EFFECT_ID` (done in Task 8).

- [ ] **Step 5: Final build verification**

Run: `pnpm build`
Expected: Clean build, zero errors.

- [ ] **Step 6: Manual browser test**

Run: `pnpm dev`

Test at `localhost:3000`:
1. Upload 3+ images to create slides
2. Open the timeline — verify two 50/50 boxes per slide (empty, dashed border)
3. Click an "In" box — verify it highlights, right panel shows entrance presets
4. Click a preset — verify it's assigned (box turns green with preset name)
5. Click an "Out" box — verify right panel switches to exit presets
6. Click a preset in the panel first (no slot selected) — verify banner appears in timeline
7. Click an out slot — verify preset is assigned
8. Press Play — verify animations play at correct times (10% in, 10% out)
9. Scrub the playhead — verify animation interpolation updates correctly
10. Press Escape — verify selections clear
11. Click "x" on an assigned box — verify it clears
12. Export as MP4 — verify animations render in exported video

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove old animation clip system, final cleanup"
```

---

## Implementation Notes

### Import Path Fix
The `build-playback-data.ts` file uses `@/animation/config` and `@/animation/exit-presets` — verify these match the project's path alias. They should be `@/lib/animation/config` and `@/lib/animation/exit-presets` based on the project's `@/*` → project root alias.

### Timeline Duration
When slides are added, `addImages` already computes `totalSlideDuration` from slide durations. The timeline duration should match. Verify this still works since `setTimelineDuration` was simplified.

### Undo/Redo
Zundo tracks Zustand state changes. Since `inPresetId`/`outPresetId` are on the `Slide` objects in the store, assigning and clearing presets is automatically undoable.

### Edge Case: Single Image (No Slides)
The animation slot row only appears when `slides.length > 1`. A single uploaded image shows no animation slots. This is by design — the old clip system is removed entirely.
