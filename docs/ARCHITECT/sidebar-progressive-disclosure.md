# Sidebar Progressive Disclosure & Randomize Buttons

## Overview
Two-tier disclosure inside `SectionWrapper` (primary controls always visible; Advanced block collapsed by default) plus four one-click Randomize buttons in the left and right sidebars. Randomize clicks produce exactly one Zundo history entry each.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Disclosure API | Prop-based `advancedContent` slot on `SectionWrapper` | One advanced block per section; minimal diff across existing sections. |
| Disclosure persistence | `localStorage`-backed Zustand store keyed by `sectionId` | Survives reload; graceful fallback to defaults when no entry. |
| Randomize placement (left) | Between `ModeDropdown` and tab navigation | Always visible regardless of active left-panel tab. |
| Randomize placement (right) | Pinned above the tab navigation | Always visible regardless of active right-panel tab. |
| Random source | Pick from existing preset catalogs, not continuous values (except a few numeric fields in Frame) | Avoids ugly combos; stays aligned with designer intent. |
| Anti-repeat | Re-roll up to 3× if pick matches current value | Clicking randomize and getting the same value feels broken. |
| Undo granularity | One Zundo entry per click — single batched `set()` call | Matches user expectation that one click = one Cmd+Z. |
| Tunable knobs | Centralized in `lib/editor/sidebar-config.ts` | Adjust fold caps + random ranges in one file, no component edits. |
| Content preservation | Randomize never touches uploaded image, overlays, text, annotations, mockup, tabs, templates, timeline playback, mode | Randomize is for "look," not data. |

## Key Files

| File | Purpose |
|------|---------|
| `components/editor/sections/SectionWrapper.tsx` | Extended with `sectionId`, `advancedContent`, `defaultAdvancedOpen`. |
| `lib/store/disclosure-store.ts` | `localStorage`-backed disclosure state. |
| `lib/editor/sidebar-config.ts` | Central disclosure fold caps + randomize ranges. |
| `lib/randomize/index.ts` | Pure pick functions (`pickFrame`, `pickBackground`, `pick3D`, `pickMotion`). |
| `lib/constants/transform-presets.ts` | Shared 3D transform preset catalog (extracted from `TransformsSection`). |
| `lib/store/index.ts` | Four new randomize actions on `useImageStore`. |
| `components/editor/RandomizeButtons.tsx` | Shared 2-button row; `variant: 'left' \| 'right'`. |
| `components/editor/LeftEditPanel.tsx` | Mounts `<RandomizeButtons variant="left" />` below `ModeDropdown`. |
| `components/editor/unified-right-panel.tsx` | Mounts `<RandomizeButtons variant="right" />` above tab nav. |

## Data Flow
1. User clicks a randomize button → `RandomizeButtons.onClick` → store action.
2. Store action reads current state, calls pure picker, calls `set(state => ({ ...newFields }))` exactly once.
3. Zundo middleware records one history entry.
4. `Cmd+Z` / header undo reverts in one step.

## Security Considerations
None. Entirely client-side; uses `Math.random()` (no security-sensitive use); no new network calls or external deps.
