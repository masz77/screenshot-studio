# Decouple Playback from React Render Cycle

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~60 Zustand store writes/sec during animation playback by writing CSS transforms directly to DOM elements, syncing back to the store only when playback stops.

**Architecture:** During playback, `useTimelinePlayback`'s rAF loop bypasses the store for `perspective3D` (7 properties) and `imageOpacity` (1 property), instead writing directly to DOM refs registered by `Perspective3DOverlay`. The `playhead` store write is kept (cheap, needed for timeline UI). When playback stops (natural end or user pause), final values sync back to the store so React state is consistent. Components like `Perspective3DControls` sliders freeze during playback and snap to final values on stop -- this is acceptable since users don't adjust sliders during animation.

**Tech Stack:** React refs, module-level singleton, direct DOM style manipulation

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/animation/playback-refs.ts` | Module-level ref registry + DOM write helpers |
| Modify | `components/canvas/overlays/Perspective3DOverlay.tsx` | Register 3 DOM refs on mount, cleanup on unmount |
| Modify | `components/timeline/hooks/useTimelinePlayback.tsx` | Direct DOM writes in rAF loop, sync-back on stop |

---

### Task 1: Create playback-refs module

**Files:**
- Create: `lib/animation/playback-refs.ts`

- [ ] **Step 1: Create the playback-refs module**

```typescript
// lib/animation/playback-refs.ts
import type { AnimatableProperties } from '@/types/animation';

/**
 * Module-level ref registry for direct DOM updates during playback.
 * Components register their DOM elements on mount.
 * useTimelinePlayback writes to them during the rAF loop to bypass React re-renders.
 */
export const playbackRefs = {
  /** Outer div -- CSS perspective property */
  perspectiveContainer: null as HTMLDivElement | null,
  /** Inner div -- CSS transform (translate, scale, rotateX/Y/Z) */
  transformDiv: null as HTMLDivElement | null,
  /** img element -- opacity */
  imageEl: null as HTMLImageElement | null,
  /** Cached screenshot.rotation (stable during playback, set by Perspective3DOverlay) */
  screenshotRotation: 0,
};

/**
 * Build the CSS transform string for the 3D overlay.
 * Must match the format in Perspective3DOverlay.tsx lines 105-113.
 */
export function buildTransformString(
  props: AnimatableProperties,
  rotationOffset: number,
): string {
  const rZ = props.rotateZ + rotationOffset;
  return `translate(${props.translateX}%, ${props.translateY}%) scale(${props.scale}) rotateX(${props.rotateX}deg) rotateY(${props.rotateY}deg) rotateZ(${rZ}deg)`;
}

/**
 * Apply interpolated animation values directly to registered DOM elements.
 * Returns true if the direct DOM path was used, false if refs are unavailable
 * (caller should fall back to Zustand store writes).
 */
export function applyDirectDOM(props: AnimatableProperties): boolean {
  const { perspectiveContainer, transformDiv, imageEl, screenshotRotation } =
    playbackRefs;

  if (!transformDiv) return false;

  transformDiv.style.transform = buildTransformString(props, screenshotRotation);
  transformDiv.style.transition = 'none';

  if (perspectiveContainer) {
    perspectiveContainer.style.perspective = `${props.perspective}px`;
  }

  if (imageEl) {
    imageEl.style.opacity = String(props.imageOpacity);
  }

  return true;
}

/**
 * Restore CSS transition on the transform div (called when playback stops).
 * The 0.125s linear transition is used for smooth user-driven 3D adjustments.
 */
export function restoreTransition(): void {
  if (playbackRefs.transformDiv) {
    playbackRefs.transformDiv.style.transition = 'transform 0.125s linear';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/animation/playback-refs.ts
git commit -m "feat: add playback-refs module for direct DOM animation writes"
```

---

### Task 2: Register DOM refs in Perspective3DOverlay

**Files:**
- Modify: `components/canvas/overlays/Perspective3DOverlay.tsx`

- [ ] **Step 1: Add imports**

Add these imports at the top of the file, after the existing imports:

```typescript
import { useCallback, useEffect } from 'react';
import { playbackRefs } from '@/lib/animation/playback-refs';
```

- [ ] **Step 2: Add ref callbacks and effects inside the component**

Insert this block inside `Perspective3DOverlay`, immediately after the `if (!has3DTransform) return null;` guard (after line 67):

```typescript
  const perspectiveRef = useCallback((el: HTMLDivElement | null) => {
    playbackRefs.perspectiveContainer = el;
  }, []);

  const transformRef = useCallback((el: HTMLDivElement | null) => {
    playbackRefs.transformDiv = el;
  }, []);

  const imageRefCb = useCallback((el: HTMLImageElement | null) => {
    playbackRefs.imageEl = el;
  }, []);

  // Keep screenshotRotation in sync for direct DOM path
  useEffect(() => {
    playbackRefs.screenshotRotation = screenshot.rotation;
  }, [screenshot.rotation]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      playbackRefs.perspectiveContainer = null;
      playbackRefs.transformDiv = null;
      playbackRefs.imageEl = null;
    };
  }, []);
```

- [ ] **Step 3: Add ref attributes to the three DOM elements**

Add `ref={perspectiveRef}` to the outer `<div data-3d-overlay="true" ...>` element (the one at line 191 with `style={{ position: 'absolute', ... perspective: ... }}`):

```tsx
    <div
      ref={perspectiveRef}
      data-3d-overlay="true"
```

Add `ref={transformRef}` to the inner transform div (the one at line 211 with `style={{ ... transform: perspective3DTransform ... }}`):

```tsx
      <div
        ref={transformRef}
        style={{
          position: 'absolute',
```

Add `ref={imageRefCb}` to the `<img>` element (at line 251):

```tsx
          <img
            ref={imageRefCb}
            src={image.src}
```

- [ ] **Step 4: Verify refs are registered**

Run: `pnpm dev`

Open the editor, upload an image, enable a 3D transform (set rotateX to any non-zero value).
Open browser console and type:

```javascript
// Verify all three refs are set (should not be null)
console.log('perspective:', document.querySelector('[data-3d-overlay]') !== null);
```

Expected: All three should reference DOM elements when 3D overlay is visible.

- [ ] **Step 5: Commit**

```bash
git add components/canvas/overlays/Perspective3DOverlay.tsx
git commit -m "feat: register DOM refs in Perspective3DOverlay for direct playback writes"
```

---

### Task 3: Refactor useTimelinePlayback for direct DOM writes

**Files:**
- Modify: `components/timeline/hooks/useTimelinePlayback.tsx`

- [ ] **Step 1: Add imports and new refs**

Add the import at the top:

```typescript
import { applyDirectDOM, restoreTransition } from '@/lib/animation/playback-refs';
import type { AnimatableProperties } from '@/types/animation';
```

Inside `useTimelinePlayback()`, after the existing refs (after line 51), add:

```typescript
  const lastInterpolatedRef = React.useRef<AnimatableProperties>(DEFAULT_ANIMATABLE_PROPERTIES);
  const hasPlayedRef = React.useRef(false);
```

- [ ] **Step 2: Rewrite the animate function with direct DOM path**

Replace the entire animation loop effect (lines 59-146) with:

```typescript
  // Animation loop - minimal dependencies to prevent recreation
  React.useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Sync final state if we actually played (not on initial mount)
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

    const animate = (currentTime: number) => {
      // Get fresh state values to avoid stale closures
      const state = useImageStore.getState();
      const currentPlayhead = playheadRef.current;
      const {
        duration: currentDuration,
        isLooping: currentIsLooping,
        tracks: currentTracks,
      } = state.timeline;
      const currentSlides = state.slides;
      const currentActiveSlideId = state.activeSlideId;
      const currentAnimationClips = state.animationClips;
      const defaultSlideDuration = state.slideshow.defaultDuration;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Calculate new playhead position
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

      // Update playhead ref and store (cheap write, needed for timeline UI)
      playheadRef.current = newPlayhead;
      state.setPlayhead(newPlayhead);

      // Switch to the correct slide based on playhead position
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

      // Compute interpolated properties at current time
      const interpolated = getClipInterpolatedProperties(
        currentAnimationClips,
        currentTracks,
        newPlayhead,
        DEFAULT_ANIMATABLE_PROPERTIES,
      );

      // Store for sync-back when playback stops
      lastInterpolatedRef.current = interpolated;

      // Try direct DOM path (bypasses React re-renders for 3D overlay)
      const usedDirectDOM = applyDirectDOM(interpolated);

      if (!usedDirectDOM) {
        // Fallback: no 3D overlay rendered, write to store
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
        // Sync final state to store before stopping
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

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]); // Only depend on isPlaying to start/stop
```

- [ ] **Step 3: Verify animation plays correctly**

Run: `pnpm dev`

1. Upload an image
2. Add an animation preset (e.g. "Hero Landing")
3. Press Play
4. Verify the 3D animation renders smoothly
5. Verify the playhead ticker moves in the timeline
6. Verify the timestamp in TimelineControls updates
7. Let it loop -- verify smooth looping
8. Press Pause -- verify the 3D transform holds at the paused position
9. Scrub the playhead manually -- verify 3D transform updates correctly

- [ ] **Step 4: Commit**

```bash
git add components/timeline/hooks/useTimelinePlayback.tsx
git commit -m "perf: bypass Zustand store for 3D transforms during playback

Direct DOM writes for perspective3D (7 properties) and imageOpacity
during rAF loop. Syncs back to store when playback stops.
Keeps playhead store writes for timeline UI updates."
```

---

### Task 4: Verify edge cases

**Files:** None (verification only)

- [ ] **Step 1: Test natural playback end (non-looping)**

1. Disable loop (click loop button in TimelineControls)
2. Press Play
3. Let animation reach the end
4. Verify: animation stops at final frame, 3D transform matches expected end state
5. Verify: scrubbing works correctly after stop
6. Verify: Perspective3DControls sliders show correct final values

- [ ] **Step 2: Test with no 3D transform active**

1. Upload an image (no 3D transforms applied)
2. Add an opacity-only animation (if available) or any preset
3. If `has3DTransform` is false (all perspective3D values at defaults), verify animation still works via store fallback
4. The rAF loop should use the store write fallback path when `applyDirectDOM` returns false

- [ ] **Step 3: Test video export**

1. Add a 3D animation preset
2. Export as video (any format)
3. Verify: exported video shows correct 3D transforms per frame
4. Export uses scrubbing (not playback), so it should be unaffected by this change

- [ ] **Step 4: Test multi-slide playback**

1. Add multiple slides
2. Add animation presets
3. Press Play
4. Verify: slides switch correctly during playback
5. Verify: 3D transforms animate correctly across slide boundaries

- [ ] **Step 5: Commit any fixes**

If any edge case revealed issues, commit the fixes:

```bash
git add -u
git commit -m "fix: address edge cases in direct DOM playback"
```

---

### Task 5: Performance verification

**Files:** None (profiling only)

- [ ] **Step 1: Profile with React DevTools**

1. Open React DevTools Profiler
2. Start recording
3. Play a 3D animation for ~3 seconds
4. Stop recording
5. Check the flame chart:
   - `ClientCanvas` / `CanvasRenderer` should NOT re-render during playback
   - `Perspective3DOverlay` should NOT re-render during playback
   - `TimelineEditor` and `PlayheadTicker` WILL re-render (from playhead store writes -- this is expected)
6. Compare with the previous behavior (revert temporarily if needed):
   - Before: `ClientCanvas` re-renders ~60x/sec during playback
   - After: `ClientCanvas` re-renders 0x during playback

- [ ] **Step 2: Final commit**

```bash
git add -u
git commit -m "perf: verify direct DOM playback eliminates canvas re-renders"
```

---

## Known Trade-offs

| Trade-off | Impact | Why acceptable |
|-----------|--------|----------------|
| Perspective3DControls sliders freeze during playback | Low | Users don't adjust sliders during animation; values snap to correct state on stop |
| One-frame fallback to store writes when 3D overlay first renders | Negligible | Only happens once at start if overlay wasn't previously visible |
| Redundant store write on stop (scrubbing effect also writes) | Negligible | Idempotent -- both write same values from same playhead position |
