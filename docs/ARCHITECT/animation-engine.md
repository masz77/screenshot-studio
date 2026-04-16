# Animation Engine

> See also: ARCHITECTURE.md -- "Key Features Implementation > 8. Animation & Timeline System", "Tech Stack > Animation & Video"

## Overview

Stage uses a custom keyframe interpolation engine (no third-party animation library) to animate canvas properties over time. The engine supports 8 easing functions, 8 animatable properties, and 30+ animation presets organized into 8 categories. A clip-based timeline model lets users stack and sequence animations, with later clips overriding earlier ones on a per-property basis. Playback runs via `requestAnimationFrame` in the `useTimelinePlayback` hook, which drives the Zustand store and triggers canvas re-renders.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Animation library | **Custom engine (no Framer Motion, GSAP, etc.)** | Animations target Zustand store properties (perspective3D, imageOpacity), not DOM elements; a custom interpolation engine gives full control over the playback loop and video export frame stepping |
| Easing implementation | **8 hand-coded easing functions** | Covers the practical range (linear, quadratic in/out, cubic in/out, expo in/out) without a dependency; follows Emil Kowalski's best practices (ease-out for entrances, ease-in-out for on-screen motion) |
| Interpolation approach | **Linear interpolation (lerp) with eased progress** | Simple, predictable, and sufficient for the property types (all numeric); easing curves are applied to the progress value before lerp |
| Animatable property set | **8 properties: perspective, rotateX/Y/Z, translateX/Y, scale, imageOpacity** | These are the CSS 3D transform properties and opacity that the canvas rendering already supports; adding a new animatable property only requires extending the `AnimatableProperties` interface |
| Data model | **Clip -> Track -> Keyframe hierarchy** | Clips represent a preset applied to a time range; tracks group keyframes by property type (transform vs opacity); this mirrors NLE timeline conventions |
| Multi-clip overlap | **Last-in wins (later start time overrides)** | When clips overlap, the clip with the later start time controls each property it animates; simple, predictable, avoids blending complexity |
| Time scaling for clips | **`originalDuration / clipDuration` scale factor** | When a clip is stretched or compressed on the timeline, keyframe times are scaled proportionally; the original preset duration is stored on each track for correct ratio calculation |
| Playback loop | **`requestAnimationFrame` in a React effect** | Provides smooth 60fps updates; reads fresh state from Zustand on every frame to avoid stale closures; single `isPlaying` dependency prevents effect recreation |
| Scrubbing support | **Separate effect for paused playhead changes** | When not playing, a second effect watches `playhead` changes and applies interpolated properties, enabling manual scrubbing and keyframe editing |
| Preset system | **Static array of `AnimationPreset` objects with `clonePresetTracks()`** | Presets define track/keyframe templates; `clonePresetTracks()` generates fresh IDs and optionally offsets times for clip placement, so the same preset can be applied multiple times |
| Default values on no active clip | **Return `DEFAULT_ANIMATABLE_PROPERTIES`** | When the playhead is outside all clip time ranges, properties reset to defaults (perspective: 2400, all rotations: 0, scale: 1, opacity: 1); prevents stale animated values from persisting |
| Slide switching during playback | **`getActiveSlideAtTime()` calculates target slide from cumulative durations** | For multi-slide timelines, the playback loop determines which slide should be visible at each playhead position and switches via `setActiveSlide()` |

## Key Files

| File | Purpose |
|------|---------|
| `types/animation.ts` | Type definitions: `Keyframe`, `AnimationTrack`, `AnimationClip`, `TimelineState`, `AnimatableProperties`, `EasingFunction`, `AnimationPreset` |
| `lib/animation/interpolation.ts` | Core interpolation engine: easing functions, `lerp`, `findSurroundingKeyframes`, `getInterpolatedProperty`, `getClipInterpolatedProperties`, keyframe snapping utilities |
| `lib/animation/presets.ts` | 30+ animation presets across 8 categories, `clonePresetTracks()`, preset lookup helpers |
| `components/timeline/hooks/useTimelinePlayback.tsx` | Playback loop (rAF), scrubbing effect, slide switching, store property application |
| `components/timeline/TimelineEditor.tsx` | Main timeline UI: time ruler, clip rendering, playhead, drag interactions |
| `components/timeline/TimelineControls.tsx` | Play/pause, skip to start/end, loop toggle, duration display |
| `components/timeline/TimelineTrack.tsx` | Individual track lane with keyframe markers |
| `components/timeline/TimelinePlayhead.tsx` | Draggable vertical playhead indicator |
| `components/timeline/KeyframeMarker.tsx` | Diamond-shaped keyframe indicator on tracks |
| `components/timeline/AnimationPresetGallery.tsx` | Browsable preset gallery organized by category |

## Data Flow

### Data Model

```
AnimationClip (timeline segment)
  |-- id, presetId, name
  |-- startTime (ms), duration (ms)
  |-- color (visual indicator)
  |
  +-- AnimationTrack[] (linked via track.clipId == clip.id)
       |-- type: 'transform' | 'opacity'
       |-- originalDuration (for time scaling)
       |
       +-- Keyframe[]
            |-- time (ms, absolute from timeline start)
            |-- properties: Partial<AnimatableProperties>
            |-- easing: EasingFunction
```

### Applying a Preset

```
User selects preset from AnimationPresetGallery
  |
  v
Create AnimationClip { presetId, startTime, duration }
  |
  v
clonePresetTracks(preset, { startTime, clipId })
  |-- Generate fresh IDs for tracks and keyframes
  |-- Offset keyframe times by clip.startTime
  |-- Set track.clipId to link tracks to clip
  |-- Store track.originalDuration for scaling
  |
  v
Add clip to store.animationClips
Add tracks to store.timeline.tracks
```

### Playback Loop (requestAnimationFrame)

```
isPlaying transitions to true
  |
  v
requestAnimationFrame(animate)
  |
  v
animate(currentTime):
  1. Read fresh state from useImageStore.getState()
  2. Calculate deltaMs from last frame
  3. Advance playhead (newPlayhead = current + deltaMs)
  4. Handle end-of-timeline (loop via modulo, or stop)
  5. Update store playhead via setPlayhead()
  6. If multi-slide: getActiveSlideAtTime() -> setActiveSlide()
  7. getClipInterpolatedProperties(clips, tracks, playhead, defaults)
     |
     a. Find active clips at current time
     b. Sort by startTime (earlier first)
     c. For overlapping properties, last clip wins
     d. For each winning clip/property:
        - Calculate localTime = playhead - clip.startTime
        - Scale by originalDuration / clipDuration
        - findSurroundingKeyframes(track.keyframes, scaledTime)
        - applyEasing(progress, nextKeyframe.easing)
        - lerp(prevValue, nextValue, easedProgress)
     e. Return merged AnimatableProperties
  8. Apply to store: setPerspective3D(), setImageOpacity()
  9. requestAnimationFrame(animate) -- continue loop
```

### Scrubbing (Paused)

```
User drags playhead or clicks timeline ruler
  |
  v
setPlayhead(newTime) updates store
  |
  v
useEffect (depends on playhead, !isPlaying):
  1. getActiveSlideAtTime() -> switch slide if needed
  2. getClipInterpolatedProperties() at new playhead
  3. Apply to store -> canvas re-renders
```

## Easing Functions

| Name | Formula | Typical Use |
|------|---------|-------------|
| `linear` | `t` | Constant-speed rotation (turntable) |
| `ease-in` | `t^2` | Exit animations |
| `ease-out` | `1 - (1-t)^2` | Default for entrance animations |
| `ease-in-out` | Quadratic bezier | On-screen movement, orbits |
| `ease-in-cubic` | `t^3` | Sharper acceleration |
| `ease-out-cubic` | `1 - (1-t)^3` | Snappy landings (hero, reveal) |
| `ease-in-expo` | `2^(10t-10)` | Dramatic acceleration from rest |
| `ease-out-expo` | `1 - 2^(-10t)` | Dramatic deceleration |

## Animation Presets

| Category | Count | Presets | Duration Range |
|----------|-------|---------|----------------|
| Reveal | 4 | Hero Landing, Slide In 3D, Rise & Settle, Drop In | 1000-1200ms |
| Slide | 4 | Slide Up, Slide Down, Slide Left, Slide Right | 800ms |
| Fade | 4 | Fade In, Fade Scale, Fade Rise, Fade Zoom Out | 800-1000ms |
| Flip | 4 | Flip X, Flip Y, Peek, Flip Reveal | 1200-2000ms |
| Perspective | 5 | Showcase Tilt, Isometric, Hover Float, Parallax Drift, Apple Showcase | 1500-3000ms |
| Orbit | 4 | Orbit Left, Orbit Right, Turntable, Swing | 2000-3000ms |
| Depth | 4 | Push Away, Pull Close, Dramatic Zoom, Breathe 3D | 1200-3000ms |
| Ken Burns | 4 | Zoom In, Zoom Out, Pan Left, Pan Right | 4000ms |

Design principles (per Emil Kowalski's guidelines):
- `ease-out` / `ease-out-cubic` for entrance animations
- `ease-in-out` for on-screen persistent motion
- Never animate from `scale(0)`; minimum is `scale(0.85)`
- Entrance durations kept snappy: 800-1200ms
- Loop-friendly presets (Hover Float, Breathe 3D) use symmetric keyframes

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Framer Motion / GSAP | These animate DOM elements; Stage needs to animate Zustand store values that feed into canvas rendering and frame-by-frame video export |
| CSS Animations / Web Animations API | Same DOM limitation; also cannot step through frames deterministically for video export |
| Bezier curve easing editor | 8 built-in curves cover practical needs; a custom bezier editor is listed as a future enhancement in ARCHITECTURE.md |
| Property blending for overlapping clips | Adds complexity (additive vs multiplicative blending); last-in-wins is simple, predictable, and matches NLE conventions |
| Web Workers for interpolation | Interpolation is lightweight math (~0.1ms per frame); overhead of postMessage serialization would exceed the computation time |
| Separate playback state store | Keeping timeline state in `useImageStore` allows undo/redo (via Zundo) to capture animation changes alongside design changes |
