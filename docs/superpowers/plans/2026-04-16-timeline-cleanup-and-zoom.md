# Timeline Cleanup & Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove 4 unused legacy timeline components and wire up functional zoom/pan controls for the timeline editor.

**Architecture:** Two independent tasks. Task 1 deletes dead code from a prior keyframe-based timeline that was replaced by the clip-based system. Task 2 fixes broken zoom constants, replaces the decorative zoom icon with a functional zoom control (already built in `TimelineControlsV2`), and ensures zoom-adjusted scaling propagates to all timeline width calculations.

**Tech Stack:** React 19, TypeScript, Zustand (store already has `timeline.zoom`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/timeline/TimelinePlayhead.tsx` | Delete | Legacy: unused draggable playhead |
| `components/timeline/TimelineRuler.tsx` | Delete | Legacy: unused time tick ruler |
| `components/timeline/TimelineTrack.tsx` | Delete | Legacy: unused keyframe track container |
| `components/timeline/KeyframeMarker.tsx` | Delete | Legacy: unused keyframe diamond marker |
| `components/timeline/index.ts` | Modify | Remove 4 dead exports, add V2 export |
| `components/timeline/TimelineEditor.tsx` | Modify | Fix zoom constants, switch to V2 controls, fix SlideDurationHandle |
| `components/timeline/TimelineControls.tsx` | Delete | Replaced by V2 (identical API, adds zoom button) |
| `components/timeline/TimelineControlsV2.tsx` | Rename | Becomes `TimelineControls.tsx` |

---

### Task 1: Delete Legacy Timeline Components

**Files:**
- Delete: `components/timeline/TimelinePlayhead.tsx`
- Delete: `components/timeline/TimelineRuler.tsx`
- Delete: `components/timeline/TimelineTrack.tsx`
- Delete: `components/timeline/KeyframeMarker.tsx`
- Modify: `components/timeline/index.ts`

These 4 files are exported via the barrel `index.ts` but imported nowhere else in the codebase. `TimelineTrack.tsx` imports `KeyframeMarker.tsx` internally — both are dead.

- [ ] **Step 1: Delete the 4 legacy files**

```bash
rm components/timeline/TimelinePlayhead.tsx
rm components/timeline/TimelineRuler.tsx
rm components/timeline/TimelineTrack.tsx
rm components/timeline/KeyframeMarker.tsx
```

- [ ] **Step 2: Remove dead exports from barrel**

In `components/timeline/index.ts`, remove these 4 lines:

```typescript
// DELETE these lines:
export { TimelineRuler } from './TimelineRuler';
export { TimelineTrack } from './TimelineTrack';
export { TimelinePlayhead } from './TimelinePlayhead';
export { KeyframeMarker } from './KeyframeMarker';
```

The file should become:

```typescript
// Timeline components barrel export
export { TimelineEditor } from './TimelineEditor';
export { TimelineControls } from './TimelineControls';
export { AnimationPresetGallery } from './AnimationPresetGallery';
export { useTimelinePlayback } from './hooks/useTimelinePlayback';
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no errors about missing imports.

- [ ] **Step 4: Commit**

```bash
git add -A components/timeline/
git commit -m "refactor: remove 4 unused legacy timeline components

TimelinePlayhead, TimelineRuler, TimelineTrack, and KeyframeMarker
were from the old keyframe-based timeline, replaced by clip-based system."
```

---

### Task 2: Replace TimelineControls V1 with V2

**Files:**
- Delete: `components/timeline/TimelineControls.tsx` (V1 — decorative zoom icon)
- Rename: `components/timeline/TimelineControlsV2.tsx` → `components/timeline/TimelineControls.tsx`
- Modify: `components/timeline/TimelineControls.tsx` (renamed file — update export name)

V1 and V2 have identical prop interfaces (`onAddAnimation?`, `onClose?`). V2 adds a functional zoom reset button and zoom percentage display. This is a drop-in replacement.

- [ ] **Step 1: Delete V1 and rename V2**

```bash
rm components/timeline/TimelineControls.tsx
mv components/timeline/TimelineControlsV2.tsx components/timeline/TimelineControls.tsx
```

- [ ] **Step 2: Update the renamed file's export name**

In the renamed `components/timeline/TimelineControls.tsx`:

Change the interface name:

```typescript
// Old:
interface TimelineControlsV2Props {

// New:
interface TimelineControlsProps {
```

Change the function name:

```typescript
// Old:
export function TimelineControlsV2({ onAddAnimation, onClose }: TimelineControlsV2Props) {

// New:
export function TimelineControls({ onAddAnimation, onClose }: TimelineControlsProps) {
```

No other files need updating — `TimelineEditor.tsx` already imports `{ TimelineControls }` from `'./TimelineControls'`, and `index.ts` already exports from `'./TimelineControls'`. The barrel and consumer match the new filename and export name automatically.

- [ ] **Step 3: Remove stale V2 export from barrel (if present)**

Check `components/timeline/index.ts`. If it has a `TimelineControlsV2` export line, remove it. After Task 1's edits, the file should be:

```typescript
// Timeline components barrel export
export { TimelineEditor } from './TimelineEditor';
export { TimelineControls } from './TimelineControls';
export { AnimationPresetGallery } from './AnimationPresetGallery';
export { useTimelinePlayback } from './hooks/useTimelinePlayback';
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: Build succeeds. The zoom reset button and zoom % display are now visible in the timeline controls bar.

- [ ] **Step 5: Commit**

```bash
git add components/timeline/TimelineControls.tsx components/timeline/TimelineControlsV2.tsx components/timeline/index.ts
git commit -m "refactor: replace TimelineControls V1 with V2

V2 adds functional zoom reset button and zoom percentage display.
Identical prop interface — drop-in replacement."
```

---

### Task 3: Fix Zoom Constants and Wire Zoom Scaling

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx`

The file references `BASE_PPS`, `ZOOM_STEP`, `MIN_ZOOM`, and `MAX_ZOOM` — none of which are defined. `PIXELS_PER_SECOND` is defined at line 13 but line 462 uses the undefined `BASE_PPS` instead. The `SlideDurationHandle` component at line 415 uses the raw `PIXELS_PER_SECOND` constant instead of the zoom-adjusted value, ignoring zoom.

- [ ] **Step 1: Add zoom constants and fix BASE_PPS reference**

At the top of `components/timeline/TimelineEditor.tsx`, replace the constants block (lines 11-13):

```typescript
// Old:
const TIMELINE_HEIGHT = 210;
const TRACK_LABEL_WIDTH = 120;
const PIXELS_PER_SECOND = 105;

// New:
const TIMELINE_HEIGHT = 210;
const TRACK_LABEL_WIDTH = 120;
const PIXELS_PER_SECOND = 105;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
```

- [ ] **Step 2: Fix BASE_PPS → PIXELS_PER_SECOND on line 462**

```typescript
// Old (line 462):
const pixelsPerSecond = BASE_PPS * timeline.zoom;

// New:
const pixelsPerSecond = PIXELS_PER_SECOND * timeline.zoom;
```

- [ ] **Step 3: Fix SlideDurationHandle to respect zoom**

The `SlideDurationHandle` component (line 402) uses `PIXELS_PER_SECOND` directly at line 415 when calculating duration from drag position. It needs to use the zoom-adjusted value instead.

Update the component signature to accept `pixelsPerSecond` (it's already passed as a prop at line 543 but ignored):

```typescript
// Old (line 402):
function SlideDurationHandle({ timelineWidth, trackWidth }: { timelineWidth: number; trackWidth: number }) {

// New:
function SlideDurationHandle({ timelineWidth, trackWidth, pixelsPerSecond }: { timelineWidth: number; trackWidth: number; pixelsPerSecond: number }) {
```

Update the drag calculation to use the prop (line 415):

```typescript
// Old (line 415):
const newDurationSeconds = Math.max(1, Math.min(30, Math.round(x / (PIXELS_PER_SECOND))));

// New:
const newDurationSeconds = Math.max(1, Math.min(30, Math.round(x / pixelsPerSecond)));
```

The JSX at line 543 already passes `pixelsPerSecond={pixelsPerSecond}`, so no change needed there.

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no undefined variable errors.

- [ ] **Step 5: Test zoom in browser**

```bash
pnpm dev
```

Open `localhost:3000`, upload an image, open the timeline:

1. **Ctrl/Cmd + scroll up** on the timeline area → zoom level increases, tracks stretch wider, zoom % in controls updates
2. **Ctrl/Cmd + scroll down** → zoom level decreases, tracks compress, zoom % updates
3. Zoom clamped between 25% and 400%
4. Click the zoom % button when zoom ≠ 100% → resets to 100%
5. Drag the duration handle → new duration calculation matches the visible grid spacing (zoom-aware)
6. **Horizontal scroll** (trackpad swipe or shift+mousewheel) → pans the timeline left/right normally

- [ ] **Step 6: Commit**

```bash
git add components/timeline/TimelineEditor.tsx
git commit -m "fix: wire timeline zoom with proper constants and scaling

- Define ZOOM_STEP (0.1), MIN_ZOOM (0.25), MAX_ZOOM (4)
- Fix undefined BASE_PPS reference → PIXELS_PER_SECOND
- Fix SlideDurationHandle to use zoom-adjusted pixelsPerSecond
- Ctrl/Cmd+mousewheel zoom now works end-to-end"
```
