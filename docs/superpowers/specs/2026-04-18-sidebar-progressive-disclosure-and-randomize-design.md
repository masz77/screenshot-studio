# Sidebar Progressive Disclosure & Randomize Buttons

**Date:** 2026-04-18
**Status:** Design approved, pending implementation plan

## Overview

Reduce sidebar cognitive load by moving power-user controls behind an **Advanced** disclosure inside each `SectionWrapper`, so default views show only the most common controls. Add four **Randomize** buttons — two on the left sidebar (Frame, Background) and two on the right sidebar (3D, Motion) — that batch-apply random styling in one undoable step, giving users fast design exploration.

## Goals

- Sections display only primary controls by default; power controls sit under a nested "Advanced" disclosure.
- Four randomize buttons are always visible (regardless of active tab) and each click produces exactly one `Cmd+Z`-reversible history entry.
- Disclosure state (section open/closed, advanced open/closed) persists across sessions via `localStorage`.
- No change to content-creation sections (Text, Annotate, Image Overlay, Code Snippet, Tweet, Browser Mockup, Settings).
- No change to the uploaded image, overlays, text, annotations, or timeline state when randomize is clicked.

## Non-Goals

- Adding new slider controls to Transforms (3D) — keep what exists today, just organize.
- Changing the tab taxonomy (Design / Layers / BG / Adjust / 3D / Motion) on either panel.
- Changing `ModeDropdown` (Screenshot / Browser).
- Redesigning the canvas, header, timeline, templates overlay, or export flow.
- Changing undo/redo infrastructure (Zundo stays as-is).

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Disclosure API | **Prop-based `advancedContent` slot on `SectionWrapper`** | Only one advanced block per section; prop API is simplest diff (~10 sections). |
| Disclosure persistence | **`localStorage`-backed store keyed by `sectionId`** | Survives reload; no backend needed; graceful fallback to `defaultOpen` / `defaultAdvancedOpen` when missing. |
| Randomize placement (left) | **Between `ModeDropdown` and tab navigation** | Matches user's request ("below the screenshot dropdown"); always visible. |
| Randomize placement (right) | **Pinned above the tab navigation** | User asked for "on top of current 3D/Motion menu"; always-visible is more useful than tab-scoped so motion can be randomized from the Design tab, etc. |
| Random selection strategy | **Pick from existing preset catalogs**, not continuous values | Avoids ugly combinations; stays aligned with designer intent baked into presets. |
| Anti-repeat | **Re-roll up to 3× if pick matches current value** | Clicking randomize and getting the same value feels broken. |
| Undo granularity | **One history entry per randomize click** | Implementation: single `set(state => ({...}))` call batches all field updates; Zundo records one diff. |
| What randomize preserves | **Content (image, overlays, text, annotations), mode, tabs, templates, timeline** | Randomize is about "look," not data. |
| Random selection module | **Pure functions in `lib/randomize/`** | Unit-testable; no store coupling. |

## Key Files

### New files

| File | Purpose |
|---|---|
| `components/editor/RandomizeButtons.tsx` | Shared 2-button row rendered in both sidebars. Variant prop selects which pair (`left` → Frame + Background; `right` → 3D + Motion). |
| `lib/randomize/index.ts` | Pure pick functions: `pickFrame(current)`, `pickBackground(current)`, `pick3D(current)`, `pickMotion(current)`. No store imports. |
| `lib/store/disclosure-store.ts` | `localStorage`-backed Zustand store for per-section `{open, advancedOpen}` state keyed by `sectionId`. |
| `docs/ARCHITECT/sidebar-progressive-disclosure.md` | Decision doc per project `decision-docs.md` rule — mirrors this spec's architecture choices. |

### Modified files

| File | Change |
|---|---|
| `components/editor/sections/SectionWrapper.tsx` | Add `sectionId: string`, `advancedContent?: React.ReactNode`, `defaultAdvancedOpen?: boolean` props. Render secondary disclosure below primary children when `advancedContent` is provided. Read/write open state from `useDisclosureStore` (fall back to `defaultOpen` / `defaultAdvancedOpen` when no entry). |
| `components/editor/sections/StyleSection.tsx` | Move `Padding` and `Opacity` sliders out of primary and into `advancedContent`. Keep the 6 preset tiles as primary. |
| `components/editor/sections/BorderSection.tsx` | Keep 3 preset tiles (Sharp/Curved/Round) as primary. Move `Radius` + `Scale` sliders into `advancedContent`. |
| `components/editor/sections/ShadowSection.tsx` | No structural change — section has no advanced content. Only add `sectionId` prop for disclosure persistence. |
| `components/editor/sections/BackgroundSection.tsx` | Split each internal `SectionWrapper`: see "Background split" table below. |
| `components/editor/sections/TransformsSection.tsx` | Add `sectionId` only. Keep as single-tier (5 preset tiles). |
| `components/editor/LeftEditPanel.tsx` | Add `<RandomizeButtons variant="left" />` between the `ModeDropdown` container and the tab navigation container. |
| `components/editor/unified-right-panel.tsx` | Add `<RandomizeButtons variant="right" />` as the first child inside the panel, above the tab navigation. |
| `lib/store/index.ts` | Add 4 store actions: `randomizeFrame()`, `randomizeBackground()`, `randomize3D()`, `randomizeMotion()`. Each calls `set()` exactly once with the batched update. |

### Background split (inside `BackgroundSection.tsx`)

Each sub-`SectionWrapper` keeps its own title and disclosure state. Within each, content splits primary vs advanced:

| Sub-section | Primary | Advanced |
|---|---|---|
| Light & Shadow | None + first 6 overlay tiles | Remaining 5 overlay tiles |
| Custom Background | Image / Color / Transparent (unchanged) | — |
| Magic Gradients | First 2 rows (16 tiles) + Shuffle action | Remainder |
| Gradients | Classic gradient row | Mesh gradient row |
| Category tiles (Abstract / macOS / Radiant / Mesh / Raycast / Paper / Pattern) | Top 8 thumbnails per category | Remainder (per category) |

Rationale: the BG tab is intentionally a browsing experience, so collapsing the whole thing defeats it. Cap the initial fold; the Advanced toggle exposes the long tail.

## Component Design

### `SectionWrapper` (extended)

```tsx
interface SectionWrapperProps {
  sectionId: string;                    // NEW — stable key for persistence
  title: string;
  children: React.ReactNode;            // primary content
  advancedContent?: React.ReactNode;    // NEW — optional advanced block
  defaultOpen?: boolean;                // fallback when no stored state
  defaultAdvancedOpen?: boolean;        // NEW — fallback; defaults to false
  className?: string;
  action?: React.ReactNode;
}
```

Rendering structure when open:

```
[▼] TITLE                          {action?}
  {children}                       ← primary, always visible when section open
  ─────────────────────────
  [▸] Advanced                     ← only if advancedContent provided; closed by default
    {advancedContent}              ← visible when advanced open
```

Section open/closed and advanced open/closed are **independent** toggles. Both persist to `useDisclosureStore` keyed by `sectionId`.

### `RandomizeButtons`

```tsx
interface RandomizeButtonsProps {
  variant: 'left' | 'right';
}
```

Renders a 2-column grid of buttons. Left variant → Frame, Background. Right variant → 3D, Motion.

Button style: `bg-muted/80 hover:bg-accent`, ~36px height, title text on the left, `ShuffleIcon` (12–14px) on the right. Matches the existing "Magic Gradients SHUFFLE" affordance already in `BackgroundSection` for visual consistency.

Each button calls the corresponding store action on click.

### `useDisclosureStore`

```tsx
interface DisclosureState {
  sections: Record<string, { open: boolean; advancedOpen: boolean }>;
  setOpen: (sectionId: string, open: boolean) => void;
  setAdvancedOpen: (sectionId: string, open: boolean) => void;
  getSection: (sectionId: string, defaults: { open: boolean; advancedOpen: boolean }) =>
    { open: boolean; advancedOpen: boolean };
}
```

Persisted to `localStorage` via Zustand's `persist` middleware. Migration: if `sectionId` is absent, `getSection` returns the provided defaults.

## Randomize Semantics

### `randomizeFrame()`

Batch-sets 5 fields in one `set()` call:

| Field | Source |
|---|---|
| `imageStylePreset` | Random of 6 preset values (`default`, `glass-light`, `glass-dark`, `outline`, `border-light`, `border-dark`) |
| `borderRadius` | Random of `{0, 12, 20}` |
| `imageScale` | Random integer in `[85, 115]` |
| `imageBorder.padding` | Random in `[0, 8]` step 0.5 |
| `imageBorder.opacity` | Random in `[0.05, 1.0]` step 0.01 |
| `shadowPreset` | Random of 4 preset values (`none`, `hug`, `soft`, `strong`) |

Each field is re-rolled up to 3× to avoid matching the current value.

### `randomizeBackground()`

One `set()` call updating `backgroundConfig`. Pool: all 7 category image paths + all classic gradients + all mesh gradients + all magic gradients. Excludes: solid colors, transparent, user-uploaded blob URLs. Re-roll up to 3× to avoid current value.

### `randomize3D()`

One `set()` call updating `perspective3D` with a random pick from the 5 presets in `TransformsSection.tsx` (`Default`, `Tilted`, `Dramatic Left`, `Dramatic Right`, `Top Down`). Re-roll up to 3×.

### `randomizeMotion()`

Applies a random animation preset from `lib/animation/presets.ts`, using `clonePresetTracks()` per the existing convention in `CLAUDE.md`. Re-roll up to 3×.

### What randomize does NOT touch

Image upload, image overlays, text overlays, annotations, code snippets, tweet imports, browser mockup, slide list, editor mode (Screenshot / Browser), active tab, templates overlay, timeline playback state.

## Data Flow

```
User clicks [🎲 Frame]
  └─ RandomizeButtons.onClick
       └─ useImageStore.randomizeFrame()
            ├─ reads current: { imageStylePreset, borderRadius, imageScale, imageBorder, shadowPreset }
            ├─ calls pickFrame(current) → new values
            └─ set(state => ({ ...state, ...newValues }))   ← 1 Zundo entry
                 └─ canvas re-renders
Cmd+Z → Zundo.temporal.undo() → previous state restored
```

Same shape for the other three buttons.

## Error Handling

- `pickFrame/pickBackground/pick3D/pickMotion` must never throw; they operate on static catalogs and fall back to the first catalog entry if the current value can't be excluded after 3 re-rolls.
- `randomizeMotion` delegates to the existing animation preset application path; any error there surfaces via the existing animation error boundary (no new handling needed).
- If `localStorage` is unavailable (private browsing, quota), `useDisclosureStore` silently falls through to in-memory state — persistence is best-effort, never blocking.

## Testing Plan

No automated test framework is configured in this repo (per `CLAUDE.md`). Adding one is **out of scope** for this project. Acceptance is the manual checklist below.

The pure pick functions in `lib/randomize/` are written to be test-ready (no store coupling, deterministic given a seeded RNG) so they can be covered later when a framework is added, without refactoring.

### Manual checklist (authoritative acceptance criteria)

- [ ] Click each of the 4 randomize buttons; canvas updates each time.
- [ ] Cmd+Z after each randomize reverts in exactly one step.
- [ ] Cmd+Shift+Z re-applies.
- [ ] Header undo button behaves identically to Cmd+Z.
- [ ] All 4 buttons remain visible when switching tabs (Design / Layers / BG / Adjust / 3D / Motion).
- [ ] Randomize never clears uploaded image, overlays, text, or annotations.
- [ ] 3× re-roll prevents immediate repeat (click 10× in a row; values vary).
- [ ] On fresh load, each section with advanced content shows primary visible and Advanced collapsed.
- [ ] Toggling a section's primary open/closed does not affect its Advanced open/closed, and vice versa.
- [ ] Both section open state and Advanced open state survive full page reload.
- [ ] Disclosure store handles missing `localStorage` gracefully (test in private tab — app still works, state is in-memory only).

## Accessibility

- Randomize buttons have visible labels ("Frame", "Background", "3D", "Motion") and an `aria-label` like `"Randomize frame styling"`.
- Advanced disclosure chevron is a real `<button>` with `aria-expanded` bound to state.
- Keyboard: Tab reaches all buttons in reading order; Enter/Space activates.
- Focus ring must be visible on randomize buttons (use existing `focus-visible:ring-ring` pattern).

## Security Considerations

None — this work is entirely client-side state manipulation. Random selection uses `Math.random()` (no security-sensitive use). No new network calls, no new storage of user content, no new external dependencies.

## Open Questions

None at this time; all resolved during brainstorming:

- Disclosure API → prop-based (`advancedContent`).
- Background browsing behavior → cap initial fold, rest under Advanced.
- Transforms (3D) → single-tier, no new sliders added.
- Frame randomize scope → all 5 fields together.
- Undo behavior → one history entry per click via single batched `set()`.

## Migration Notes

- No data migration required — new `localStorage` keys only; absent keys fall back to defaults.
- No breaking changes to existing sections that don't use `advancedContent`; the prop is optional.
- `sectionId` is a new required prop on `SectionWrapper`. Every existing usage must be updated at the same time to avoid runtime errors. Implementation plan must enumerate every call site and assign a stable `sectionId`.
