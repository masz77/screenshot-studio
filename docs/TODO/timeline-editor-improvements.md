# Timeline Editor Improvements

## Overview

The timeline editor is functional but basic compared to modern animation editors. This doc captures all improvement opportunities with library references, prioritized by impact-to-effort ratio.

## Current State

- **Clip-based timeline** with 37 presets across 8 categories
- **8 easing functions** (linear, ease-in/out, cubic, expo variants)
- **requestAnimationFrame playback** with delta time
- **CSS 3D transforms** for rendering (no Three.js)
- **Zustand store** drives all state (`useImageStore`)
- **~11K lines of legacy dead code** in `components/timeline/` (4 unused files)

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `lib/animation/interpolation.ts` | 350 | Easing, lerp, keyframe interpolation |
| `lib/animation/presets.ts` | 620 | 37 animation presets, categories |
| `components/timeline/TimelineEditor.tsx` | 526 | Main timeline UI |
| `components/timeline/TimelineControls.tsx` | 147 | Play/pause, loop, duration |
| `components/timeline/AnimationPresetGallery.tsx` | 200+ | Preset browser |
| `components/timeline/hooks/useTimelinePlayback.tsx` | 209 | Animation loop |
| `types/animation.ts` | 118 | Type definitions |
| `lib/store/index.ts` | 1894 | Zustand store (timeline slice) |

### Legacy Dead Files (to remove)

| File | Lines | Status |
|------|-------|--------|
| `components/timeline/TimelinePlayhead.tsx` | 2,390 | Likely unused |
| `components/timeline/TimelineRuler.tsx` | 1,916 | Likely unused |
| `components/timeline/TimelineTrack.tsx` | 4,673 | Likely unused |
| `components/timeline/KeyframeMarker.tsx` | 2,696 | Likely unused |

---

## Improvements (Priority Order)

### 1. Remove Legacy Dead Files

**Type:** Code Quality | **Impact:** High | **Effort:** Small

**Problem:** 4 files totaling ~11,675 lines appear unused after the clip-based rewrite.

**What to do:**
- Grep for imports of these components across the codebase
- If unused, delete them
- Extract any useful logic before removal (keyframe snapping, multi-select patterns)

**Files:** `TimelinePlayhead.tsx`, `TimelineRuler.tsx`, `TimelineTrack.tsx`, `KeyframeMarker.tsx`

---

### 2. Timeline Zoom and Pan

**Type:** UI/UX | **Impact:** High | **Effort:** Small

**Problem:** `PIXELS_PER_SECOND` is hardcoded to 105. Short animations are cramped; long ones overflow. The `zoom` property exists in `TimelineState` but is never wired to UI.

**What to do:**
- Wire `timeline.zoom` to Ctrl+mousewheel on timeline container
- Replace fixed `PIXELS_PER_SECOND = 105` with `105 * timeline.zoom`
- Add horizontal scroll with Shift+mousewheel for pan
- Wire the decorative zoom icon in `TimelineControls.tsx` to a functional zoom slider
- Note: `animation-timeline-js` (item 4) includes zoom/pan built-in

---

### 3. Easing Function Registry

**Type:** Code Quality | **Impact:** Medium | **Effort:** Small

**Problem:** Easing functions use a string-matched `switch` in `interpolation.ts`. Adding new easings requires editing the switch + updating the type union.

**What to do:**
- Convert to registry: `const easingFunctions: Record<EasingFunction, (t: number) => number>`
- Enables future custom cubic-bezier curves
- Single file change: `lib/animation/interpolation.ts`

---

### 4. Visual Keyframe Editor (`animation-timeline-js`)

**Type:** UI/UX | **Impact:** High | **Effort:** Medium

**Library:** [`animation-timeline-js`](https://github.com/ievgennaida/animation-timeline-control) (MIT, 452 stars, zero deps, canvas-based)

**Problem:** Users can add/move/resize clips but cannot see or edit individual keyframes within clips.

**What to do:**
- Wrap `animation-timeline-js` in a React component via `useRef` + `useEffect`
- Bridge drag/select/keyframe events to Zustand store actions
- Map `AnimationTrack` keyframes to the library's keyframe model
- Gains: drag keyframes, multi-select, snap-to-grid, zoom, per-row styling

---

### 5. Easing Curve Visualizer

**Type:** UI/UX | **Impact:** High | **Effort:** Medium

**Reference:** [Theatre.js](https://www.theatrejs.com) (Apache-2.0, 12.3K stars)

**Problem:** Users select from 8 easing functions by name only. No visual preview of the curve shape.

**What to do:**
- Add cubic bezier curve editor popover on easing label click
- Render curve as SVG `<path>` in a popover
- Extend `EasingFunction` type to support custom cubic bezier: `{ type: 'cubic-bezier', values: [x1, y1, x2, y2] }`
- Update `applyEasing()` in `interpolation.ts`
- Show curve thumbnail inline next to keyframes

---

### 6. Decouple Playback from React Render Cycle

**Type:** Performance | **Impact:** High | **Effort:** Medium

**Reference:** [Rive](https://rive.app) (WASM runtime updates canvas directly)

**Problem:** `useTimelinePlayback` writes to Zustand store every animation frame (60 writes/sec), each triggering React re-renders.

**What to do:**
- Use ref-based animation state that updates CSS transforms directly during playback
- Only sync back to Zustand when playback stops or user scrubs
- In `Perspective3DOverlay.tsx`, read from ref during playback instead of store
- Eliminates 60 store writes/sec during animation

---

### 7. Per-Property Animation Tracks

**Type:** UI/UX | **Impact:** High | **Effort:** Large

**Reference:** [Lottie Open Studio](https://github.com/marciogranzotto/lottie-tools) (MIT, React + Zustand)

**Problem:** All animation properties bundled into single "Animations" track. Users can't see which properties are animated or edit them independently.

**What to do:**
- Split single `AnimationTrack` into expandable sub-tracks per property
- Add collapse/expand toggle on track label
- Extend `AnimationTrackType` beyond `'transform' | 'opacity'`
- Each sub-track shows only keyframes for that property

---

### 8. Clip Arrangement Upgrade (`@xzdarcy/react-timeline-editor`)

**Type:** UI/UX | **Impact:** Medium | **Effort:** Medium-Large

**Library:** [`@xzdarcy/react-timeline-editor`](https://github.com/xzdarcy/react-timeline-editor) (MIT, 723 stars, native React)

**Problem:** Current clip system lacks multi-track layering, cross-track drag, and virtual scrolling.

**What to do:**
- Map `AnimationClip[]` and `Slide[]` to the library's row/action model
- Replace `ResizableAnimationClip`, `AnimationTrack`, `VideoTrack` components
- Keep custom interpolation engine, just feed from new UI

---

### 9. Slide Transitions

**Type:** UI/UX | **Impact:** High | **Effort:** Large

**Reference:** [Motionity](https://github.com/alyssaxuu/motionity) (MIT, 4K stars)

**Problem:** No concept of transitions between slides (crossfade, wipe, zoom). Users must manually arrange clips.

**What to do:**
- Add `TransitionClip` type between slides
- New preset category "Transitions" in `lib/animation/presets.ts`
- Transition drop zones between slides in `VideoTrack`
- Blend two slide render states during transition window

---

## Recommended Integration Path

```
Wave 1 (Quick Wins):
  #1 Remove legacy dead files ──┐
  #2 Timeline zoom/pan ─────────┤── Parallel, no deps
  #3 Easing function registry ──┘

Wave 2 (Core Upgrade):
  #4 Visual keyframe editor (animation-timeline-js)
     └── Depends on Wave 1 cleanup

Wave 3 (Polish):
  #5 Easing curve visualizer ──┐
  #6 Decouple playback ────────┤── Parallel
  #7 Per-property tracks ──────┘

Wave 4 (Future):
  #8 Clip arrangement upgrade
  #9 Slide transitions
```

## Library Reference

| Library | URL | License | Stars | Use |
|---------|-----|---------|-------|-----|
| animation-timeline-js | github.com/ievgennaida/animation-timeline-control | MIT | 452 | Timeline UI component |
| @xzdarcy/react-timeline-editor | github.com/xzdarcy/react-timeline-editor | MIT | 723 | Clip arrangement |
| Theatre.js | theatrejs.com | Apache-2.0 | 12.3K | UX reference |
| Lottie Open Studio | github.com/marciogranzotto/lottie-tools | MIT | 32 | Code reference (same stack) |
| Motionity | github.com/alyssaxuu/motionity | MIT | 4K | UI inspiration |
| Remotion | remotion.dev | Custom | 43.5K | Timeline UX reference |
| Motion Canvas | motioncanvas.io | MIT | 18.4K | Editor UX inspiration |
