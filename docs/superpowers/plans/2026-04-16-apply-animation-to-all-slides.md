# Apply Animation to All Slides — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a store action and UI button that applies the same animation preset to every slide, placing one animation clip per slide at its corresponding start time on the timeline.

**Architecture:** New `applyAnimationToAllSlides(presetId)` action in the Zustand store calculates cumulative slide start times and calls the existing `addAnimationClip` logic for each slide. Both the `RightSettingsPanel` AnimationControls and `AnimationPresetGallery` get a long-press / secondary action to trigger this. No new files — all changes are in existing files.

**Tech Stack:** Zustand store, React (hugeicons-react for icons), existing animation preset system

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/store/index.ts` | Modify (~1649) | Add `applyAnimationToAllSlides` action |
| `components/editor/RightSettingsPanel.tsx` | Modify (~442-452) | Add "Apply to All" button in AnimationControls |
| `components/timeline/AnimationPresetGallery.tsx` | Modify (~41-55) | Add "Apply to All" button in gallery |

---

### Task 1: Add `applyAnimationToAllSlides` Store Action

**Files:**
- Modify: `lib/store/index.ts:643-649` (interface — add new action signature)
- Modify: `lib/store/index.ts:1604-1635` (implementation — add action next to `addAnimationClip`)

- [ ] **Step 1: Add the action type to ImageState interface**

In `lib/store/index.ts`, find the `ImageState` interface near line 646 where `addAnimationClip` is declared. Add the new action right after it:

```ts
  addAnimationClip: (presetId: string, startTime: number) => void;
  applyAnimationToAllSlides: (presetId: string) => void;  // <-- add this line
  updateAnimationClip: (clipId: string, updates: Partial<AnimationClip>) => void;
```

- [ ] **Step 2: Implement the action in the store**

In `lib/store/index.ts`, find the `addAnimationClip` implementation (around line 1604). Add the new action right after the `addAnimationClip` block (after its closing `});` around line 1635):

```ts
    applyAnimationToAllSlides: (presetId) => {
      const preset = ANIMATION_PRESETS.find(p => p.id === presetId);
      if (!preset) return;

      const { slides, slideshow, animationClips, timeline } = get();

      // Need at least 2 slides for "apply to all" to make sense
      if (slides.length < 2) {
        // Fall back to single clip add (same as clicking once)
        get().addAnimationClip(presetId, animationClips.reduce((max, clip) =>
          Math.max(max, clip.startTime + clip.duration), 0));
        return;
      }

      // Clear existing clips first for a clean slate
      const clearedTracks = timeline.tracks.filter(t => !t.clipId || !animationClips.some(c => c.id === t.clipId));

      // Calculate per-slide start times and create clips + tracks
      const newClips: AnimationClip[] = [];
      const newTracks: AnimationTrack[] = [];
      const colors = ['#c9ff2e', '#10B981', '#22c55e', '#84cc16', '#34d399'];
      let cumulativeTime = 0;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const startTime = cumulativeTime;
        const slideDurationMs = (slide.duration || slideshow.defaultDuration) * 1000;

        // Scale animation to fit within slide duration
        const clipDuration = Math.min(preset.duration, slideDurationMs);
        const id = `clip-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        const color = colors[i % colors.length];

        newClips.push({
          id,
          presetId,
          name: preset.name,
          startTime,
          duration: clipDuration,
          color,
        });

        // Clone preset tracks linked to this clip
        const tracks = clonePresetTracks(preset, { startTime, clipId: id });
        newTracks.push(...tracks);

        cumulativeTime += slideDurationMs;
      }

      trackAnimationClipAdd(presetId, preset.name, preset.duration);

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

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Volumes/ssd/sam/Developer/screenshot-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors related to `applyAnimationToAllSlides`.

- [ ] **Step 4: Commit**

```bash
git add lib/store/index.ts
git commit -m "feat: add applyAnimationToAllSlides store action"
```

---

### Task 2: Add "Apply to All Slides" Button in RightSettingsPanel

**Files:**
- Modify: `components/editor/RightSettingsPanel.tsx:411-452` (AnimationControls component)

- [ ] **Step 1: Wire up the new store action**

In `components/editor/RightSettingsPanel.tsx`, find the `AnimationControls` component (line 411). In its destructured store values (lines 412-423), add `applyAnimationToAllSlides` and `slides`:

```ts
function AnimationControls() {
  const {
    uploadedImageUrl,
    backgroundConfig,
    borderRadius,
    imageShadow,
    animationClips,
    addAnimationClip,
    applyAnimationToAllSlides,
    clearAnimationClips,
    setShowTimeline,
    setTimelineDuration,
    timeline,
    slides,
  } = useImageStore();
```

- [ ] **Step 2: Add the "Apply to All" handler**

Right after the existing `handlePresetClick` function (around line 452), add:

```ts
  const handleApplyToAll = (preset: AnimationPreset) => {
    applyAnimationToAllSlides(preset.id);
  };

  const hasMultipleSlides = slides.length >= 2;
```

- [ ] **Step 3: Add the "Apply All" button to each preset card**

Find the hover overlay inside the preset card (the `<div>` with `bg-foreground/40 opacity-0 group-hover/card:opacity-100` around line 559). Replace it with two buttons when multiple slides exist:

```tsx
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {hasMultipleSlides ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePresetClick(preset); }}
                              className="bg-foreground/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 text-[10px] font-medium text-background hover:bg-foreground/50 transition-colors"
                            >
                              <Add01Icon size={12} className="inline mr-1" />
                              Add
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApplyToAll(preset); }}
                              className="bg-primary/80 backdrop-blur-sm rounded-full px-2.5 py-1.5 text-[10px] font-medium text-primary-foreground hover:bg-primary transition-colors"
                            >
                              All Slides
                            </button>
                          </>
                        ) : (
                          <div className="bg-foreground/20 backdrop-blur-sm rounded-full p-2">
                            <Add01Icon size={16} className="text-background" />
                          </div>
                        )}
                      </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Volumes/ssd/sam/Developer/screenshot-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add components/editor/RightSettingsPanel.tsx
git commit -m "feat: add 'Apply to All Slides' button in animation controls"
```

---

### Task 3: Add "Apply to All Slides" Button in AnimationPresetGallery

**Files:**
- Modify: `components/timeline/AnimationPresetGallery.tsx:23-55` (component body)

- [ ] **Step 1: Wire up the new store action and slides**

In `components/timeline/AnimationPresetGallery.tsx`, update the destructured store values at line 30 to include the new action and slides:

```ts
  const {
    uploadedImageUrl,
    backgroundConfig,
    borderRadius,
    imageShadow,
    timeline,
    animationClips,
    addAnimationClip,
    applyAnimationToAllSlides,
    clearAnimationClips,
    setShowTimeline,
    setTimelineDuration,
    slides,
    slideshow,
  } = useImageStore();
```

- [ ] **Step 2: Add the "Apply to All" handler and flag**

After the existing `handleClearAnimation` function (around line 59), add:

```ts
  const handleApplyToAll = (preset: AnimationPreset) => {
    applyAnimationToAllSlides(preset.id);
  };

  const hasMultipleSlides = slides.length >= 2;
```

- [ ] **Step 3: Add the "All Slides" button to each preset tile**

Find the hover overlay (the `<div>` with `bg-foreground/50 opacity-0 group-hover:opacity-100` around line 162). Replace it with:

```tsx
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {hasMultipleSlides ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePresetClick(preset); }}
                            className="bg-foreground/20 rounded-full p-1.5"
                            title="Add once"
                          >
                            <Add01Icon size={14} className="text-primary-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApplyToAll(preset); }}
                            className="bg-primary/80 rounded-full px-2 py-1 text-[9px] font-medium text-primary-foreground hover:bg-primary transition-colors"
                            title="Apply to all slides"
                          >
                            All
                          </button>
                        </>
                      ) : (
                        <div className="bg-foreground/20 rounded-full p-2">
                          <Add01Icon size={16} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Volumes/ssd/sam/Developer/screenshot-studio && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add components/timeline/AnimationPresetGallery.tsx
git commit -m "feat: add 'Apply to All' button in animation preset gallery"
```

---

### Task 4: Manual QA — Verify in Browser

**Files:** None (testing only)

- [ ] **Step 1: Start dev server**

Run: `cd /Volumes/ssd/sam/Developer/screenshot-studio && pnpm dev`

- [ ] **Step 2: Test single-slide behavior**

1. Upload a single image
2. Open the Animation / Motion tab in the right panel
3. Hover over a preset card — should show single "Add" icon (no "All Slides" button)
4. Click it — animation clip appears on timeline

- [ ] **Step 3: Test multi-slide "Apply to All"**

1. Upload 3+ images (creates slides)
2. Open the Animation / Motion tab
3. Hover over a preset card — should show "Add" and "All Slides" buttons
4. Click "All Slides" — one animation clip per slide should appear on the timeline
5. Clips should be positioned at each slide's start time
6. Timeline duration should encompass all slides
7. Hit play — animation should repeat for each slide as it enters

- [ ] **Step 4: Test replacing existing clips**

1. With clips from step 3 still present, click "All Slides" on a different preset
2. Previous clips should be replaced with new ones (one per slide with the new preset)
3. Timeline should still be correct

- [ ] **Step 5: Test "Add" still works alongside "All Slides"**

1. After "All Slides" is applied, click "Add" on a different preset
2. It should append a new clip at the end of existing clips (existing behavior preserved)

- [ ] **Step 6: Commit if any fixes were needed**

```bash
git add -u
git commit -m "fix: address QA findings from apply-to-all-slides"
```
