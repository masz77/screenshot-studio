# Timeline Player Improvements — Implementation Plan

**Goal:** Polish the timeline player so it stops getting in the way of editing. Disable text-selection noise, add tooltips and a row legend, embed a per-property keyframe editor (animation-timeline-js) in a side sheet, auto-fit zoom to container width, and ship a handful of small UX fixes (bulk-apply preset, in/out color split, persisted state, keyboard shortcut hints, sticky time readout).

**Architecture:** This is purely a frontend change. State lives in `useImageStore` (Zustand). Two new store fields (`timeline.fitMode`, `slides[*].inCustomTracks`/`outCustomTracks`) extend existing types. Playback (`lib/animation/build-playback-data.ts`) is extended to prefer custom tracks over preset tracks when present. The keyframe editor opens in a `<Sheet>` (shadcn) on chip double-click — it does **not** embed inside `react-timeline-editor` chips to avoid nested-timeline conflicts. A new `TimelineRowLegend` component renders a left gutter alongside the existing `<Timeline>` to label rows.

**Tech Stack:** React 19 (Compiler enabled — no manual `useMemo`/`useCallback` for trivial cases), TypeScript 5.9 strict, Tailwind 4 (theme tokens only — `bg-background`, `text-foreground`, etc. — no hardcoded colors), Zustand + Zundo, `@xzdarcy/react-timeline-editor` (existing), `animation-timeline-js` (new), `hugeicons-react` (existing icon lib in this project — keep using it for consistency, even though `_shared/.claude/rules/icons.md` says phosphor; this codebase already standardised on hugeicons).

**Test framework:** None configured in this project (CLAUDE.md confirms). Each task uses **manual verification with concrete repro steps** instead of failing-test-first. Run `pnpm dev`, exercise the steps, confirm expected output. After each task: `pnpm lint && pnpm build` must pass before commit.

**Worktree:** Run this plan in an isolated worktree (the brainstorming skill should have created one already). If not, create one before Task 1.

---

## File Map

### New files
- `components/timeline/TimelineRowLegend.tsx` — left gutter legend (Task 3)
- `components/timeline/KeyframeEditorSheet.tsx` — keyframe editor in a Sheet (Task 4)
- `components/timeline/hooks/useTimelineAutoFit.ts` — ResizeObserver-driven zoom calc (Task 5)

### Modified files
- `app/globals.css` — `select-none` rule scoped to `.timeline-editor-wrapper` (Task 1); persisted state CSS none needed
- `components/timeline/TimelineEditor.tsx` — wire legend, autofit, keyboard shortcuts, sheet host, onDoubleClickAction (Tasks 3, 4, 5, 9)
- `components/timeline/TimelineControls.tsx` — wrap controls with `<Tooltip>`; add Fit-to-width toggle button + sticky-time toggle (Tasks 2, 5, 10)
- `components/timeline/AnimationPresetGallery.tsx` — "Apply to all slides" button (Task 6)
- `components/timeline/renderers/SlotRenderer.tsx` — color-split In vs Out, double-click → open editor, tooltips (Tasks 2, 4, 7)
- `components/timeline/renderers/MediaClipRenderer.tsx` — `select-none` propagation (Task 1)
- `lib/store/index.ts` — add `timeline.fitMode`, `slides[*].inCustomTracks`/`outCustomTracks`; add `setSlideCustomTracks`, `clearSlideCustomTracks`, `applyPresetToAllSlides`; persist `timeline.zoom`, `timeline.fitMode`, panel-height to localStorage (Tasks 4, 5, 6, 8)
- `lib/timeline/adapters.ts` — extend `Slide` interface with custom-track fields (Task 4)
- `lib/animation/build-playback-data.ts` — prefer custom tracks when present (Task 4)
- `package.json` — add `animation-timeline-js` (Task 4)

---

## Task Order Rationale

The order is **2 → 3 → 4 → keyframe-editor → 1 → A → D → C → E → B** mapped to:

1. Disable text selection (was item 2)
2. Tooltip pass (was item 3)
3. Row legend (was item 4)
4. Keyframe editor sheet (the embedded-`animation-timeline-js` task)
5. Auto-fit zoom (was item 1)
6. Apply-to-all-slides bulk action (was item A)
7. Color-split In vs Out chips (was item D)
8. Persist zoom + panel height to localStorage (was item C)
9. Keyboard shortcuts + tooltip hints (was item E)
10. Sticky time readout near playhead (was item B)

Reasoning: small UX fixes first to clear paper-cuts; legend before keyframe editor so the new sheet opens *into* labeled rows; keyframe editor before autofit because row heights become dynamic; bulk-apply early since it's a high-traffic action; color split bundled near the keyframe-editor work since both touch `SlotRenderer`; persistence after autofit so we know what to persist; keyboard shortcuts last because they reuse tooltips already added.

---

## Task 1: Disable text selection in the timeline player

**Files:**
- Modify: `app/globals.css` — add a scoped `user-select: none` rule for the timeline wrapper
- Modify: `components/timeline/renderers/MediaClipRenderer.tsx:18` — add `select-none` to outer wrapper (defensive)
- Modify: `components/timeline/renderers/SlotRenderer.tsx:31` — add `select-none` to outer wrapper (defensive)

- [ ] **Step 1.1: Add a scoped CSS rule**

In `app/globals.css`, find the `/* ── @xzdarcy/react-timeline-editor overrides ─── */` block (around line 349) and append:

```css
/* Disable text selection across the entire timeline player —
   prevents accidental highlighting of slide names, chip labels,
   and ruler ticks during scrubbing. */
.timeline-editor-wrapper,
.timeline-editor-wrapper * {
  user-select: none;
  -webkit-user-select: none;
}
```

- [ ] **Step 1.2: Belt-and-braces on renderers**

In `components/timeline/renderers/MediaClipRenderer.tsx:18`, replace the className:

```tsx
className={cn(
  'relative w-full h-full cursor-pointer group/clip select-none',
  isActive && slidesCount > 1 && 'ring-1 ring-inset ring-primary/50',
)}
```

In `components/timeline/renderers/SlotRenderer.tsx:31`:

```tsx
<div className="flex w-full h-full gap-px select-none">
```

- [ ] **Step 1.3: Manual verification**

Run `pnpm dev`, open the editor with at least 2 slides + a frame visible.

- Click and drag across "Slide 1", "iiamtit04…", and "+ Out" labels. **Expected:** no blue highlight appears; no text becomes selected. (Before the change, dragging across them produced a text selection.)
- Click and drag the playhead. **Expected:** smooth scrubbing, no text selection caught up in the drag.
- Right-click a label. **Expected:** browser context menu still appears (we only disabled selection, not context).

- [ ] **Step 1.4: Lint + build**

```bash
pnpm lint && pnpm build
```

Both must pass with zero errors.

- [ ] **Step 1.5: Commit**

```bash
git add app/globals.css components/timeline/renderers/MediaClipRenderer.tsx components/timeline/renderers/SlotRenderer.tsx
git commit -m "fix(timeline): disable text selection across the player"
```

---

## Task 2: Tooltip pass on TimelineControls and SlotRenderer

**Files:**
- Modify: `components/timeline/TimelineControls.tsx` — wrap each interactive button in `<Tooltip>` from `@/components/ui/tooltip`
- Modify: `components/timeline/renderers/SlotRenderer.tsx` — wrap the In/Out chips with `<Tooltip>`

- [ ] **Step 2.1: Wrap TimelineControls buttons**

Replace the entire return of `TimelineControls` (`components/timeline/TimelineControls.tsx`) with the version below. The structure is unchanged; each `<button>` is wrapped in `<Tooltip>` and the `title=""` attributes are removed (tooltips handle that now).

```tsx
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const { timeline, togglePlayback, setTimeline, setTimelineDuration } =
    useImageStore();

  const { isPlaying, isLooping, playhead, duration } = timeline;
  const handleToggleLoop = () => setTimeline({ isLooping: !isLooping });
  const durationSeconds = duration / 1000;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center px-3 py-2 bg-card border-b border-border/30 shrink-0">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-full transition-colors',
                  isLooping
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                onClick={handleToggleLoop}
              >
                {isLooping ? <RepeatIcon size={16} /> : <RepeatOffIcon size={16} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isLooping ? 'Loop enabled — playback repeats' : 'Loop disabled — playback stops at end'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Center section */}
        <div className="flex-1 flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="h-10 min-w-[100px] flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                onClick={togglePlayback}
              >
                {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {formatTimeDisplay(playhead)}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums ml-0.5">
              {' '}/ {formatTimeDisplay(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={durationSeconds}
                  onChange={(e) =>
                    setTimelineDuration(Number(e.target.value) * 1000)
                  }
                  aria-label="Total timeline duration in seconds"
                  className="w-[100px] h-1 appearance-none bg-border/40 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Total duration: {durationSeconds}s. Drag to change.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={
                    timeline.zoom !== 1 ? 'Reset zoom to 100%' : 'Current zoom level'
                  }
                  onClick={() => setTimeline({ zoom: 1 })}
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors',
                    timeline.zoom !== 1
                      ? 'text-primary hover:bg-primary/10 cursor-pointer'
                      : 'text-muted-foreground cursor-default'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                    <path fill="currentColor" d="M2 10.026c0 4.429 3.601 8.022 8.03 8.022a7.9 7.9 0 0 0 4.738-1.565l5.17 5.184c.213.208.491.313.782.313.634 0 1.072-.48 1.072-1.094 0-.292-.115-.557-.3-.764L16.34 14.96a7.93 7.93 0 0 0 1.708-4.934C18.048 5.601 14.455 2 10.03 2 5.601 2 2 5.601 2 10.026m1.532 0a6.497 6.497 0 0 1 6.498-6.494 6.5 6.5 0 0 1 6.494 6.494c0 3.581-2.917 6.498-6.494 6.498a6.503 6.503 0 0 1-6.498-6.498m3.177 0c0 .368.297.661.67.661h1.982v1.978c0 .377.292.674.669.67a.66.66 0 0 0 .661-.67v-1.978h1.974a.662.662 0 1 0 0-1.326h-1.974V7.379a.664.664 0 1 0-1.33 0v1.982H7.379a.66.66 0 0 0-.67.665" />
                  </svg>
                  <span className="text-[10px] font-medium tabular-nums">{Math.round(timeline.zoom * 100)}%</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {timeline.zoom !== 1
                  ? `Zoom: ${Math.round(timeline.zoom * 100)}% — click to reset`
                  : 'Zoom: 100%. Ctrl+wheel to zoom.'}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border/40" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Close timeline"
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Cancel01Icon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close timeline (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2.2: Wrap SlotRenderer chips**

In `components/timeline/renderers/SlotRenderer.tsx`, import the tooltip primitives at the top:

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
```

Replace the return statement with this (each `<button>` chip wrapped):

```tsx
return (
  <TooltipProvider delayDuration={300}>
    <div className="flex w-full h-full gap-px select-none">
      {/* In slot (50%) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex-1 flex items-center gap-1 px-2 rounded-l-lg overflow-hidden transition-all',
              inPreset
                ? 'bg-primary/15 border border-primary/30'
                : 'bg-muted/30 border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5',
              isInSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-card'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSlotClick(action.slideId, 'in');
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
                    e.stopPropagation();
                    onClearSlot(action.slideId, 'in');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Remove entrance animation"
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
        </TooltipTrigger>
        <TooltipContent side="top">
          {inPreset
            ? `Entrance: ${inPreset.name}. Double-click to edit keyframes.`
            : 'Click to add an entrance animation.'}
        </TooltipContent>
      </Tooltip>

      {/* Out slot (50%) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex-1 flex items-center gap-1 px-2 rounded-r-lg overflow-hidden transition-all',
              outPreset
                ? 'bg-primary/15 border border-primary/30'
                : 'bg-muted/30 border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5',
              isOutSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-card'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSlotClick(action.slideId, 'out');
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
                    e.stopPropagation();
                    onClearSlot(action.slideId, 'out');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Remove exit animation"
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
        </TooltipTrigger>
        <TooltipContent side="top">
          {outPreset
            ? `Exit: ${outPreset.name}. Double-click to edit keyframes.`
            : 'Click to add an exit animation.'}
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);
```

- [ ] **Step 2.3: Manual verification**

Run `pnpm dev`, hover each control:

- Loop button → "Loop enabled/disabled — …"
- Play button → "Play (Space)" / "Pause (Space)"
- Duration slider → "Total duration: Xs. Drag to change."
- Zoom % button → "Zoom: …% — click to reset" or "Zoom: 100%. Ctrl+wheel to zoom."
- Close button → "Close timeline (Esc)"
- Slot chip (empty) → "Click to add an entrance animation."
- Slot chip (filled) → "Entrance: Hero Landing. Double-click to edit keyframes."

All tooltips must appear with ~200–300ms delay, position correctly, and not flicker.

- [ ] **Step 2.4: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 2.5: Commit**

```bash
git add components/timeline/TimelineControls.tsx components/timeline/renderers/SlotRenderer.tsx
git commit -m "feat(timeline): add tooltip pass to controls and slot chips"
```

---

## Task 3: Row legend (left gutter explainer)

**Files:**
- Create: `components/timeline/TimelineRowLegend.tsx`
- Modify: `components/timeline/TimelineEditor.tsx` — render legend alongside `<Timeline>` in a flex row

> **Note on row alignment:** `@xzdarcy/react-timeline-editor` adds ~10px of margin-top to `.timeline-editor-edit-area` (the rows container) below its 32px scale row. The spacer below pads for that combined offset (32 + 10 = 42).

- [ ] **Step 3.1: Create the legend component**

Create `components/timeline/TimelineRowLegend.tsx`:

```tsx
'use client';

import * as React from 'react';
import { VideoReplayIcon, Image01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

const LEGEND_WIDTH = 140;
const RULER_OFFSET = 42; // 32px scale row + 10px edit-area top margin

interface RowSpec {
  id: string;
  height: number;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accentClass: string;
}

interface TimelineRowLegendProps {
  rows: RowSpec[];
  className?: string;
}

export function TimelineRowLegend({ rows, className }: TimelineRowLegendProps) {
  return (
    <div
      className={cn(
        'shrink-0 border-r border-border/30 bg-card/50 select-none',
        className
      )}
      style={{ width: LEGEND_WIDTH }}
    >
      {/* Spacer matching the ruler row inside Timeline */}
      <div style={{ height: RULER_OFFSET }} className="border-b border-border/20" />

      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-2 px-3 border-b border-border/15"
          style={{ height: row.height }}
        >
          <span className={cn('shrink-0', row.accentClass)}>{row.icon}</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-foreground truncate">
              {row.label}
            </span>
            <span className="text-[9px] text-muted-foreground truncate leading-tight">
              {row.hint}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const TIMELINE_LEGEND_ROWS = (rowHeights: {
  animation: number;
  media: number;
}): RowSpec[] => [
  {
    id: 'animation',
    height: rowHeights.animation,
    label: 'Motion',
    hint: 'Entrance & exit per slide. Click + In / + Out.',
    icon: <VideoReplayIcon size={14} />,
    accentClass: 'text-primary',
  },
  {
    id: 'media',
    height: rowHeights.media,
    label: 'Slides',
    hint: 'Order, duration. Drag edges to retime.',
    icon: <Image01Icon size={14} />,
    accentClass: 'text-foreground/70',
  },
];

export const TIMELINE_LEGEND_WIDTH = LEGEND_WIDTH;
```

- [ ] **Step 3.2: Wire legend into TimelineEditor**

In `components/timeline/TimelineEditor.tsx`, add the import near the other timeline imports:

```tsx
import {
  TimelineRowLegend,
  TIMELINE_LEGEND_ROWS,
  TIMELINE_LEGEND_WIDTH,
} from '@/components/timeline/TimelineRowLegend';
```

Find the JSX block that renders `<Timeline>` (lines ~318–339). Wrap the `<Timeline>` in a flex row with the legend on the left. Replace:

```tsx
{/* Timeline area */}
<div ref={scrollContainerRef} className="flex-1 overflow-hidden">
  <Timeline
    ref={timelineRef}
    editorData={editorData as TimelineRowBase[]}
    ...
    style={{ width: '100%', height: '100%' }}
  />
</div>
```

with:

```tsx
{/* Timeline area */}
<div className="flex-1 flex overflow-hidden">
  <TimelineRowLegend
    rows={TIMELINE_LEGEND_ROWS({
      animation:
        editorData.find((r) => r.id === ANIMATION_ROW_ID)?.rowHeight ?? 48,
      media: editorData.find((r) => r.id === MEDIA_ROW_ID)?.rowHeight ?? 56,
    }).filter((r) =>
      // hide animation row when there are no slides yet
      r.id === 'animation'
        ? editorData.some((row) => row.id === ANIMATION_ROW_ID)
        : true
    )}
  />
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
```

Note: `TIMELINE_LEGEND_WIDTH` is exported in case Task 5 (autofit) needs to subtract it from the container width when computing zoom.

- [ ] **Step 3.3: Manual verification**

Run `pnpm dev`, open the editor with at least 1 slide.

- **Expected:** A 140px gutter appears on the left of the timeline area. Top spacer aligns with the ruler. Below it, two labeled rows: "Motion — Entrance & exit per slide. Click + In / + Out." (primary-coloured icon) and "Slides — Order, duration. Drag edges to retime." (muted icon). Row heights match the right-side rows precisely (48px animation, 56px media).
- With **zero** slides, the Motion legend row should not render (only Slides) — matches the existing logic where `slotActions.length === 0` skips that row.
- Resize the timeline panel via the top drag handle. **Expected:** legend stays aligned with the rows on the right (no drift).

- [ ] **Step 3.4: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 3.5: Commit**

```bash
git add components/timeline/TimelineRowLegend.tsx components/timeline/TimelineEditor.tsx
git commit -m "feat(timeline): add labelled row legend to the left of the player"
```

---

## Task 4: Embed animation-timeline-js in a side sheet (per-property keyframe editor)

This task introduces a per-slot, per-property keyframe editor. Open the editor by **double-clicking a filled slot chip**. It opens in a `<Sheet>` from the right. Inside, `animation-timeline-js` renders a row per track with draggable keyframes. Edits write to a new per-slide `customInTracks` / `customOutTracks` field. Playback prefers custom tracks when present; "Reset to preset" clears them.

- [ ] **Step 4.1: Install animation-timeline-js**

```bash
pnpm add animation-timeline-js
```

Verify it landed in `package.json` `dependencies`. (Lock file: pnpm.) The package exposes a non-React API (`Timeline`, `TimelineModel`, etc.); we'll wrap it in a React component manually.

- [ ] **Step 4.2: Extend Slide type with custom tracks**

In `lib/timeline/adapters.ts:46-53`, replace the `Slide` interface:

```tsx
import type { AnimationTrack } from '@/types/animation';

export interface Slide {
  id: string;
  src: string;
  name: string | null;
  duration: number;
  inPresetId: string | null;
  outPresetId: string | null;
  inCustomTracks: AnimationTrack[] | null;
  outCustomTracks: AnimationTrack[] | null;
}
```

- [ ] **Step 4.3: Extend store Slide type and actions**

In `lib/store/index.ts`, find the existing `Slide` type/interface and the slide-creation site (line ~1378 — the place that initialises `inPresetId: null` for a new slide). Add `inCustomTracks: null` and `outCustomTracks: null` next to it everywhere a new slide is constructed (search for `inPresetId: null,` — there are two sites at ~1378 and ~1523).

Add three new actions next to `setSlideInPreset` / `setSlideOutPreset` (line ~1530). Reference shape (paste the actual variants matching the surrounding code style):

```ts
setSlideCustomTracks: (
  slideId: string,
  slot: 'in' | 'out',
  tracks: AnimationTrack[] | null,
) => {
  set((state) => ({
    slides: state.slides.map((s) =>
      s.id === slideId
        ? {
            ...s,
            ...(slot === 'in'
              ? { inCustomTracks: tracks }
              : { outCustomTracks: tracks }),
          }
        : s,
    ),
  }));
},

clearSlideCustomTracks: (slideId: string, slot: 'in' | 'out') => {
  set((state) => ({
    slides: state.slides.map((s) =>
      s.id === slideId
        ? {
            ...s,
            ...(slot === 'in'
              ? { inCustomTracks: null }
              : { outCustomTracks: null }),
          }
        : s,
    ),
  }));
},
```

Add corresponding types to the store interface (around line ~612 where `randomizeMotion` is declared):

```ts
setSlideCustomTracks: (
  slideId: string,
  slot: 'in' | 'out',
  tracks: AnimationTrack[] | null,
) => void;
clearSlideCustomTracks: (slideId: string, slot: 'in' | 'out') => void;
```

- [ ] **Step 4.4: Extend buildPlaybackData to use custom tracks when present**

In `lib/animation/build-playback-data.ts`, extend `SlideInput` and the loop:

```ts
import type { AnimationClip, AnimationTrack } from '@/types/animation';
import { getSlideAnimationTiming } from '@/lib/animation/config';
import { getAnyPresetById } from '@/lib/animation/exit-presets';
import { clonePresetTracks } from '@/lib/animation/presets';

interface SlideInput {
  id: string;
  duration: number;
  inPresetId: string | null;
  outPresetId: string | null;
  inCustomTracks: AnimationTrack[] | null;
  outCustomTracks: AnimationTrack[] | null;
}

function offsetTracks(
  tracks: AnimationTrack[],
  startMs: number,
  clipId: string,
): AnimationTrack[] {
  return tracks.map((track) => ({
    ...track,
    clipId,
    keyframes: track.keyframes.map((kf) => ({
      ...kf,
      time: kf.time + startMs,
    })),
  }));
}

export function buildPlaybackData(
  slides: SlideInput[],
  defaultDuration: number,
): { clips: AnimationClip[]; tracks: AnimationTrack[] } {
  const clips: AnimationClip[] = [];
  const tracks: AnimationTrack[] = [];
  let slideStartMs = 0;

  for (const slide of slides) {
    const slideDurationMs = (slide.duration || defaultDuration) * 1000;
    const timing = getSlideAnimationTiming(slideDurationMs);

    // ── In ──
    if (slide.inCustomTracks && slide.inCustomTracks.length > 0) {
      const clipId = `playback-in-${slide.id}`;
      clips.push({
        id: clipId,
        presetId: 'custom',
        name: 'Custom (In)',
        startTime: slideStartMs,
        duration: timing.inMs,
        color: '#10B981',
      });
      tracks.push(...offsetTracks(slide.inCustomTracks, slideStartMs, clipId));
    } else if (slide.inPresetId) {
      const preset = getAnyPresetById(slide.inPresetId);
      if (preset) {
        const clipId = `playback-in-${slide.id}`;
        clips.push({
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: slideStartMs,
          duration: timing.inMs,
          color: '#10B981',
        });
        tracks.push(
          ...clonePresetTracks(preset, { startTime: slideStartMs, clipId }),
        );
      }
    }

    // ── Out ──
    if (slide.outCustomTracks && slide.outCustomTracks.length > 0) {
      const outStartMs = slideStartMs + slideDurationMs - timing.outMs;
      const clipId = `playback-out-${slide.id}`;
      clips.push({
        id: clipId,
        presetId: 'custom',
        name: 'Custom (Out)',
        startTime: outStartMs,
        duration: timing.outMs,
        color: '#10B981',
      });
      tracks.push(...offsetTracks(slide.outCustomTracks, outStartMs, clipId));
    } else if (slide.outPresetId) {
      const preset = getAnyPresetById(slide.outPresetId);
      if (preset) {
        const outStartMs = slideStartMs + slideDurationMs - timing.outMs;
        const clipId = `playback-out-${slide.id}`;
        clips.push({
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: outStartMs,
          duration: timing.outMs,
          color: '#10B981',
        });
        tracks.push(
          ...clonePresetTracks(preset, { startTime: outStartMs, clipId }),
        );
      }
    }

    slideStartMs += slideDurationMs;
  }

  return { clips, tracks };
}

export function hasAnySlideAnimations(slides: SlideInput[]): boolean {
  return slides.some(
    (s) =>
      s.inPresetId !== null ||
      s.outPresetId !== null ||
      (s.inCustomTracks?.length ?? 0) > 0 ||
      (s.outCustomTracks?.length ?? 0) > 0,
  );
}
```

- [ ] **Step 4.5: Create the keyframe editor sheet**

Create `components/timeline/KeyframeEditorSheet.tsx`:

```tsx
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
  const presetId = slide && slot === 'in' ? slide.inPresetId : slide?.outPresetId ?? null;
  const customTracks = slide && slot === 'in' ? slide.inCustomTracks : slide?.outCustomTracks ?? null;

  // Compute the working tracks: prefer custom, otherwise fall back to preset clone.
  const workingTracks: AnimationTrack[] | null = React.useMemo(() => {
    if (!slide || !slot) return null;
    if (customTracks && customTracks.length > 0) return customTracks;
    if (!presetId) return null;
    const preset = getAnyPresetById(presetId);
    if (!preset) return null;
    return clonePresetTracks(preset, { clipId: `kf-${slide.id}-${slot}` });
  }, [slide, slot, customTracks, presetId]);

  // Mount the animation-timeline-js instance when the sheet opens.
  React.useEffect(() => {
    if (!open || !containerRef.current || !workingTracks) return;

    const tl = new KFTimeline({ id: containerRef.current });
    tl.setModel(tracksToModel(workingTracks));
    timelineRef.current = tl;

    const handleChange = () => {
      if (!slideId || !slot) return;
      const model = tl.getModel();
      const next = modelToTracks(model, workingTracks);
      setSlideCustomTracks(slideId, slot, next);
    };

    tl.on('timeChanged', handleChange);
    tl.on('keyframeChanged', handleChange);

    return () => {
      tl.off('timeChanged', handleChange);
      tl.off('keyframeChanged', handleChange);
      tl.dispose?.();
      timelineRef.current = null;
    };
  }, [open, workingTracks, slideId, slot, setSlideCustomTracks]);

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
```

> **Note on `animation-timeline-js` API:** the package exposes `Timeline`, `TimelineModel`, and event names `timeChanged` / `keyframeChanged` (verify against the lib's README at `node_modules/animation-timeline-js/README.md` after install — adjust event names if different). The `tracksToModel` ↔ `modelToTracks` helpers are intentionally simple (preserve keyframe count & properties, only sync `time`). If the lib emits a different event or shape, adjust those two helpers.

- [ ] **Step 4.6: Wire double-click in TimelineEditor**

In `components/timeline/TimelineEditor.tsx`:

1. Add state for the editor sheet near the existing `useState`:

```tsx
const [editorTarget, setEditorTarget] =
  React.useState<{ slideId: string; slot: 'in' | 'out' } | null>(null);
```

2. Add a handler for double-click:

```tsx
const handleDoubleClickAction = React.useCallback(
  (_e: React.MouseEvent, params: { action: TimelineActionBase; row: TimelineRowBase }) => {
    if (params.row.id !== ANIMATION_ROW_ID) return;
    // The slot click target is passed via the chip's data; use the underlying selectedSlot
    // logic by inferring from click position would be brittle — instead, rely on the
    // chip-level handler in SlotRenderer (see step 4.7).
  },
  [],
);
```

Skip wiring `onDoubleClickAction` at the Timeline level — chip-level handling in SlotRenderer (next step) is more reliable because each chip is its own DOM node.

3. Add the import and render the sheet at the bottom of the wrapper, just before the closing `</div>`:

```tsx
import { KeyframeEditorSheet } from '@/components/timeline/KeyframeEditorSheet';
```

```tsx
<KeyframeEditorSheet
  open={editorTarget !== null}
  onOpenChange={(open) => !open && setEditorTarget(null)}
  slideId={editorTarget?.slideId ?? null}
  slot={editorTarget?.slot ?? null}
/>
```

4. Pass `setEditorTarget` into `SlotRenderer` via `getActionRender`. Find the existing `getActionRender` in `TimelineEditor.tsx` and add `onSlotDoubleClick` prop to the slot variant:

```tsx
<SlotRenderer
  action={slotAction}
  selectedSlot={selectedSlot}
  onSlotClick={handleSlotClick}
  onClearSlot={handleClearSlot}
  onSlotDoubleClick={(slideId, slot) => setEditorTarget({ slideId, slot })}
/>
```

- [ ] **Step 4.7: Add double-click handler to SlotRenderer**

Update the `SlotRendererProps` interface (top of `components/timeline/renderers/SlotRenderer.tsx`):

```tsx
interface SlotRendererProps {
  action: SlotAction;
  selectedSlot: { slideId: string; slot: 'in' | 'out' } | null;
  onSlotClick: (slideId: string, slot: 'in' | 'out') => void;
  onClearSlot: (slideId: string, slot: 'in' | 'out') => void;
  onSlotDoubleClick?: (slideId: string, slot: 'in' | 'out') => void;
}
```

In each `<button>` chip (In and Out), add:

```tsx
onDoubleClick={(e) => {
  e.stopPropagation();
  if (inPreset) onSlotDoubleClick?.(action.slideId, 'in');
}}
```

(For the Out chip, replace `inPreset` with `outPreset` and `'in'` with `'out'`.)

Only fire when a preset is set — double-clicking an empty chip should still single-click-add a preset, not open an editor with nothing in it.

- [ ] **Step 4.8: Manual verification**

Run `pnpm dev`, ensure at least one slide has a "Hero Landing" entrance applied (use the Motion randomize button or pick from the gallery).

- Hover the In chip — tooltip says "Entrance: Hero Landing. Double-click to edit keyframes."
- Double-click the In chip — the right-side sheet slides in. Title: "Entrance keyframes — <slide name>". Description: "Based on preset: Hero Landing. …"
- The body shows `animation-timeline-js` rendered with one row per track. For Hero Landing that means 2 rows ("Hero Landing" transform, "Hero Landing Fade" opacity) with keyframes at 0, 600, and 1200ms.
- Drag a keyframe horizontally — its position updates. Close the sheet, play the timeline. **Expected:** the entrance plays with the new timing.
- Reopen the sheet — the moved keyframe is still in the new position (persisted to `inCustomTracks`).
- Click "Reset to preset" — keyframes snap back to the preset positions; sheet closes/refreshes; play again confirms the preset is back.
- Open a chip that has no preset assigned — single click still works as before (selects the slot for preset-pick mode). Double-click does nothing (no preset to edit).

- [ ] **Step 4.9: Lint + build**

```bash
pnpm lint && pnpm build
```

If TypeScript complains about `animation-timeline-js` types, add a minimal declaration in a new file `types/animation-timeline-js.d.ts`:

```ts
declare module 'animation-timeline-js';
```

Only fall back to this if the package ships no types; otherwise prefer the real types.

- [ ] **Step 4.10: Commit**

```bash
git add package.json pnpm-lock.yaml bun.lock lib/store/index.ts lib/timeline/adapters.ts lib/animation/build-playback-data.ts components/timeline/KeyframeEditorSheet.tsx components/timeline/TimelineEditor.tsx components/timeline/renderers/SlotRenderer.tsx types/animation-timeline-js.d.ts
git commit -m "feat(timeline): per-property keyframe editor in side sheet (animation-timeline-js)"
```

---

## Task 5: Auto-fit zoom to container width

**Files:**
- Create: `components/timeline/hooks/useTimelineAutoFit.ts`
- Modify: `lib/store/index.ts` — add `timeline.fitMode: 'fit' | 'manual'`, default `'fit'`
- Modify: `components/timeline/TimelineEditor.tsx` — call hook, switch to `'manual'` on Ctrl+wheel
- Modify: `components/timeline/TimelineControls.tsx` — add Fit-to-width toggle button

- [ ] **Step 5.1: Add fitMode to the store**

In `lib/store/index.ts`, find the `timeline` slice initial state (search `playhead: 0` to locate it) and add `fitMode: 'fit'` to the initial state. Add the type to whatever `Timeline` interface exists. Keep `zoom` separately — `fitMode === 'fit'` means "compute zoom from container width on every layout change"; `'manual'` means "user owns zoom."

- [ ] **Step 5.2: Create the autofit hook**

Create `components/timeline/hooks/useTimelineAutoFit.ts`:

```tsx
import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { TIMELINE_LEGEND_WIDTH } from '@/components/timeline/TimelineRowLegend';

const SCALE_WIDTH = 160; // matches TimelineEditor.tsx
const START_LEFT = 120;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export function useTimelineAutoFit(
  scrollContainerRef: React.RefObject<HTMLDivElement>,
) {
  const fitMode = useImageStore((s) => s.timeline.fitMode);
  const durationMs = useImageStore((s) => s.timeline.duration);
  const slidesLength = useImageStore((s) => s.slides.length);
  const setTimeline = useImageStore((s) => s.setTimeline);

  React.useEffect(() => {
    if (fitMode !== 'fit') return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const recompute = () => {
      const rect = el.getBoundingClientRect();
      const usable =
        rect.width - TIMELINE_LEGEND_WIDTH - START_LEFT - 16 /* slack */;
      const durationSec = durationMs / 1000;
      if (usable <= 0 || durationSec <= 0) return;
      const desiredZoom = usable / (durationSec * SCALE_WIDTH);
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, desiredZoom));
      setTimeline({ zoom: Number(clamped.toFixed(3)) });
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitMode, durationMs, slidesLength, setTimeline, scrollContainerRef]);
}
```

- [ ] **Step 5.3: Use the hook + auto-disable on manual zoom**

In `components/timeline/TimelineEditor.tsx`:

```tsx
import { useTimelineAutoFit } from '@/components/timeline/hooks/useTimelineAutoFit';
```

Call it after `useTimelinePlayback()`:

```tsx
useTimelinePlayback();
useTimelineAutoFit(scrollContainerRef);
```

Find the Ctrl+wheel zoom handler (around line 240). When the user zooms manually, switch `fitMode` to `'manual'`:

```tsx
const currentZoom = useImageStore.getState().timeline.zoom;
const newZoom = ...; // existing calc
setTimeline({ zoom: newZoom, fitMode: 'manual' });
```

- [ ] **Step 5.4: Add Fit-to-width button in TimelineControls**

In `components/timeline/TimelineControls.tsx`, just left of the zoom % button, add another `<Tooltip>`-wrapped button:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      aria-label="Fit timeline to width"
      onClick={() => setTimeline({ fitMode: 'fit' })}
      className={cn(
        'h-7 px-2 rounded text-[10px] font-medium transition-colors',
        timeline.fitMode === 'fit'
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      Fit
    </button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    {timeline.fitMode === 'fit'
      ? 'Auto-fit on. Ctrl+wheel zooms manually.'
      : 'Click to auto-fit timeline to panel width.'}
  </TooltipContent>
</Tooltip>
```

- [ ] **Step 5.5: Manual verification**

Run `pnpm dev`, open editor with 3 slides at 6s each (total 18s).

- **On open:** the timeline fills the entire visible width — first ruler tick at left, last second at right edge. Fit button is highlighted (`bg-primary/15`).
- Resize the editor panel by dragging the top edge. **Expected:** zoom recomputes — timeline always fills width, no horizontal scrollbar.
- Add another slide. **Expected:** zoom shrinks so all 4 slides fit.
- Ctrl+wheel up to zoom in. **Expected:** Fit button loses highlight, zoom % changes, horizontal scrollbar appears.
- Click Fit button. **Expected:** Fit highlights again, zoom recomputes to fit-width.

- [ ] **Step 5.6: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 5.7: Commit**

```bash
git add components/timeline/hooks/useTimelineAutoFit.ts components/timeline/TimelineEditor.tsx components/timeline/TimelineControls.tsx lib/store/index.ts
git commit -m "feat(timeline): auto-fit zoom to container width with manual override"
```

---

## Task 6: "Apply to all slides" bulk action in the preset gallery

**Files:**
- Modify: `lib/store/index.ts` — add `applyPresetToAllSlides(presetId, slot)`
- Modify: `components/timeline/AnimationPresetGallery.tsx` — add bulk-apply button next to each preset card

- [ ] **Step 6.1: Add the store action**

In `lib/store/index.ts`, near `randomizeMotion`:

```ts
applyPresetToAllSlides: (presetId: string, slot: 'in' | 'out') => {
  set((state) => ({
    slides: state.slides.map((s) =>
      slot === 'in'
        ? { ...s, inPresetId: presetId, inCustomTracks: null }
        : { ...s, outPresetId: presetId, outCustomTracks: null },
    ),
  }));
},
```

(Custom tracks are cleared so the bulk apply doesn't leave stale per-slot overrides.) Add to interface:

```ts
applyPresetToAllSlides: (presetId: string, slot: 'in' | 'out') => void;
```

- [ ] **Step 6.2: Restructure the preset card and add the button**

Open `components/timeline/AnimationPresetGallery.tsx`. The existing preset cards are rendered as `<button>` elements (around line 159). Putting another `<button>` inside produces invalid HTML and React hydration warnings.

**Fix in two parts:**

1. Convert the parent card from `<button>` to a `<div>` with click + keyboard handlers — this lets us nest the bulk-apply button inside it:

```tsx
<div
  role="button"
  tabIndex={0}
  className="group/preset relative ... /* keep existing classes */"
  onClick={() => handleSelectPreset(preset.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectPreset(preset.id);
    }
  }}
>
  ...existing card content...
</div>
```

2. Add the bulk-apply pill as a sibling button inside the card:

```tsx
<button
  type="button"
  className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/90 text-primary-foreground opacity-0 group-hover/preset:opacity-100 transition-opacity hover:bg-primary"
  onClick={(e) => {
    e.stopPropagation();
    applyPresetToAllSlides(preset.id, effectiveSlot);
  }}
  aria-label="Apply this preset to all slides"
>
  All
</button>
```

**Resolve `effectiveSlot`** in the gallery component:

```tsx
// `selectedSlot?.slot` is the user's current selection if any; otherwise default
// to the slot direction this gallery is currently displaying ('in' for entrance presets,
// 'out' for exit presets). The gallery already knows which direction it's showing —
// reuse that local state (search for the prop or local var that drives "Entrance" vs
// "Exit" tab/header in this file). Fall back to 'in' so the button is never a no-op.
const effectiveSlot: 'in' | 'out' = selectedSlot?.slot ?? activeDirection ?? 'in';
```

If the gallery has no `activeDirection` local state yet, just hardcode `'in'` for now and add a follow-up TODO comment — the more common case is applying entrance presets.

- [ ] **Step 6.3: Manual verification**

Run `pnpm dev`. Add 3 slides. Open preset gallery for In, hover any preset card.

- **Expected:** "All" pill appears top-right of the card.
- Click "All". **Expected:** every slide's In chip now shows that preset name.
- Open the gallery for Out, click "All" on a different preset. **Expected:** every slide's Out chip shows that preset.
- Edit a single slide's keyframes (Task 4 sheet), then click "All" with a different preset. **Expected:** that slide's custom keyframes are cleared (because we set `inCustomTracks: null` on bulk apply); chip shows the new preset.

- [ ] **Step 6.4: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 6.5: Commit**

```bash
git add lib/store/index.ts components/timeline/AnimationPresetGallery.tsx
git commit -m "feat(timeline): apply-to-all-slides bulk action on preset cards"
```

---

## Task 7: Color-split In vs Out chips

**Files:**
- Modify: `components/timeline/renderers/SlotRenderer.tsx`

The current chips use `bg-primary/15` + `border-primary/30` for both In and Out. Visually distinguish them: In stays primary-tinted; Out shifts to a secondary accent (`accent` token) so users can tell them apart in fast scrubbing.

- [ ] **Step 7.1: Adjust Out chip styling**

In `components/timeline/renderers/SlotRenderer.tsx`, on the Out `<button>` chip, replace the filled-state classNames:

```tsx
outPreset
  ? 'bg-accent/40 border border-accent-foreground/20'
  : 'bg-muted/30 border border-dashed border-border/50 hover:border-accent-foreground/40 hover:bg-accent/20',
```

And update the icon + label text colors when `outPreset` is set:

```tsx
<VideoReplayIcon size={10} className="text-accent-foreground shrink-0" />
<span className="text-[9px] text-accent-foreground font-medium truncate">
  {outPreset.name}
</span>
```

(Adjust the inline tooltip wording if needed — the words "Entrance" / "Exit" are already present, so just colour follows that.)

- [ ] **Step 7.2: Update the legend accent for symmetry**

In `components/timeline/TimelineRowLegend.tsx`, the `Motion` row currently uses `text-primary`. Either:

- Keep it as `text-primary` (the chip-row dominant color is still In = primary), OR
- Change to a neutral `text-foreground` and rely on chip-level color to convey In vs Out.

Pick the second option for consistency; in the `TIMELINE_LEGEND_ROWS` factory:

```ts
{ id: 'animation', ..., accentClass: 'text-foreground/70' },
```

- [ ] **Step 7.3: Manual verification**

Run `pnpm dev`. Add 2 slides each with In + Out presets.

- **Expected:** In chips are primary-tinted (green/blue per theme), Out chips are accent-tinted (visually distinct). Empty chips remain dashed-muted regardless of slot.
- Hover an Out chip — it lightens, ring-on-select still uses primary (the focus ring stays consistent).

- [ ] **Step 7.4: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 7.5: Commit**

```bash
git add components/timeline/renderers/SlotRenderer.tsx components/timeline/TimelineRowLegend.tsx
git commit -m "feat(timeline): visually distinguish in vs out slot chips"
```

---

## Task 8: Persist zoom, fitMode, and panel height to localStorage

**Files:**
- Modify: `lib/store/index.ts` — wire Zustand `persist` middleware for a narrow slice OR direct `localStorage` reads/writes

The store already uses Zustand with Zundo. Adding `persist` middleware to the entire store risks corrupting undo history. Instead, persist only `timeline.zoom`, `timeline.fitMode`, and the timeline panel height with explicit reads/writes.

- [ ] **Step 8.1: Add a small helper module**

Create `lib/store/timeline-persistence.ts`:

```ts
const KEY = 'screenshot-studio.timeline.v1';

interface PersistedTimeline {
  zoom: number;
  fitMode: 'fit' | 'manual';
  panelHeight: number | null;
}

export function loadTimelinePrefs(): Partial<PersistedTimeline> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<PersistedTimeline>;
    return parsed;
  } catch {
    return {};
  }
}

export function saveTimelinePrefs(prefs: Partial<PersistedTimeline>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadTimelinePrefs();
    window.localStorage.setItem(KEY, JSON.stringify({ ...current, ...prefs }));
  } catch {
    // ignore quota / privacy-mode failures
  }
}
```

- [ ] **Step 8.2: Hydrate from storage on store init**

In `lib/store/index.ts`, where `timeline` initial state is declared, hydrate `zoom` and `fitMode`:

```ts
import { loadTimelinePrefs, saveTimelinePrefs } from '@/lib/store/timeline-persistence';

const persistedTimeline = loadTimelinePrefs();
// ... in initial state:
timeline: {
  // ... existing fields
  zoom: persistedTimeline.zoom ?? 1,
  fitMode: persistedTimeline.fitMode ?? 'fit',
},
```

In `setTimeline`, after the existing state update, persist if zoom or fitMode changed:

```ts
setTimeline: (partial) => {
  set((state) => ({ timeline: { ...state.timeline, ...partial } }));
  if ('zoom' in partial || 'fitMode' in partial) {
    const next = get().timeline;
    saveTimelinePrefs({ zoom: next.zoom, fitMode: next.fitMode });
  }
},
```

- [ ] **Step 8.3: Persist panel height**

In `components/timeline/TimelineEditor.tsx`, hydrate `overrideHeight` from prefs and persist on change. At the top:

```tsx
import { loadTimelinePrefs, saveTimelinePrefs } from '@/lib/store/timeline-persistence';

const [overrideHeight, setOverrideHeight] = React.useState<number | null>(
  () => loadTimelinePrefs().panelHeight ?? null,
);

React.useEffect(() => {
  saveTimelinePrefs({ panelHeight: overrideHeight });
}, [overrideHeight]);
```

- [ ] **Step 8.4: Manual verification**

Run `pnpm dev`.

- Set zoom to 200% (Ctrl+wheel up). Refresh the page. **Expected:** zoom is still 200%, Fit mode is off.
- Click "Fit". Refresh. **Expected:** Fit mode on, zoom auto-fit.
- Drag the panel taller. Refresh. **Expected:** panel keeps the new height.
- Open DevTools Application → Local Storage → key `screenshot-studio.timeline.v1`. **Expected:** JSON with `zoom`, `fitMode`, `panelHeight`.

- [ ] **Step 8.5: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 8.6: Commit**

```bash
git add lib/store/timeline-persistence.ts lib/store/index.ts components/timeline/TimelineEditor.tsx
git commit -m "feat(timeline): persist zoom, fit mode, and panel height across reloads"
```

---

## Task 9: Keyboard shortcuts (Space / Esc / arrow / F)

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx` — add a single `keydown` listener while the editor is mounted

The tooltips written in Task 2 already advertise Space/Esc/F — implement them now.

- [ ] **Step 9.1: Add the listener**

In `components/timeline/TimelineEditor.tsx`, the existing `useEffect(...handleKeyDown...)` (around line 264). Extend it:

```tsx
React.useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip when typing in inputs / contenteditable
    const target = e.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
      return;
    }

    if (e.key === 'Escape') {
      setSelectedSlot(null);
      setPendingPresetId(null);
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      useImageStore.getState().togglePlayback();
      return;
    }
    if (e.key === 'f' || e.key === 'F') {
      useImageStore.getState().setTimeline({ fitMode: 'fit' });
      return;
    }
    if (e.key === 'ArrowLeft') {
      const { timeline, setPlayhead } = useImageStore.getState();
      setPlayhead(Math.max(0, timeline.playhead - 100));
      return;
    }
    if (e.key === 'ArrowRight') {
      const { timeline, setPlayhead } = useImageStore.getState();
      setPlayhead(Math.min(timeline.duration, timeline.playhead + 100));
      return;
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [setSelectedSlot, setPendingPresetId]);
```

- [ ] **Step 9.2: Manual verification**

Run `pnpm dev`. Open editor with slides.

- Press **Space** → playback toggles. Press again → pauses.
- Press **Esc** → any slot selection / pending preset is cleared.
- Press **F** → Fit mode turns on.
- Press **←** → playhead jumps -100ms. Press **→** → +100ms.
- Type into the duration slider's adjacent number field (if any), press Space — **Expected:** Space inserts a space character, does NOT toggle playback (input guard).

- [ ] **Step 9.3: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 9.4: Commit**

```bash
git add components/timeline/TimelineEditor.tsx
git commit -m "feat(timeline): add Space/Esc/F/arrow keyboard shortcuts"
```

---

## Task 10: Sticky time readout near the playhead

**Files:**
- Modify: `components/timeline/TimelineEditor.tsx` — overlay a small badge that follows the cursor

The library renders the playhead as `.timeline-editor-cursor`. We can position a sticky badge using the cursor's left offset (computed from `playhead * scaleWidth / 1000 + START_LEFT - LEGEND_WIDTH-adjust`).

- [ ] **Step 10.1: Render the badge**

In `components/timeline/TimelineEditor.tsx`, just inside the timeline-area `<div>` (after `<Timeline ... />`), add a positioned overlay:

```tsx
{/* Sticky playhead time badge */}
<div
  aria-hidden
  className="pointer-events-none absolute z-20 bg-foreground text-background text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded shadow"
  style={{
    left: `calc(${TIMELINE_LEGEND_WIDTH}px + ${START_LEFT}px + ${
      (timeline.playhead / 1000) * scaleWidth
    }px)`,
    top: 8,
    transform: 'translateX(-50%)',
  }}
>
  {(timeline.playhead / 1000).toFixed(2)}s
</div>
```

Wrap the timeline area in a `relative` container so the absolute badge anchors to it. The outermost `<div className="flex-1 flex overflow-hidden">` should become `<div className="flex-1 flex overflow-hidden relative">`.

- [ ] **Step 10.2: Manual verification**

Run `pnpm dev`. Drag the playhead.

- **Expected:** A small dark pill appears just above the playhead showing live time in seconds (`0.00s`, `1.42s`, …). It moves smoothly with the playhead.
- Time matches the readout in the controls bar to 2 decimal places.
- Badge does not capture clicks (`pointer-events-none`).
- During Ctrl+wheel zoom, the badge stays attached to the playhead.

- [ ] **Step 10.3: Lint + build**

```bash
pnpm lint && pnpm build
```

- [ ] **Step 10.4: Final commit**

```bash
git add components/timeline/TimelineEditor.tsx
git commit -m "feat(timeline): sticky time readout follows the playhead"
```

---

## Wrap-up

After all 10 tasks:

- [ ] **Final lint + build:** `pnpm lint && pnpm build`
- [ ] **Smoke test the golden path:** open editor with 3 slides → randomize Frame, Background, 3D, Motion → click "All" on a Fade preset for In → double-click chip → drag a keyframe → close sheet → press Space → playback runs with custom timing → press F → fit mode re-engages → reload page → zoom + fit + height persisted.
- [ ] **Decision doc:** create `docs/ARCHITECT/timeline-keyframe-editor.md` per the project's decision-docs rule, summarising:
  - Why keyframe editor opens in a Sheet, not embedded in chips
  - The `inCustomTracks` / `outCustomTracks` field design
  - The `fitMode` toggle pattern
  - localStorage persistence boundary (only zoom/fitMode/panelHeight, not full state)
- [ ] **Branch handoff:** open PR titled `feat(timeline): player polish + keyframe editor`. Body summarises the 10 tasks; test plan is the smoke-test checklist above.

---

## Glossary

- **Slot chip** — the In/Out button rendered inside `SlotRenderer`, sitting on the animation row of the timeline.
- **Preset tracks** — the keyframe arrays defined in `lib/animation/presets.ts` and `exit-presets.ts`.
- **Custom tracks** — per-slot overrides stored in `slides[i].inCustomTracks` / `outCustomTracks`. Take priority over presets at playback time.
- **Fit mode** — `timeline.fitMode === 'fit'` recomputes zoom from container width on resize; `'manual'` lets the user own zoom.
- **Legend** — the 140px left gutter labelling each row.
