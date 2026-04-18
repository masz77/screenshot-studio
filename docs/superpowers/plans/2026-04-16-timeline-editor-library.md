# Timeline Editor Library Upgrade (`@xzdarcy/react-timeline-editor`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom clip arrangement UI (drag, resize, snap, playhead) with `@xzdarcy/react-timeline-editor`, gaining multi-track layering, drag-line alignment, and virtual scrolling while keeping our custom interpolation engine and playback system.

**Architecture:** The library handles timeline UI rendering (clip display, drag/resize, cursor, scale ruler). Our Zustand store remains the source of truth. An adapter layer converts between our `AnimationClip[]`/`Slide[]` and the library's `TimelineRow[]`/`TimelineAction[]`. Custom `getActionRender` preserves our clip appearance. Our `useTimelinePlayback` hook drives animation independently -- we sync the playhead position to the library's cursor.

**Tech Stack:** `@xzdarcy/react-timeline-editor` (MIT, React), `@xzdarcy/timeline-engine` (peer dep), adapter pattern

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/timeline/adapters.ts` | Bidirectional conversion: our types <-> library types |
| Create | `components/timeline/renderers/AnimationClipRenderer.tsx` | Custom visual for animation clips in the library |
| Create | `components/timeline/renderers/MediaClipRenderer.tsx` | Custom visual for media/slide clips in the library |
| Modify | `components/timeline/TimelineEditor.tsx` | Replace internals with library `<Timeline>` component |
| Modify | `package.json` | Add `@xzdarcy/react-timeline-editor` dependency |

**Untouched files (used in editor panels, NOT in main timeline):**
- `components/timeline/TimelineTrack.tsx` -- keyframe editing in detail panels
- `components/timeline/KeyframeMarker.tsx` -- diamond keyframe markers in detail panels
- `components/timeline/TimelineControls.tsx` -- play/pause/loop controls (kept as-is)
- `components/timeline/hooks/useTimelinePlayback.tsx` -- animation engine (kept as-is)

---

### Task 1: Install and verify compatibility

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the library**

```bash
pnpm add @xzdarcy/react-timeline-editor
```

- [ ] **Step 2: Verify the package installed and has types**

```bash
ls node_modules/@xzdarcy/react-timeline-editor/dist/index.d.ts
```

Expected: File exists.

- [ ] **Step 3: Create a minimal smoke test**

Create a temporary test file to verify the library works with React 19 + Vite:

```typescript
// lib/timeline/__test-import.ts (temporary, delete after verification)
import { Timeline } from '@xzdarcy/react-timeline-editor';
import type { TimelineRow, TimelineAction, TimelineEffect } from '@xzdarcy/react-timeline-editor';

// Type-check: verify these types exist and are usable
const row: TimelineRow = {
  id: 'test',
  actions: [{
    id: 'a1',
    start: 0,
    end: 1,
    effectId: 'e1',
  }],
};

export { Timeline, row };
```

- [ ] **Step 4: Run the build to check for bundling issues**

```bash
pnpm build
```

Expected: Build succeeds. If `react-virtualized` (CJS) causes issues with Vite, add to `optimizeDeps.include` in `next.config.ts`:

```typescript
// next.config.ts -- only if build fails with react-virtualized CJS error
{
  vite: {
    optimizeDeps: {
      include: ['react-virtualized'],
    },
  },
}
```

- [ ] **Step 5: Run dev server and verify no runtime errors**

```bash
pnpm dev
```

Open the editor in browser. Check console for errors. The library isn't rendered yet -- we're just verifying the import doesn't break anything.

- [ ] **Step 6: Delete the temporary test file and commit**

```bash
rm lib/timeline/__test-import.ts
git add package.json pnpm-lock.yaml
git commit -m "chore: add @xzdarcy/react-timeline-editor dependency"
```

**GATE:** If the build or dev server fails with compatibility errors (React 19, React Compiler, Vite CJS), stop here and document the issue. The library may need a fork or alternative approach.

---

### Task 2: Create adapter module

**Files:**
- Create: `lib/timeline/adapters.ts`

- [ ] **Step 1: Create the adapter with our-to-library conversion**

```typescript
// lib/timeline/adapters.ts
import type { TimelineRow, TimelineAction } from '@xzdarcy/react-timeline-editor';
import type { AnimationClip } from '@/types/animation';

/**
 * Extended action with our custom metadata for the clip renderers.
 * The library passes actions to getActionRender -- we read these extra fields there.
 */
export interface AnimationAction extends TimelineAction {
  clipName: string;
  clipColor: string;
}

export interface MediaAction extends TimelineAction {
  slideName: string;
  slideSrc: string;
  slideIndex: number;
}

interface Slide {
  id: string;
  src: string;
  name: string | null;
  duration: number; // seconds
}

/** Convert AnimationClip[] to library TimelineAction[] (seconds, start/end) */
export function clipsToActions(clips: AnimationClip[]): AnimationAction[] {
  return clips.map((clip) => ({
    id: clip.id,
    start: clip.startTime / 1000,
    end: (clip.startTime + clip.duration) / 1000,
    effectId: clip.presetId,
    clipName: clip.name,
    clipColor: clip.color,
  }));
}

/** Convert Slide[] to library TimelineAction[] (evenly distributed across duration) */
export function slidesToActions(
  slides: Slide[],
  timelineDurationMs: number,
): MediaAction[] {
  if (slides.length === 0) return [];

  const durationPerSlide = timelineDurationMs / slides.length;

  return slides.map((slide, i) => ({
    id: slide.id,
    start: (i * durationPerSlide) / 1000,
    end: ((i + 1) * durationPerSlide) / 1000,
    effectId: 'media',
    movable: false,
    flexible: false,
    slideName: slide.name || `Slide ${i + 1}`,
    slideSrc: slide.src,
    slideIndex: i,
  }));
}

/** Build a single-image media action spanning the full duration */
function singleImageAction(
  imageUrl: string,
  imageName: string,
  durationMs: number,
): MediaAction[] {
  return [
    {
      id: 'main',
      start: 0,
      end: durationMs / 1000,
      effectId: 'media',
      movable: false,
      flexible: false,
      slideName: imageName || 'Screenshot',
      slideSrc: imageUrl,
      slideIndex: 0,
    },
  ];
}

/** Build the editorData array for the library Timeline component */
export function toTimelineRows(
  clips: AnimationClip[],
  slides: Slide[],
  timelineDurationMs: number,
  uploadedImageUrl: string | null,
  imageName: string | null,
): TimelineRow[] {
  const animationRow: TimelineRow = {
    id: 'animation',
    actions: clipsToActions(clips),
    rowHeight: 48,
  };

  let mediaActions: MediaAction[] = [];
  if (slides.length > 0) {
    mediaActions = slidesToActions(slides, timelineDurationMs);
  } else if (uploadedImageUrl) {
    mediaActions = singleImageAction(
      uploadedImageUrl,
      imageName || 'Screenshot',
      timelineDurationMs,
    );
  }

  const mediaRow: TimelineRow = {
    id: 'media',
    actions: mediaActions,
    rowHeight: 56,
  };

  return [animationRow, mediaRow];
}

/**
 * Apply animation row changes from the library's onChange back to our store.
 * Called when user drags or resizes an animation clip in the timeline.
 */
export function applyAnimationRowChanges(
  newActions: TimelineAction[],
  updateClip: (
    id: string,
    updates: { startTime?: number; duration?: number },
  ) => void,
): void {
  for (const action of newActions) {
    const startTime = Math.round(action.start * 1000);
    const duration = Math.round((action.end - action.start) * 1000);
    updateClip(action.id, { startTime, duration });
  }
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm exec tsc --noEmit lib/timeline/adapters.ts
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/timeline/adapters.ts
git commit -m "feat: add adapter layer for timeline editor library types"
```

---

### Task 3: Create custom action renderers

**Files:**
- Create: `components/timeline/renderers/AnimationClipRenderer.tsx`
- Create: `components/timeline/renderers/MediaClipRenderer.tsx`

- [ ] **Step 1: Create AnimationClipRenderer**

```tsx
// components/timeline/renderers/AnimationClipRenderer.tsx
'use client';

import { VideoReplayIcon, Cancel01Icon } from 'hugeicons-react';
import type { AnimationAction } from '@/lib/timeline/adapters';

interface AnimationClipRendererProps {
  action: AnimationAction;
  onRemove: (clipId: string) => void;
}

export function AnimationClipRenderer({
  action,
  onRemove,
}: AnimationClipRendererProps) {
  return (
    <div className="relative w-full h-full rounded-lg bg-primary/15 border border-primary/30 group cursor-grab overflow-hidden">
      {/* Content */}
      <div className="flex items-center gap-1.5 px-3 h-full overflow-hidden pointer-events-none">
        <VideoReplayIcon size={12} className="text-primary shrink-0" />
        <span className="text-[10px] text-primary font-medium truncate">
          {action.clipName}
        </span>
      </div>

      {/* Delete button on hover */}
      <button
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-sm z-10 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(action.id);
        }}
      >
        <Cancel01Icon size={8} className="text-destructive-foreground" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create MediaClipRenderer**

```tsx
// components/timeline/renderers/MediaClipRenderer.tsx
'use client';

import { Cancel01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import type { MediaAction } from '@/lib/timeline/adapters';

interface MediaClipRendererProps {
  action: MediaAction;
  isActive: boolean;
  slidesCount: number;
  onRemove?: (slideId: string) => void;
  onSelect?: (slideId: string) => void;
}

export function MediaClipRenderer({
  action,
  isActive,
  slidesCount,
  onRemove,
  onSelect,
}: MediaClipRendererProps) {
  return (
    <div
      className={cn(
        'relative w-full h-full cursor-pointer group/clip',
        isActive && slidesCount > 1 && 'ring-1 ring-inset ring-primary/50',
      )}
      onClick={() => action.id !== 'main' && onSelect?.(action.id)}
    >
      <div className="absolute inset-1 rounded-md overflow-hidden bg-muted/30 border border-border/20">
        <div className="flex items-center gap-2 h-full px-2">
          {/* Mini preview */}
          <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-border/20">
            <img
              src={action.slideSrc}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          {/* Details */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-foreground/70 font-medium truncate">
              {slidesCount > 1
                ? `Slide ${action.slideIndex + 1}`
                : 'Mockup'}
            </span>
            <span className="text-[9px] text-muted-foreground truncate">
              {action.slideName}
            </span>
          </div>
        </div>
      </div>

      {/* Remove button for multi-slide */}
      {slidesCount > 1 && action.id !== 'main' && onRemove && (
        <button
          className="absolute top-0 right-0 w-4 h-4 bg-background/80 rounded-full flex items-center justify-center hover:bg-destructive z-10 opacity-0 group-hover/clip:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(action.id);
          }}
        >
          <Cancel01Icon size={8} className="text-foreground" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/timeline/renderers/
git commit -m "feat: add custom clip renderers for timeline editor library"
```

---

### Task 4: Replace TimelineEditor internals with library

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx`

This is the largest task. We replace the hand-built tracks and playhead with the library's `<Timeline>` component while keeping `TimelineControls` and our playback hook.

- [ ] **Step 1: Update imports**

Replace the top of `TimelineEditor.tsx` with:

```tsx
'use client';

import * as React from 'react';
import { Timeline } from '@xzdarcy/react-timeline-editor';
import type {
  TimelineRow,
  TimelineAction,
  TimelineEffect,
  TimelineState,
} from '@xzdarcy/react-timeline-editor';
import { useImageStore } from '@/lib/store';
import { TimelineControls } from './TimelineControls';
import { useTimelinePlayback } from './hooks/useTimelinePlayback';
import { AnimationClipRenderer } from './renderers/AnimationClipRenderer';
import { MediaClipRenderer } from './renderers/MediaClipRenderer';
import {
  toTimelineRows,
  applyAnimationRowChanges,
  type AnimationAction,
  type MediaAction,
} from '@/lib/timeline/adapters';
```

- [ ] **Step 2: Remove old component functions**

Delete these functions from the file (they are replaced by the library + custom renderers):
- `formatTime` (lines 18-26)
- `TimeTrack` (lines 29-76)
- `PlayheadTicker` (lines 79-122)
- `ResizableAnimationClip` (lines 125-223)
- `AnimationTrack` (lines 226-307)
- `VideoTrack` (lines 310-402)
- `SlideDurationHandle` (lines 405-456)

Also remove the constants that are no longer needed:
- `TRACK_LABEL_WIDTH` (line 12) -- replaced by library `startLeft`
- `PIXELS_PER_SECOND` (line 13) -- replaced by library `scaleWidth`

Keep:
- `TIMELINE_HEIGHT` (line 11) -- used for container height
- `ZOOM_STEP`, `MIN_ZOOM`, `MAX_ZOOM` (lines 14-16) -- used for zoom handling

- [ ] **Step 3: Rewrite the TimelineEditor component**

Replace the `TimelineEditor` function with:

```tsx
const TIMELINE_HEIGHT = 210;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const SCALE_WIDTH = 160;
const SCALE_SPLIT_COUNT = 10;
const START_LEFT = 120;

/** Empty effects map -- we don't use the library's playback engine */
const EFFECTS: Record<string, TimelineEffect> = {
  media: { id: 'media', name: 'Media' },
};

export function TimelineEditor() {
  const {
    timeline,
    animationClips,
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
    updateAnimationClip,
    removeAnimationClip,
    removeSlide,
    setActiveSlide,
  } = useImageStore();

  const timelineRef = React.useRef<TimelineState>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useTimelinePlayback();

  // Build editorData from our store (source of truth)
  const editorData = React.useMemo(
    () =>
      toTimelineRows(
        animationClips,
        slides,
        timeline.duration,
        uploadedImageUrl,
        imageName,
      ),
    [animationClips, slides, timeline.duration, uploadedImageUrl, imageName],
  );

  // Register animation preset IDs as effects so the library accepts them
  const effects = React.useMemo(() => {
    const map: Record<string, TimelineEffect> = { ...EFFECTS };
    for (const clip of animationClips) {
      if (!map[clip.presetId]) {
        map[clip.presetId] = { id: clip.presetId, name: clip.name };
      }
    }
    return map;
  }, [animationClips]);

  // Sync our playhead to the library's cursor position
  React.useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setTime(timeline.playhead / 1000);
    }
  }, [timeline.playhead]);

  // Handle changes from the library (clip drag/resize)
  const handleChange = React.useCallback(
    (newData: TimelineRow[]) => {
      const animationRow = newData.find((r) => r.id === 'animation');
      if (animationRow) {
        applyAnimationRowChanges(animationRow.actions, updateAnimationClip);
      }
      // Media row changes are ignored (slides are not directly draggable)
    },
    [updateAnimationClip],
  );

  // Handle cursor drag (user scrubs timeline)
  const handleCursorDrag = React.useCallback(
    (time: number) => {
      stopPlayback();
      setPlayhead(time * 1000);
    },
    [stopPlayback, setPlayhead],
  );

  // Custom action renderer
  const getActionRender = React.useCallback(
    (action: TimelineAction, row: TimelineRow) => {
      if (row.id === 'animation') {
        return (
          <AnimationClipRenderer
            action={action as AnimationAction}
            onRemove={removeAnimationClip}
          />
        );
      }
      if (row.id === 'media') {
        return (
          <MediaClipRenderer
            action={action as MediaAction}
            isActive={activeSlideId === action.id}
            slidesCount={slides.length}
            onRemove={slides.length > 1 ? removeSlide : undefined}
            onSelect={setActiveSlide}
          />
        );
      }
      return null;
    },
    [removeAnimationClip, activeSlideId, slides.length, removeSlide, setActiveSlide],
  );

  // Ctrl/Cmd + mousewheel zoom handler
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const currentZoom = useImageStore.getState().timeline.zoom;
      const newZoom =
        Math.round(
          Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta)) * 100,
        ) / 100;
      if (newZoom !== currentZoom) {
        setTimeline({ zoom: newZoom });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setTimeline]);

  if (!showTimeline || (!uploadedImageUrl && slides.length === 0)) {
    return null;
  }

  const handleAddAnimation = () => {
    setActiveRightPanelTab('animate');
  };

  const handleClose = () => {
    toggleTimeline();
  };

  const durationSeconds = timeline.duration / 1000;

  return (
    <div
      className="bg-card border-t border-border/40 flex flex-col"
      style={{ height: TIMELINE_HEIGHT }}
    >
      {/* Controls bar */}
      <TimelineControls
        onAddAnimation={handleAddAnimation}
        onClose={handleClose}
      />

      {/* Timeline area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-hidden relative">
        {/* Row labels (positioned alongside the library's startLeft gap) */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 flex flex-col"
          style={{ width: START_LEFT }}
        >
          {/* Scale header spacer */}
          <div className="h-[24px] shrink-0 border-b border-border/15" />

          {/* Animation track label */}
          <div
            className="flex items-center gap-2.5 px-3 border-b border-border/15 border-r border-border/20"
            style={{ height: 48 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4 text-muted-foreground shrink-0"
            >
              <g fill="currentColor">
                <path d="M7.905 20.573a.616.616 0 0 1-1.23 0 .614.614 0 0 1 1.23 0m-.931-1.683a.617.617 0 0 1-.616.615.61.61 0 0 1-.611-.615c0-.335.269-.615.611-.615.335 0 .616.28.616.615m-.94-1.691a.61.61 0 0 1-.615.615.616.616 0 0 1-.612-.615c0-.335.281-.615.612-.615.342 0 .615.28.615.615m-.936-1.675a.62.62 0 0 1-.615.615.615.615 0 0 1 0-1.23c.334 0 .615.28.615.615m-.932-1.691a.62.62 0 0 1-.612.615.616.616 0 0 1-.615-.615c0-.335.273-.615.615-.615a.62.62 0 0 1 .612.615m-.94-1.683a.615.615 0 0 1-.611.615A.62.62 0 0 1 2 12.15c0-.335.28-.615.615-.615.339 0 .611.28.611.615m.94-1.683a.62.62 0 0 1-.612.615.616.616 0 0 1-.615-.615c0-.335.273-.615.615-.615a.62.62 0 0 1 .612.615m.932-1.691a.62.62 0 0 1-.615.615.615.615 0 0 1 0-1.23c.334 0 .615.28.615.615m.936-1.675a.616.616 0 0 1-.615.615.62.62 0 0 1-.612-.615c0-.343.281-.615.612-.615.342 0 .615.272.615.615m.94-1.691a.62.62 0 0 1-.615.615.613.613 0 0 1-.612-.615c0-.343.269-.615.612-.615.334 0 .615.272.615.615m.931-1.683a.614.614 0 1 1-1.232-.004.614.614 0 0 1 1.232.004" />
                <path d="M12.612 3.323l-4.89 8.489a.7.7 0 0 0-.109.338c0 .086.031.194.113.338l4.886 8.49c-.217.228-.437.326-.714.326-.465 0-.763-.265-1.156-.93l-4.135-7.168c-.228-.404-.341-.719-.341-1.056s.106-.652.337-1.056l4.139-7.169c.393-.664.691-.925 1.156-.925.276 0 .496.096.714.323" />
                <path d="M16.376 21.304c.457 0 .755-.265 1.148-.93l4.135-7.168c.231-.404.341-.719.341-1.056s-.11-.652-.341-1.056l-4.135-7.169C17.131 3.261 16.833 3 16.376 3c-.462 0-.764.261-1.153.925l-4.139 7.169c-.231.404-.34.719-.34 1.056s.113.652.344 1.056l4.135 7.168c.389.665.691.93 1.153.93m-.138-1.794-4.027-7.022c-.082-.144-.117-.237-.117-.338s.031-.194.109-.338l4.035-7.022a.149.149 0 0 1 .267 0l4.031 7.022c.082.144.117.237.117.338s-.035.194-.117.338l-4.031 7.022c-.061.114-.206.114-.267 0" />
              </g>
            </svg>
            <span className="text-[11px] text-muted-foreground font-medium">
              Animations
            </span>
          </div>

          {/* Media track label */}
          <div
            className="flex items-center gap-2.5 px-3 border-b border-border/15 border-r border-border/20"
            style={{ height: 56 }}
          >
            {slides.length > 0 && slides[0].src ? (
              <div className="w-5 h-5 rounded overflow-hidden shrink-0 border border-border/30">
                <img
                  src={slides[0].src}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : uploadedImageUrl ? (
              <div className="w-5 h-5 rounded overflow-hidden shrink-0 border border-border/30">
                <img
                  src={uploadedImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {imageName || 'Screenshot'}
            </span>
          </div>
        </div>

        {/* Library Timeline component */}
        <Timeline
          ref={timelineRef}
          editorData={editorData}
          effects={effects}
          onChange={handleChange}
          scale={durationSeconds > 10 ? 5 : 1}
          scaleWidth={SCALE_WIDTH * timeline.zoom}
          scaleSplitCount={SCALE_SPLIT_COUNT}
          startLeft={START_LEFT}
          autoScroll={true}
          dragLine={true}
          onCursorDrag={handleCursorDrag}
          getActionRender={getActionRender}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the timeline renders**

Run: `pnpm dev`

1. Upload an image
2. Open the timeline (should render with library's scale ruler and cursor)
3. Add an animation preset -- verify the clip appears in the Animation row
4. Verify the clip shows the custom AnimationClipRenderer (icon + name + delete button)
5. Verify the media track shows the image thumbnail

Expected: Basic rendering works. Drag/resize may need tweaking in subsequent steps.

- [ ] **Step 5: Commit**

```bash
git add components/timeline/TimelineEditor.tsx
git commit -m "feat: replace timeline internals with @xzdarcy/react-timeline-editor

Keeps TimelineControls, useTimelinePlayback, and Zustand store.
Library handles clip rendering, drag/resize, cursor, and scale."
```

---

### Task 5: Wire interactions and cursor sync

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx` (if adjustments needed)

- [ ] **Step 1: Test clip drag**

1. Add an animation clip
2. Drag it left/right
3. Verify: clip moves and the store's `animationClips` update (check with React DevTools)
4. Press Play -- verify the animation starts at the new clip position

- [ ] **Step 2: Test clip resize**

1. Drag the left or right edge of a clip to resize
2. Verify: clip duration changes in the store
3. Verify: animation timing changes accordingly during playback

- [ ] **Step 3: Test playhead cursor sync**

1. Press Play -- verify the library cursor moves with our playhead
2. Click on the timeline ruler -- verify cursor jumps and our playhead updates
3. Drag the cursor -- verify scrubbing works (3D transform updates in real-time)

- [ ] **Step 4: Test clip deletion**

1. Hover over a clip -- verify delete button appears
2. Click delete -- verify clip is removed from timeline and store
3. Verify: animation no longer plays for removed clip

- [ ] **Step 5: Test multi-slide**

1. Add multiple slides
2. Verify media row shows slides as separate clips
3. Click a slide clip -- verify it becomes the active slide
4. During playback -- verify slides switch at correct times

- [ ] **Step 6: Fix any interaction issues and commit**

```bash
git add -u
git commit -m "fix: tune timeline library interactions and cursor sync"
```

---

### Task 6: Style the library to match existing design

**Files:**
- Modify: `app/globals.css` (add library style overrides)

- [ ] **Step 1: Add CSS overrides for the library**

The library ships with its own styles. Override them to match our design system (theme variables, not hardcoded colors):

```css
/* app/globals.css -- at the bottom, after existing styles */

/* Timeline editor library overrides */
.timeline-editor {
  background: transparent !important;
  font-family: inherit !important;
}

.timeline-editor-time-area {
  border-bottom: 1px solid hsl(var(--border) / 0.15) !important;
  background: transparent !important;
}

.timeline-editor-edit-row {
  border-bottom: 1px solid hsl(var(--border) / 0.15) !important;
  background: transparent !important;
}

.timeline-editor-cursor {
  background: hsl(var(--primary)) !important;
}

.timeline-editor-cursor-top {
  background: hsl(var(--primary)) !important;
  border-radius: 9999px !important;
}

/* Hide default action styles (we use custom getActionRender) */
.timeline-editor-action {
  background: transparent !important;
  border: none !important;
}

/* Drag line */
.timeline-editor-drag-line {
  background: hsl(var(--primary) / 0.5) !important;
}

/* Scale text */
.timeline-editor-time-unit {
  color: hsl(var(--muted-foreground) / 0.6) !important;
  font-size: 9px !important;
  font-family: ui-monospace, monospace !important;
}
```

- [ ] **Step 2: Verify visual consistency**

1. Compare the new timeline with the old design
2. Check: background matches `bg-card`
3. Check: cursor/playhead is primary color
4. Check: borders use theme colors
5. Check: text uses theme colors

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: override timeline library styles to match design system"
```

---

### Task 7: Clean up and final verification

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx` (remove any dead imports)

- [ ] **Step 1: Remove unused imports from TimelineEditor.tsx**

Verify these imports are removed (they referenced deleted components):
- `cn` (if no longer used)
- `VideoReplayIcon`, `Image01Icon`, `Cancel01Icon`, `Add01Icon` from hugeicons (moved to renderers)
- `AnimationClip` type from `@/types/animation` (if no longer used directly)

- [ ] **Step 2: Verify no references to deleted functions**

Search for references to removed functions:

```bash
grep -rn "ResizableAnimationClip\|AnimationTrack\|VideoTrack\|TimeTrack\|PlayheadTicker\|SlideDurationHandle" components/ lib/ --include="*.tsx" --include="*.ts"
```

Expected: No results (or only in docs/plans/comments).

- [ ] **Step 3: Run full verification checklist**

1. Upload an image -- timeline appears
2. Add animation preset -- clip renders with custom appearance
3. Drag clip -- position updates correctly
4. Resize clip -- duration updates correctly
5. Delete clip (hover delete button) -- clip removed
6. Press Play -- animation plays, cursor moves
7. Press Pause -- animation stops, cursor holds position
8. Scrub cursor -- 3D transform updates in real-time
9. Toggle loop -- looping behavior works
10. Adjust duration slider -- timeline duration changes
11. Ctrl/Cmd + scroll -- zoom works
12. Add multiple slides -- media row shows all slides
13. Click slide -- active slide switches
14. Export video -- export works correctly (uses store values, not library)
15. Close and reopen timeline -- state preserved

- [ ] **Step 4: Run lint**

```bash
pnpm lint
```

Fix any lint errors.

- [ ] **Step 5: Final commit**

```bash
git add -u
git commit -m "chore: clean up dead code after timeline editor library migration"
```

---

## Compatibility Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `react-virtualized` CJS breaks Vite bundling | Medium | Add to `optimizeDeps.include` in vite config |
| React 19 incompatibility | Low | Library uses standard React APIs; test in Task 1 |
| React Compiler breaks library internals | Low-Medium | Add library to compiler exclusion list if needed |
| Library cursor and our playhead desync | Low | One-directional sync: our playhead -> library cursor via `setTime()` |
| Library `onChange` fires during our playback | Medium | Guard: ignore `onChange` while `isPlaying` is true |

## What We Gain

- **Drag-line alignment** between clips across tracks
- **Virtual scrolling** for future multi-track scenarios
- **Robust drag/resize** (replaces hand-rolled mousemove tracking)
- **Built-in snap-to-grid** via `gridSnap` prop
- **Scale/zoom** handled by library (consistent with `scaleWidth` prop)
- **~300 lines of custom drag/resize/playhead code removed**

## What We Keep

- `TimelineControls.tsx` -- our play/pause/loop/add buttons
- `useTimelinePlayback.tsx` -- our rAF animation loop + interpolation engine
- `TimelineTrack.tsx` + `KeyframeMarker.tsx` -- keyframe editing in detail panels
- All Zustand store methods -- source of truth for clip state
- `lib/animation/interpolation.ts` -- the interpolation engine
