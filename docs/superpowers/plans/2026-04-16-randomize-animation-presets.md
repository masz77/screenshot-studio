# Randomize Animation Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Randomize" button below the Animation Presets section that assigns a random (different) animation preset to each slide.

**Architecture:** New store action `randomizeAnimationsAcrossSlides` picks a random preset per slide (avoiding repeats when possible), clears existing clips, and creates one clip per slide — mirroring the existing `applyAnimationToAllSlides` pattern. A button is added to both `AnimationPresetGallery.tsx` and `RightSettingsPanel.tsx` (the two places presets are displayed), gated on `hasMultipleSlides`.

**Tech Stack:** Zustand store, React, existing `ANIMATION_PRESETS` + `clonePresetTracks`

---

### Task 1: Add `randomizeAnimationsAcrossSlides` store action

**Files:**
- Modify: `lib/store/index.ts:647` (type definition) and `lib/store/index.ts:1700` (implementation)

- [ ] **Step 1: Add the type declaration**

In `lib/store/index.ts`, after line 647 (`applyAnimationToAllSlides`), add the new action type:

```typescript
  applyAnimationToAllSlides: (presetId: string) => void;
  randomizeAnimationsAcrossSlides: () => void;  // ← ADD THIS
  updateAnimationClip: (clipId: string, updates: Partial<AnimationClip>) => void;
```

- [ ] **Step 2: Add the implementation**

In `lib/store/index.ts`, after the closing of `applyAnimationToAllSlides` (after line 1700), add:

```typescript
    randomizeAnimationsAcrossSlides: () => {
      const { slides, slideshow, animationClips, timeline } = get();

      if (slides.length < 2) return;

      // Clear existing clips
      const clearedTracks = timeline.tracks.filter(t => !t.clipId || !animationClips.some(c => c.id === t.clipId));

      // Pick a random preset per slide, avoiding consecutive repeats
      const presetCount = ANIMATION_PRESETS.length;
      const picked: AnimationPreset[] = [];
      for (let i = 0; i < slides.length; i++) {
        let preset: AnimationPreset;
        do {
          preset = ANIMATION_PRESETS[Math.floor(Math.random() * presetCount)];
        } while (i > 0 && preset.id === picked[i - 1].id && presetCount > 1);
        picked.push(preset);
      }

      const newClips: AnimationClip[] = [];
      const newTracks: AnimationTrack[] = [];
      const colors = ['#c9ff2e', '#10B981', '#22c55e', '#84cc16', '#34d399'];
      let cumulativeTime = 0;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const preset = picked[i];
        const startTime = cumulativeTime;
        const slideDurationMs = (slide.duration || slideshow.defaultDuration) * 1000;
        const clipDuration = Math.min(preset.duration, slideDurationMs);
        const id = `clip-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        const color = colors[i % colors.length];

        newClips.push({
          id,
          presetId: preset.id,
          name: preset.name,
          startTime,
          duration: clipDuration,
          color,
        });

        const tracks = clonePresetTracks(preset, { startTime, clipId: id });
        newTracks.push(...tracks);

        cumulativeTime += slideDurationMs;
      }

      set({
        animationClips: newClips,
        timeline: {
          ...timeline,
          tracks: [...clearedTracks, ...newTracks],
          duration: Math.max(timeline.duration, cumulativeTime),
          playhead: 0,
          isPlaying: false,
        },
        showTimeline: true,
      });
    },
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`
Expected: "Build complete."

- [ ] **Step 4: Commit**

```bash
git add lib/store/index.ts
git commit -m "feat: add randomizeAnimationsAcrossSlides store action"
```

---

### Task 2: Add Randomize button to `AnimationPresetGallery`

**Files:**
- Modify: `components/timeline/AnimationPresetGallery.tsx`

- [ ] **Step 1: Import the Shuffle icon and destructure the new store action**

At line 9, add the import:

```typescript
import { Delete02Icon, Add01Icon, Shuffle01Icon } from 'hugeicons-react';
```

*(If `Shuffle01Icon` doesn't exist in hugeicons-react, use `ShuffleIcon` — check autocomplete.)*

In the store destructure (line 32), add `randomizeAnimationsAcrossSlides`:

```typescript
    applyAnimationToAllSlides,
    randomizeAnimationsAcrossSlides,
    clearAnimationClips,
```

- [ ] **Step 2: Add Randomize button below the preset categories, before the info/instructions text**

Insert after the closing of the preset categories `map` (after line 217's closing `)}`) and before the `{/* Info text */}` comment (line 219):

```tsx
      {/* Randomize button — only when multiple slides */}
      {hasMultipleSlides && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={randomizeAnimationsAcrossSlides}
        >
          <Shuffle01Icon size={14} className="mr-1.5" />
          Randomize All Slides
        </Button>
      )}
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`
Expected: "Build complete."

- [ ] **Step 4: Commit**

```bash
git add components/timeline/AnimationPresetGallery.tsx
git commit -m "feat: add Randomize button to AnimationPresetGallery"
```

---

### Task 3: Add Randomize button to `RightSettingsPanel`

**Files:**
- Modify: `components/editor/RightSettingsPanel.tsx`

- [ ] **Step 1: Destructure `randomizeAnimationsAcrossSlides` from the store**

Find the existing destructure in `AnimationControls` (around line 412-425) where `applyAnimationToAllSlides` is extracted. Add `randomizeAnimationsAcrossSlides` next to it:

```typescript
    applyAnimationToAllSlides,
    randomizeAnimationsAcrossSlides,
```

- [ ] **Step 2: Add the Randomize button**

Find the equivalent location in `RightSettingsPanel.tsx` where the preset grid ends (after the closing of the preset category mapping). Add the same button pattern:

```tsx
      {hasMultipleSlides && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={randomizeAnimationsAcrossSlides}
        >
          <Shuffle01Icon size={14} className="mr-1.5" />
          Randomize All Slides
        </Button>
      )}
```

Add `Shuffle01Icon` to the hugeicons-react import at the top of the file.

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`
Expected: "Build complete."

- [ ] **Step 4: Commit**

```bash
git add components/editor/RightSettingsPanel.tsx
git commit -m "feat: add Randomize button to RightSettingsPanel"
```
