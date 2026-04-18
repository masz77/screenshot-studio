# Slide Transitions & Per-Slide In/Out Animations

## Overview

Replace the current manual animation clip system (drag/drop/resize clips on a timeline track) with a simplified per-slide model where each slide has two fixed animation slots: **slide-in** and **slide-out**. Duration is auto-computed proportionally from slide length. No manual timing adjustment.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data model | Preset IDs on Slide object | Clean break from stored clips/tracks. Just two optional string fields per slide. |
| Interpolation engine | Reuse existing | `getClipInterpolatedProperties()` works regardless of where clips/tracks originate. No rewrite needed. |
| Clip/track generation | Computed at playback time | `buildPlaybackData()` derives clips/tracks from preset IDs + timing config. Nothing stored. |
| Transition between slides | Sequential | Slide N exit completes, then slide N+1 entrance starts. No overlap/blending of two slides. |
| Duration config | Centralized ratios | `SLIDE_ANIMATION_CONFIG` in one file. Change ratios once, all slides update. |
| Exit presets | Auto-reverse + dedicated | ~40 reversed entrance presets generated automatically, plus 3-5 curated exit-only presets. |
| Timeline UI | Two fixed 50/50 boxes per slide | No drag, no resize. Boxes are cosmetically half-width each, aligned above slide thumbnail. |
| Preset assignment | Bidirectional flow | Click slot then preset, or preset then slot. Banners guide the user. |
| New slide defaults | Empty slots | No animation until user explicitly assigns one. |

## Data Model

### Slide Type Changes

```typescript
interface Slide {
  id: string
  src: string
  name: string | null
  duration: number           // seconds
  inPresetId: string | null  // entrance animation preset ID
  outPresetId: string | null // exit animation preset ID
}
```

### Store Changes

**New actions:**
- `setSlideInPreset(slideId: string, presetId: string | null): void`
- `setSlideOutPreset(slideId: string, presetId: string | null): void`

**Remove from state:**
- `animationClips: AnimationClip[]`
- `timeline.tracks: AnimationTrack[]`
- `timeline.snapToKeyframes`

**Remove actions:**
- `addAnimationClip`, `removeAnimationClip`, `updateAnimationClip`, `clearAnimationClips`
- `applyAnimationPreset`, `applyAnimationToAllSlides`
- `addTrack`, `removeTrack`, `updateTrack`
- `addKeyframe`, `updateKeyframe`, `removeKeyframe`

**Keep:**
- `timeline.duration`, `timeline.playhead`, `timeline.isPlaying`, `timeline.isLooping`, `timeline.zoom`
- `showTimeline`
- All playback control actions (`togglePlayback`, `startPlayback`, `stopPlayback`, `setPlayhead`)

**Migrate:**
- `clearTimeline` now clears all `inPresetId`/`outPresetId` on all slides

## Centralized Timing Config

**New file:** `lib/animation/config.ts`

```typescript
export const SLIDE_ANIMATION_CONFIG = {
  /** Fraction of slide duration used for entrance animation */
  inRatio: 0.10,
  /** Fraction of slide duration used for exit animation */
  outRatio: 0.10,
  /** Minimum animation duration in ms */
  minDurationMs: 200,
  /** Maximum animation duration in ms */
  maxDurationMs: 2000,
}
```

**Helper function:**

```typescript
function getSlideAnimationTiming(slideDurationMs: number): {
  inMs: number
  outMs: number
  holdMs: number
}
```

Clamps each duration to `[minDurationMs, maxDurationMs]`. Hold = total - in - out.

Example: 3s slide at 10% ratio = 300ms in, 300ms out, 2400ms hold.

## Exit Presets

### Auto-Reverse Generation

**New file:** `lib/animation/exit-presets.ts`

A `reversePreset()` function takes any entrance preset and produces an exit version:
- Keyframe property values are reversed (first keyframe gets the last keyframe's values and vice versa)
- Keyframe times are mirrored within the duration
- Naming convention: `"{Original Name} Out"` with ID `"{original-id}-out"`

Generates ~40 reversed presets from the existing library.

### Dedicated Exit Presets

A small curated set (~3-5) that don't map to a reversed entrance:
- Fade Out (opacity 1 to 0)
- Shrink Away (scale 1 to 0.95, opacity 1 to 0)
- Push Away (translateZ into screen, opacity fade)

### Preset Direction Tag

```typescript
type PresetDirection = 'in' | 'out' | 'both'
```

- Original presets: `direction: 'in'`
- Auto-reversed presets: `direction: 'out'`
- Dedicated exit presets: `direction: 'out'`

The sidebar preset panel filters by direction based on which slot is selected.

## Timeline UI

### Layout

```
[     In (50%)     |     Out (50%)     ]
[            Slide Thumbnail           ]
```

Both boxes always take exactly 50% of the slide's visual width. The actual animation duration comes from `SLIDE_ANIMATION_CONFIG`, not the box width.

### Box States

**Unassigned:** Dashed border, "+" icon, muted text. Clickable.

**Assigned:** Solid green fill (matching current clip styling), preset name truncated to fit, preset icon.

**Selected:** Highlighted border/glow indicating this slot is ready to receive a preset.

### Components

- **Delete:** `ResizableAnimationClip`, `AnimationTrack` components, all drag/resize logic
- **New:** `SlideAnimationTrack` — renders the two-box layout per slide
- **New:** `AnimationSlotBox` — individual in/out box with assigned/unassigned/selected states

## Preset Panel Integration (Bidirectional Flow)

### Selection State

Stored in `useEditorStore` (shared across timeline and sidebar components):

```typescript
type AnimationSlotSelection = {
  slideId: string
  slot: 'in' | 'out'
} | null

type PendingPresetId = string | null
```

### Flow A: Slot-First

1. User clicks an in/out box on the timeline
2. Box highlights with selected state
3. Sidebar preset panel filters to matching direction
4. Banner at top of preset panel: **"Pick an animation for Slide 2 -- Entrance"**
5. User clicks a preset, it's assigned, selection clears

### Flow B: Preset-First

1. User clicks a preset in the sidebar
2. Preset highlights with selected state
3. Banner at top of timeline: **"Click a slot to apply Fade In"**
4. Compatible slots pulse/highlight (in slots for entrance presets, out slots for exit presets)
5. User clicks a slot, preset assigned, selection clears

### Escape Hatch

Clicking anywhere else or pressing Escape clears both selections.

### Clearing an Animation

When a slot is selected and already has a preset: show an "x" button on the box, or a "Clear" option at the top of the preset list.

## Playback

### Build Playback Data

At playback start (or on scrub), compute clips/tracks from slide data:

```typescript
function buildPlaybackData(
  slides: Slide[],
  defaultDuration: number
): { clips: AnimationClip[]; tracks: AnimationTrack[] }
```

For each slide:
1. Compute timing via `getSlideAnimationTiming()`
2. If `inPresetId` is set: clone preset tracks, scale to `inMs`, offset to slide start time
3. If `outPresetId` is set: clone preset tracks, scale to `outMs`, offset to `slideEnd - outMs`
4. Collect all clips and tracks

Output feeds directly into existing `getClipInterpolatedProperties()`.

### Playback Loop

`useTimelinePlayback` changes:
1. On playback start: call `buildPlaybackData()`, cache result
2. RAF loop uses cached clips/tracks instead of reading from store
3. Invalidate cache when slides change (add/remove/reorder/change preset)
4. Slide switching via `getActiveSlideAtTime()` unchanged
5. Direct DOM path (`applyDirectDOM`) unchanged

### Scrubbing

On playhead drag, use the same cached `buildPlaybackData()` result to compute interpolated properties at the scrub position.

## Export

Before rendering, call `buildPlaybackData()` to generate clips/tracks, then use existing export pipeline:

```
Export starts
  -> buildPlaybackData(slides) -> { clips, tracks }
  -> streamAnimationToEncoder uses clips/tracks
  -> Each frame: getClipInterpolatedProperties(clips, tracks, frameTime)
  -> Apply to DOM, capture, encode
```

**Fallback:** If no slides have any presets assigned, use `streamSlidesToEncoder()` (static slide path, no animation frames needed).

No changes to encoder selection (WebCodecs/FFmpeg/MediaRecorder) or frame capture.

## Store Cleanup

### Delete

- `animationClips[]` state
- `timeline.tracks[]` state
- `timeline.snapToKeyframes` state
- All clip/track CRUD actions (listed in Store Changes above)
- `ResizableAnimationClip` component
- `AnimationTrack` component
- Drag/resize logic in timeline

### Keep

- `AnimationPreset`, `AnimationTrack`, `AnimationClip`, `Keyframe` **type definitions** (used at runtime by `buildPlaybackData`)
- Interpolation engine (`getClipInterpolatedProperties`, easing functions, `lerp`, etc.)
- `playback-refs.ts` direct DOM system
- `useTimelinePlayback` hook (modified)
- `clonePresetTracks` utility
- Undo/redo (Zundo) works naturally since preset IDs are Zustand state

## Key Files

| File | Change |
|------|--------|
| `types/animation.ts` | Add `PresetDirection`, keep existing types |
| `lib/store/index.ts` | Modify `Slide` type, remove clips/tracks state, add new actions |
| `lib/animation/config.ts` | **New** -- centralized timing config |
| `lib/animation/exit-presets.ts` | **New** -- auto-reverse generator + dedicated exit presets |
| `lib/animation/presets.ts` | Add `direction` field to existing presets |
| `lib/animation/interpolation.ts` | No changes |
| `lib/animation/playback-refs.ts` | No changes |
| `components/timeline/TimelineEditor.tsx` | Replace AnimationTrack with SlideAnimationTrack |
| `components/timeline/SlideAnimationTrack.tsx` | **New** -- two-box layout per slide |
| `components/timeline/AnimationSlotBox.tsx` | **New** -- individual slot box component |
| `components/timeline/ResizableAnimationClip.tsx` | **Delete** |
| `components/timeline/AnimationTrack.tsx` | **Delete** |
| `components/timeline/hooks/useTimelinePlayback.tsx` | Modify to use `buildPlaybackData()` |
| `lib/export/export-slideshow-video.ts` | Call `buildPlaybackData()` before render |
| `components/timeline/AnimationPresetGallery.tsx` | Add direction filtering, banner UI, selection state |
