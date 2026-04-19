# Sidebar Progressive Disclosure & Randomize Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move power-user sidebar controls behind a secondary "Advanced" disclosure inside `SectionWrapper`, and add four one-click Randomize buttons (Frame, Background, 3D, Motion) that each produce a single undoable state diff.

**Architecture:** Extend `SectionWrapper` with a `sectionId` (required, for persistence) and optional `advancedContent` slot. Persist open state per section in a new `localStorage`-backed Zustand store. Add four pure pick functions in `lib/randomize/` and four store actions in `useImageStore` that each make exactly one `set()` call so Zundo records one history entry per click. All tunable knobs (fold caps, random ranges, re-roll attempts) live in `lib/editor/sidebar-config.ts`.

**Tech Stack:** Zustand + Zundo (existing), React, TypeScript, Tailwind 4, hugeicons-react, `ANIMATION_PRESETS` from `lib/animation/presets.ts`.

**Test policy:** No automated test framework is configured in this repo. Each task ends with a `pnpm build` check. Full manual acceptance checklist runs once at the end (Task 14).

**Reference spec:** `docs/superpowers/specs/2026-04-18-sidebar-progressive-disclosure-and-randomize-design.md`

---

### Task 1: Commit architecture decision doc

**Files:**
- Create: `docs/ARCHITECT/sidebar-progressive-disclosure.md`

Per project rule `_shared/.claude/rules/decision-docs.md`, commit the architecture doc **before** any code.

- [ ] **Step 1: Create the decision doc**

```markdown
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
```

- [ ] **Step 2: Commit the doc alone**

```bash
git add docs/ARCHITECT/sidebar-progressive-disclosure.md
git commit -m "docs: architecture decisions for sidebar disclosure + randomize"
```

---

### Task 2: Create centralized sidebar config

**Files:**
- Create: `lib/editor/sidebar-config.ts`

- [ ] **Step 1: Write the config**

```typescript
// lib/editor/sidebar-config.ts
// Central tunables for sidebar progressive disclosure and randomize behavior.
// Adjust values here only — do not inline numbers inside components or pickers.

import type { ImageStylePreset, ShadowPreset } from '@/lib/store';

/** How many items show as primary before "Advanced" in each sub-section. */
export const DISCLOSURE_FOLDS = {
  lightAndShadow: { primaryTileCount: 6 },     // incl. "None" tile, so 6 total visible
  magicGradients: { primaryRows: 2 },          // 2 rows × N columns visible; rest under Advanced
  gradients: { primaryRows: 1 },               // classic row visible; mesh row under Advanced
  backgroundCategory: { primaryTilesPerCategory: 8 },
} as const;

/** Inclusive numeric ranges + catalog choices for randomize actions. */
export const RANDOMIZE_RANGES = {
  frame: {
    stylePresets: [
      'default',
      'glass-light',
      'glass-dark',
      'outline',
      'border-light',
      'border-dark',
    ] as ImageStylePreset[],
    shadowPresets: ['none', 'hug', 'soft', 'strong'] as ShadowPreset[],
    borderRadiusChoices: [0, 12, 20] as const,
    imageScale: { min: 85, max: 115 },         // percent
    padding: { min: 0, max: 8, step: 0.5 },
    opacity: { min: 0.05, max: 1.0, step: 0.01 },
  },
  rerollAttempts: 3,
} as const;
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds with no new type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/editor/sidebar-config.ts
git commit -m "feat: add centralized sidebar config for disclosure + randomize"
```

---

### Task 3: Extract 3D transform presets to shared constant

**Files:**
- Create: `lib/constants/transform-presets.ts`
- Modify: `components/editor/sections/TransformsSection.tsx`

Currently `TransformsSection.tsx` declares a local `PRESETS` array. `lib/randomize/index.ts` needs to read from the same catalog — extract to a constants file.

- [ ] **Step 1: Create the constants file**

```typescript
// lib/constants/transform-presets.ts

export interface TransformPreset {
  name: string;
  values: {
    perspective: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    translateX: number;
    translateY: number;
    scale: number;
  };
}

// Perspective in px (2400px ≈ 150em at 16px base)
export const TRANSFORM_PRESETS: TransformPreset[] = [
  { name: 'Default',         values: { perspective: 2400, rotateX: 0,  rotateY: 0,   rotateZ: 0,  translateX: 0,  translateY: 0,  scale: 1    } },
  { name: 'Tilted',          values: { perspective: 2400, rotateX: 0,  rotateY: 0,   rotateZ: -8, translateX: 0,  translateY: 0,  scale: 0.95 } },
  { name: 'Dramatic Left',   values: { perspective: 2400, rotateX: 10, rotateY: -20, rotateZ: 8,  translateX: -4, translateY: -2, scale: 0.95 } },
  { name: 'Dramatic Right',  values: { perspective: 2400, rotateX: 10, rotateY: 20,  rotateZ: -8, translateX: 4,  translateY: -2, scale: 0.95 } },
  { name: 'Top Down',        values: { perspective: 2400, rotateX: 40, rotateY: 0,   rotateZ: 0,  translateX: 0,  translateY: -5, scale: 0.95 } },
];
```

- [ ] **Step 2: Replace local `PRESETS` in `TransformsSection.tsx`**

Open `components/editor/sections/TransformsSection.tsx`. Replace the local `interface TransformPreset` block (lines 8-19) and the `const PRESETS: TransformPreset[] = [...]` block (lines 21-28) with a single import, and use `TRANSFORM_PRESETS` throughout.

Full updated file:

```tsx
'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { TRANSFORM_PRESETS, type TransformPreset } from '@/lib/constants/transform-presets';

export function TransformsSection() {
  const { perspective3D, setPerspective3D } = useImageStore();
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const idx = TRANSFORM_PRESETS.findIndex((preset) => {
      const v = preset.values;
      return (
        Math.abs(v.rotateX - perspective3D.rotateX) < 2 &&
        Math.abs(v.rotateY - perspective3D.rotateY) < 2 &&
        Math.abs(v.rotateZ - perspective3D.rotateZ) < 2
      );
    });
    setSelectedIndex(idx >= 0 ? idx : null);
  }, [perspective3D]);

  const applyPreset = (preset: TransformPreset, index: number) => {
    setPerspective3D(preset.values);
    setSelectedIndex(index);
  };

  const getTransformStyle = (preset: TransformPreset) => {
    const { perspective, rotateX, rotateY, rotateZ, translateX, translateY, scale } = preset.values;
    return {
      transform: `perspective(${perspective}px) translate(${translateX}%, ${translateY}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
    };
  };

  return (
    <SectionWrapper title="Transforms" sectionId="transforms" defaultOpen={true}>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TRANSFORM_PRESETS.map((preset, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset, index)}
              className={cn(
                'flex-shrink-0 flex items-center justify-center bg-card/60 w-16 h-16 rounded-xl overflow-hidden transition-all cursor-pointer',
                'hover:bg-accent/60',
                isSelected && 'ring-2 ring-border'
              )}
              title={preset.name}
            >
              <div
                className="w-9 h-9 bg-primary rounded-lg"
                style={getTransformStyle(preset)}
              />
            </button>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
```

Note: `sectionId="transforms"` is added here but will fail to type-check until Task 4 lands. Expected at this checkpoint.

- [ ] **Step 3: Verify build passes for the constants file only**

At this checkpoint, `pnpm build` will type-error on `sectionId` (the prop doesn't exist on `SectionWrapper` yet). That's expected — proceed to Task 4, which adds the prop. We commit this change together with Task 4 to keep the tree buildable between commits. **Do not commit yet.**

---

### Task 4: Extend `SectionWrapper` with `sectionId` and `advancedContent`

**Files:**
- Modify: `components/editor/sections/SectionWrapper.tsx`

This is the keystone change. All existing call sites must also pass `sectionId` (Task 5). We commit this task + Task 3 + Task 5 together at the end of Task 5 to keep `main` green.

- [ ] **Step 1: Replace the file contents**

```tsx
'use client';

import * as React from 'react';
import { ArrowDown01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useDisclosureStore } from '@/lib/store/disclosure-store';

interface SectionWrapperProps {
  /** Stable identifier used for localStorage-backed open/closed persistence. Required. */
  sectionId: string;
  title: string;
  children: React.ReactNode;
  /** Optional secondary disclosure; shown collapsed inside the open section. */
  advancedContent?: React.ReactNode;
  /** Fallback section-open state when no persisted value exists. */
  defaultOpen?: boolean;
  /** Fallback advanced-open state when no persisted value exists. Defaults to `false`. */
  defaultAdvancedOpen?: boolean;
  className?: string;
  action?: React.ReactNode;
}

export function SectionWrapper({
  sectionId,
  title,
  children,
  advancedContent,
  defaultOpen = true,
  defaultAdvancedOpen = false,
  className,
  action,
}: SectionWrapperProps) {
  const { open, advancedOpen, setOpen, setAdvancedOpen } = useDisclosureStore(
    (s) => s.getSection(sectionId, { open: defaultOpen, advancedOpen: defaultAdvancedOpen })
  );

  // Selector above returns primitives plus setters via closure helpers below.
  const toggleOpen = React.useCallback(() => {
    useDisclosureStore.getState().setOpen(sectionId, !open);
  }, [sectionId, open]);
  const toggleAdvanced = React.useCallback(() => {
    useDisclosureStore.getState().setAdvancedOpen(sectionId, !advancedOpen);
  }, [sectionId, advancedOpen]);

  // Unused reads to silence TS if selector shape changes. Safe to remove later.
  void setOpen;
  void setAdvancedOpen;

  return (
    <div className={cn('mb-1', className)}>
      <div className="w-full flex items-center justify-between gap-2 py-3 px-2 hover:bg-card/30 rounded-lg transition-colors group">
        <button
          type="button"
          onClick={toggleOpen}
          className="flex items-center gap-2 flex-1"
        >
          <ArrowDown01Icon
            size={16}
            className={cn(
              'text-muted-foreground transition-transform duration-200',
              !open && '-rotate-90'
            )}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            {title}
          </span>
        </button>
        {action && <div>{action}</div>}
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-2 pb-4 space-y-4">
          {children}

          {advancedContent && (
            <div className="pt-2 border-t border-border/30">
              <button
                type="button"
                onClick={toggleAdvanced}
                className="w-full flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-card/30 transition-colors group"
                aria-expanded={advancedOpen}
              >
                <ArrowDown01Icon
                  size={14}
                  className={cn(
                    'text-muted-foreground/80 transition-transform duration-200',
                    !advancedOpen && '-rotate-90'
                  )}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 group-hover:text-foreground">
                  Advanced
                </span>
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  advancedOpen ? 'max-h-[2000px] opacity-100 pt-2' : 'max-h-0 opacity-0'
                )}
              >
                <div className="space-y-4 pl-1">{advancedContent}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Rationale for `max-h-[4000px]`: the previous `2000px` could truncate long sections (e.g., BG category grids) once advanced content pushes them taller. Doubling the ceiling is cheap; the transition is CSS-only.

- [ ] **Step 2: Do not commit yet**

Build will fail on missing `useDisclosureStore` — we create it in the next task. Proceed.

---

### Task 5: Create the disclosure store

**Files:**
- Create: `lib/store/disclosure-store.ts`

- [ ] **Step 1: Write the store**

```typescript
// lib/store/disclosure-store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SectionState {
  open: boolean;
  advancedOpen: boolean;
}

interface DisclosureStore {
  sections: Record<string, SectionState>;
  setOpen: (sectionId: string, open: boolean) => void;
  setAdvancedOpen: (sectionId: string, open: boolean) => void;
  getSection: (sectionId: string, defaults: SectionState) => SectionState;
}

/**
 * Safe storage: falls back to an in-memory shim if localStorage is unavailable
 * (private tabs, quota exceeded, SSR). Never throws.
 */
const safeStorage = (): Storage => {
  if (typeof window === 'undefined') {
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
      clear: () => memory.clear(),
      key: (i) => Array.from(memory.keys())[i] ?? null,
      get length() { return memory.size; },
    };
  }
  try {
    const testKey = '__disclosure_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
      clear: () => memory.clear(),
      key: (i) => Array.from(memory.keys())[i] ?? null,
      get length() { return memory.size; },
    };
  }
};

export const useDisclosureStore = create<DisclosureStore>()(
  persist(
    (set, get) => ({
      sections: {},
      setOpen: (sectionId, open) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionId]: {
              open,
              advancedOpen: state.sections[sectionId]?.advancedOpen ?? false,
            },
          },
        })),
      setAdvancedOpen: (sectionId, advancedOpen) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionId]: {
              open: state.sections[sectionId]?.open ?? true,
              advancedOpen,
            },
          },
        })),
      getSection: (sectionId, defaults) => {
        const entry = get().sections[sectionId];
        return entry ?? defaults;
      },
    }),
    {
      name: 'screenshot-studio:disclosure',
      storage: createJSONStorage(() => safeStorage()),
      version: 1,
    }
  )
);
```

- [ ] **Step 2: Update existing `SectionWrapper` call sites to pass `sectionId`**

Below are every file in the repo that uses `<SectionWrapper>`. Each edit is a single prop addition; pick a stable kebab-case ID.

**`components/editor/sections/StyleSection.tsx`** — line 93:

```tsx
<SectionWrapper title="Style" sectionId="style" defaultOpen={true}>
```

**`components/editor/sections/BorderSection.tsx`** — line 43:

```tsx
<SectionWrapper title="Border" sectionId="border" defaultOpen={true}>
```

**`components/editor/sections/ShadowSection.tsx`** — line 42:

```tsx
<SectionWrapper title="Shadow" sectionId="shadow" defaultOpen={true}>
```

**`components/editor/sections/BackgroundSection.tsx`** — four call sites:

Line 172:
```tsx
<SectionWrapper title="Light & Shadow" sectionId="bg-light-shadow" defaultOpen={true}>
```
Line 210:
```tsx
<SectionWrapper title="Custom Background" sectionId="bg-custom" defaultOpen={true}>
```
Line 301 (inside the categories loop):
```tsx
<SectionWrapper
  key={category}
  title={CATEGORY_LABELS[category] || category}
  sectionId={`bg-category-${category}`}
  defaultOpen={true}
>
```
Line 333:
```tsx
<SectionWrapper
  title="Magic Gradients"
  sectionId="bg-magic-gradients"
  defaultOpen={true}
  action={
```
Line 378:
```tsx
<SectionWrapper title="Gradients" sectionId="bg-gradients" defaultOpen={true}>
```

**`components/editor/sections/AnnotateSection.tsx`** — add `sectionId="annotate"` to every `<SectionWrapper>` in that file.

**`components/editor/sections/BrowserMockupSection.tsx`** — `sectionId="browser-mockup"`.

**`components/editor/sections/CodeSnippetSection.tsx`** — `sectionId="code-snippet"`.

**`components/editor/sections/DepthSection.tsx`** — `sectionId="depth"`.

**`components/editor/sections/DeviceFramesSection.tsx`** — `sectionId="device-frames"`.

**`components/editor/sections/ImageOverlaySection.tsx`** — `sectionId="image-overlay"`.

**`components/editor/sections/ImagePositionSection.tsx`** — `sectionId="image-position"`.

**`components/editor/sections/PositionSection.tsx`** — `sectionId="position"`.

**`components/editor/sections/SettingsSection.tsx`** — `sectionId="settings"`.

**`components/editor/sections/TextSection.tsx`** — `sectionId="text"`.

**`components/editor/sections/TweetImportSection.tsx`** — `sectionId="tweet-import"`.

**`components/editor/RightSettingsPanel.tsx`** — open the file and add a unique `sectionId` to every `<SectionWrapper>` usage (e.g., `sectionId="rs-<title-kebab>"`). There may be several; handle each.

If any single file contains multiple `<SectionWrapper>` call sites (like `BackgroundSection.tsx`), each needs its own unique `sectionId`.

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -30`
Expected: build succeeds. Any remaining "Property 'sectionId' is missing" errors point to call sites missed above — fix them.

- [ ] **Step 4: Commit Tasks 3 + 4 + 5 together**

```bash
git add lib/store/disclosure-store.ts \
        lib/constants/transform-presets.ts \
        components/editor/sections/SectionWrapper.tsx \
        components/editor/sections/TransformsSection.tsx \
        components/editor/sections/StyleSection.tsx \
        components/editor/sections/BorderSection.tsx \
        components/editor/sections/ShadowSection.tsx \
        components/editor/sections/BackgroundSection.tsx \
        components/editor/sections/AnnotateSection.tsx \
        components/editor/sections/BrowserMockupSection.tsx \
        components/editor/sections/CodeSnippetSection.tsx \
        components/editor/sections/DepthSection.tsx \
        components/editor/sections/DeviceFramesSection.tsx \
        components/editor/sections/ImageOverlaySection.tsx \
        components/editor/sections/ImagePositionSection.tsx \
        components/editor/sections/PositionSection.tsx \
        components/editor/sections/SettingsSection.tsx \
        components/editor/sections/TextSection.tsx \
        components/editor/sections/TweetImportSection.tsx \
        components/editor/RightSettingsPanel.tsx
git commit -m "feat: add SectionWrapper advanced disclosure + per-section persistence"
```

---

### Task 6: Move Style section controls to Advanced

**Files:**
- Modify: `components/editor/sections/StyleSection.tsx`

Primary = 6 preset tiles. Advanced = padding + opacity sliders (shown only when `imageStylePreset !== 'default'`, same rule as today).

- [ ] **Step 1: Update the return block**

Replace the body of the `return (...)` in `StyleSection` (starting at line 92) with:

```tsx
  const advanced = isNonDefault ? (
    <>
      <Slider
        value={[currentPadding]}
        onValueChange={(value) => setImageBorder({ padding: value[0] })}
        min={0}
        max={8}
        step={0.5}
        label="Padding"
        valueDisplay={currentPadding.toFixed(1)}
      />
      <Slider
        value={[Math.round(currentOpacity * 100)]}
        onValueChange={(value) => setImageBorder({ opacity: value[0] / 100 })}
        min={5}
        max={100}
        step={1}
        label="Opacity"
        valueDisplay={`${Math.round(currentOpacity * 100)}%`}
      />
    </>
  ) : undefined;

  return (
    <SectionWrapper
      title="Style"
      sectionId="style"
      defaultOpen={true}
      advancedContent={advanced}
    >
      <div className="grid grid-cols-3 gap-2 p-1">
        {stylePresets.map(({ value, label }) => {
          const isSelected = imageStylePreset === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setImageStylePreset(value)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <StylePreview preset={value} selected={isSelected} />
              <span
                className={cn(
                  'text-[10px] leading-tight transition-colors',
                  isSelected ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground/70',
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </SectionWrapper>
  );
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/editor/sections/StyleSection.tsx
git commit -m "feat: move Style padding/opacity sliders to Advanced"
```

---

### Task 7: Move Border section sliders to Advanced

**Files:**
- Modify: `components/editor/sections/BorderSection.tsx`

Primary = 3 preset tiles. Advanced = Radius + Scale sliders.

- [ ] **Step 1: Update the return block**

Replace the `return (...)` body in `BorderSection` with:

```tsx
  const advanced = (
    <>
      <Slider
        value={[borderRadius]}
        onValueChange={(value) => setBorderRadius(value[0])}
        min={0}
        max={50}
        step={1}
        label="Radius"
        valueDisplay={borderRadius}
      />
      <Slider
        value={[imageScale / 100]}
        onValueChange={(value) => setImageScale(Math.round(value[0] * 100))}
        min={0.1}
        max={2}
        step={0.01}
        label="Scale"
        valueDisplay={(imageScale / 100).toFixed(1)}
      />
    </>
  );

  return (
    <SectionWrapper
      title="Border"
      sectionId="border"
      defaultOpen={true}
      advancedContent={advanced}
    >
      <div className="grid grid-cols-3 gap-2 p-1">
        {borderPresets.map(({ value, label }) => {
          const isSelected = borderRadius === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setBorderRadius(value)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <BorderPreview radius={value} selected={isSelected} />
              <span
                className={cn(
                  'text-[10px] leading-tight transition-colors',
                  isSelected ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground/70',
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </SectionWrapper>
  );
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add components/editor/sections/BorderSection.tsx
git commit -m "feat: move Border radius/scale sliders to Advanced"
```

---

### Task 8: Split Background sub-sections into primary / advanced

**Files:**
- Modify: `components/editor/sections/BackgroundSection.tsx`

Four sub-wrappers get `advancedContent`. "Custom Background" stays single-tier.

- [ ] **Step 1: Import the config**

Add at the top of the file:

```tsx
import { DISCLOSURE_FOLDS } from '@/lib/editor/sidebar-config';
```

- [ ] **Step 2: Split "Light & Shadow"**

Find the `<SectionWrapper title="Light & Shadow" ...>` block (around line 172). Replace the grid body with a split:

```tsx
<SectionWrapper
  title="Light & Shadow"
  sectionId="bg-light-shadow"
  defaultOpen={true}
  advancedContent={
    <div className="grid grid-cols-3 gap-2 p-1">
      {OVERLAY_SHADOW_URLS
        .slice(DISCLOSURE_FOLDS.lightAndShadow.primaryTileCount - 1)
        .map((shadowUrl, index) => (
          <button
            key={`adv-${index}`}
            onClick={() => handleAddShadow(shadowUrl)}
            className={cn(
              'aspect-[16/9] rounded-xl overflow-hidden border transition-all bg-secondary dark:bg-secondary',
              currentShadow?.src === shadowUrl
                ? 'border-primary/50 ring-1 ring-primary/30'
                : 'border-border/30 hover:border-border/60'
            )}
          >
            <img
              src={shadowUrl}
              alt={`Shadow advanced ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
    </div>
  }
>
  <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2 p-1">
      <button
        onClick={handleRemoveShadows}
        className={cn(
          'aspect-[16/9] flex items-center justify-center text-xs font-medium rounded-xl border transition-all',
          !currentShadow
            ? 'border-primary/50 text-foreground bg-primary/5'
            : 'border-dashed border-border/50 text-muted-foreground hover:border-border hover:bg-card/30'
        )}
      >
        None
      </button>
      {OVERLAY_SHADOW_URLS
        .slice(0, DISCLOSURE_FOLDS.lightAndShadow.primaryTileCount - 1)
        .map((shadowUrl, index) => (
          <button
            key={index}
            onClick={() => handleAddShadow(shadowUrl)}
            className={cn(
              'aspect-[16/9] rounded-xl overflow-hidden border transition-all bg-secondary dark:bg-secondary',
              currentShadow?.src === shadowUrl
                ? 'border-primary/50 ring-1 ring-primary/30'
                : 'border-border/30 hover:border-border/60'
            )}
          >
            <img
              src={shadowUrl}
              alt={`Shadow ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
    </div>
  </div>
</SectionWrapper>
```

The `- 1` accounts for the "None" tile which counts toward the primary cap.

- [ ] **Step 3: Split background categories grid**

Find the `{availableCategories.map((category) => (` block (around line 300). Replace with:

```tsx
{availableCategories.map((category) => {
  const tiles = backgroundCategories[category] || [];
  const primaryCount = DISCLOSURE_FOLDS.backgroundCategory.primaryTilesPerCategory;
  const primaryTiles = tiles.slice(0, primaryCount);
  const advancedTiles = tiles.slice(primaryCount);

  const renderTile = (imagePath: string, idx: number) => (
    <button
      key={`${category}-${imagePath}-${idx}`}
      onClick={() => {
        setBackgroundValue(imagePath);
        setBackgroundType('image');
      }}
      className={cn(
        'aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 relative',
        backgroundConfig.value === imagePath
          ? 'border-primary ring-1 ring-primary/30'
          : 'border-transparent hover:border-border/50'
      )}
    >
      <CachedImage
        src={getBackgroundThumbnailUrl(imagePath)}
        alt={`${category} ${idx + 1}`}
        className="w-full h-full object-cover"
      />
    </button>
  );

  return (
    <SectionWrapper
      key={category}
      title={CATEGORY_LABELS[category] || category}
      sectionId={`bg-category-${category}`}
      defaultOpen={true}
      advancedContent={
        advancedTiles.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 p-1">
            {advancedTiles.map((p, i) => renderTile(p, i + primaryCount))}
          </div>
        ) : undefined
      }
    >
      <div className="grid grid-cols-4 gap-2 p-1">
        {primaryTiles.map((p, i) => renderTile(p, i))}
      </div>
    </SectionWrapper>
  );
})}
```

- [ ] **Step 4: Split Magic Gradients**

Find the `<SectionWrapper title="Magic Gradients" ...>` block (around line 333). Wrap the inner overflow container so primary rows stay and remaining tiles move under Advanced:

```tsx
{(() => {
  const keys = Object.keys(magicGradients) as MagicGradientKey[];
  const primaryRows = DISCLOSURE_FOLDS.magicGradients.primaryRows;   // rows per column
  // The existing grid uses 4 rows per column. Primary keeps the first `primaryRows * nCols` tiles where nCols fills comfortably.
  // Simpler split: primary = first (primaryRows * 8) tiles as columns-of-4 can scroll; leftover = advanced.
  const primaryCount = primaryRows * 8;
  const primaryKeys = keys.slice(0, primaryCount);
  const advancedKeys = keys.slice(primaryCount);

  const renderGridRows = (subset: MagicGradientKey[], keyPrefix: string) => (
    <div className="overflow-x-auto scrollbar-hide">
      <div
        className="grid grid-flow-col auto-cols-min gap-2 w-max"
        style={{ gridTemplateRows: 'repeat(4, 1fr)', gridAutoFlow: 'column' }}
      >
        {subset.map((key, idx) => (
          <button
            key={`${keyPrefix}-${key}`}
            onClick={() => {
              setBackgroundType('gradient');
              setBackgroundValue(`magic:${key}`);
            }}
            className={cn(
              'block h-8 w-8 shrink-0 cursor-pointer transition-all duration-200 border border-border/20 hover:scale-105',
              backgroundConfig.value === `magic:${key}`
                ? 'rounded-full scale-110'
                : 'rounded-lg'
            )}
            style={{
              background: magicGradients[key],
              gridArea: `${(idx % 4) + 1} / ${Math.floor(idx / 4) + 1}`,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <SectionWrapper
      title="Magic Gradients"
      sectionId="bg-magic-gradients"
      defaultOpen={true}
      advancedContent={advancedKeys.length > 0 ? renderGridRows(advancedKeys, 'magic-adv') : undefined}
      action={
        <button
          onClick={(e) => {
            e.stopPropagation();
            shuffleMagicGradient();
          }}
          className="py-0.5 bg-muted hover:bg-card cursor-pointer border border-border/20 rounded-md transition-colors flex text-[10px] text-muted-foreground space-x-1 px-2 items-center"
        >
          <span>SHUFFLE</span>
          <ShuffleIcon size={12} />
        </button>
      }
    >
      {renderGridRows(primaryKeys, 'magic-pri')}
    </SectionWrapper>
  );
})()}
```

- [ ] **Step 5: Split Gradients (classic primary, mesh advanced)**

Replace the `<SectionWrapper title="Gradients" ...>` block:

```tsx
<SectionWrapper
  title="Gradients"
  sectionId="bg-gradients"
  defaultOpen={true}
  advancedContent={
    <div className="overflow-x-auto scrollbar-hide">
      <div
        className="grid grid-flow-col auto-cols-min gap-2 w-max"
        style={{ gridTemplateRows: 'repeat(2, 1fr)', gridAutoFlow: 'column' }}
      >
        {(Object.keys(meshGradients) as MeshGradientKey[]).map((key, idx) => (
          <button
            key={`mesh-${key}`}
            onClick={() => {
              setBackgroundType('gradient');
              setBackgroundValue(`mesh:${key}`);
            }}
            className={cn(
              'block h-8 w-8 shrink-0 cursor-pointer transition-all duration-200 border border-border/20 hover:scale-105',
              backgroundConfig.value === `mesh:${key}`
                ? 'rounded-full scale-110'
                : 'rounded-lg'
            )}
            style={{
              background: meshGradients[key],
              gridArea: `${(idx % 2) + 1} / ${Math.floor(idx / 2) + 1}`,
            }}
          />
        ))}
      </div>
    </div>
  }
>
  <div className="overflow-x-auto scrollbar-hide">
    <div
      className="grid grid-flow-col auto-cols-min gap-2 w-max"
      style={{ gridTemplateRows: 'repeat(2, 1fr)', gridAutoFlow: 'column' }}
    >
      {(Object.keys(gradientColors) as GradientKey[]).map((key, idx) => (
        <button
          key={`classic-${key}`}
          onClick={() => {
            setBackgroundType('gradient');
            setBackgroundValue(key);
          }}
          className={cn(
            'block h-8 w-8 shrink-0 cursor-pointer transition-all duration-200 border border-border/20 hover:scale-105',
            backgroundConfig.value === key
              ? 'rounded-full scale-110'
              : 'rounded-lg'
          )}
          style={{
            background: gradientColors[key],
            gridArea: `${(idx % 2) + 1} / ${Math.floor(idx / 2) + 1}`,
          }}
        />
      ))}
    </div>
  </div>
</SectionWrapper>
```

- [ ] **Step 6: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add components/editor/sections/BackgroundSection.tsx
git commit -m "feat: split Background sub-sections into primary + Advanced"
```

---

### Task 9: Build the randomize picker module

**Files:**
- Create: `lib/randomize/index.ts`

Pure pick functions. No store imports. Deterministic structure so they're easy to reason about.

- [ ] **Step 1: Write the module**

```typescript
// lib/randomize/index.ts
// Pure pick functions for the four randomize buttons. No store coupling.
// Each picker avoids returning `current` when alternatives exist (up to `rerollAttempts` tries).

import {
  RANDOMIZE_RANGES,
} from '@/lib/editor/sidebar-config';
import type { ImageStylePreset, ShadowPreset, ImageBorder } from '@/lib/store';
import type { BackgroundConfig } from '@/lib/constants/backgrounds';
import { TRANSFORM_PRESETS, type TransformPreset } from '@/lib/constants/transform-presets';
import { backgroundCategories } from '@/lib/r2-backgrounds';
import { gradientColors, type GradientKey } from '@/lib/constants/gradient-colors';
import { meshGradients, magicGradients, type MeshGradientKey, type MagicGradientKey } from '@/lib/constants/mesh-gradients';
import { ANIMATION_PRESETS } from '@/lib/animation/presets';
import type { AnimationPreset } from '@/types/animation';

/** Pick a random element from `pool`, trying up to `attempts` times to avoid `current`. */
function pickDifferent<T>(pool: readonly T[], current: T, attempts: number, eq: (a: T, b: T) => boolean): T {
  if (pool.length === 0) return current;
  if (pool.length === 1) return pool[0];
  for (let i = 0; i < attempts; i++) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (!eq(candidate, current)) return candidate;
  }
  // Fall back to any element; after N tries we accept a repeat rather than loop forever.
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomInRange(min: number, max: number, step: number, currentApprox: number): number {
  const stepsCount = Math.max(1, Math.round((max - min) / step) + 1);
  const attempts = RANDOMIZE_RANGES.rerollAttempts;
  for (let i = 0; i < attempts; i++) {
    const n = min + Math.floor(Math.random() * stepsCount) * step;
    if (Math.abs(n - currentApprox) > step / 2) {
      return roundToStep(n, step);
    }
  }
  return roundToStep(min + Math.random() * (max - min), step);
}

function roundToStep(n: number, step: number): number {
  return Math.round(n / step) * step;
}

// ---------- Frame ----------

export interface FrameRandomResult {
  imageStylePreset: ImageStylePreset;
  borderRadius: number;
  imageScale: number;
  imageBorder: ImageBorder;
  shadowPreset: ShadowPreset;
}

export function pickFrame(current: {
  imageStylePreset: ImageStylePreset;
  borderRadius: number;
  imageScale: number;
  imageBorder: ImageBorder;
  shadowPreset: ShadowPreset;
}): FrameRandomResult {
  const r = RANDOMIZE_RANGES.frame;
  const attempts = RANDOMIZE_RANGES.rerollAttempts;

  const stylePreset = pickDifferent(r.stylePresets, current.imageStylePreset, attempts, (a, b) => a === b);
  const shadowPreset = pickDifferent(r.shadowPresets, current.shadowPreset, attempts, (a, b) => a === b);
  const borderRadius = pickDifferent(r.borderRadiusChoices, current.borderRadius, attempts, (a, b) => a === b);
  const imageScale = Math.round(pickRandomInRange(r.imageScale.min, r.imageScale.max, 1, current.imageScale));
  const padding = pickRandomInRange(r.padding.min, r.padding.max, r.padding.step, current.imageBorder.padding ?? 2);
  const opacity = pickRandomInRange(r.opacity.min, r.opacity.max, r.opacity.step, current.imageBorder.opacity ?? 0.3);

  return {
    imageStylePreset: stylePreset,
    borderRadius,
    imageScale,
    imageBorder: { ...current.imageBorder, padding, opacity },
    shadowPreset,
  };
}

// ---------- Background ----------

export type BackgroundPick =
  | { type: 'image'; value: string }
  | { type: 'gradient'; value: string };

export function pickBackground(current: BackgroundConfig): BackgroundPick {
  const pool: BackgroundPick[] = [];

  // All category image paths
  for (const category of Object.keys(backgroundCategories)) {
    const paths = backgroundCategories[category as keyof typeof backgroundCategories] || [];
    for (const p of paths) pool.push({ type: 'image', value: p });
  }
  // Classic gradients
  for (const k of Object.keys(gradientColors) as GradientKey[]) {
    pool.push({ type: 'gradient', value: k });
  }
  // Mesh gradients (prefixed)
  for (const k of Object.keys(meshGradients) as MeshGradientKey[]) {
    pool.push({ type: 'gradient', value: `mesh:${k}` });
  }
  // Magic gradients (prefixed)
  for (const k of Object.keys(magicGradients) as MagicGradientKey[]) {
    pool.push({ type: 'gradient', value: `magic:${k}` });
  }

  const eq = (a: BackgroundPick, b: BackgroundPick) =>
    a.type === b.type && a.value === b.value;
  const currentAsPick: BackgroundPick = {
    type: current.type === 'image' ? 'image' : 'gradient',
    value: current.value ?? '',
  };

  return pickDifferent(pool, currentAsPick, RANDOMIZE_RANGES.rerollAttempts, eq);
}

// ---------- 3D ----------

export function pick3D(current: { rotateX: number; rotateY: number; rotateZ: number }): TransformPreset {
  const eq = (a: TransformPreset, b: TransformPreset) =>
    Math.abs(a.values.rotateX - b.values.rotateX) < 2 &&
    Math.abs(a.values.rotateY - b.values.rotateY) < 2 &&
    Math.abs(a.values.rotateZ - b.values.rotateZ) < 2;

  const currentAsPreset: TransformPreset = {
    name: '__current__',
    values: {
      perspective: 2400,
      rotateX: current.rotateX,
      rotateY: current.rotateY,
      rotateZ: current.rotateZ,
      translateX: 0,
      translateY: 0,
      scale: 1,
    },
  };
  return pickDifferent(TRANSFORM_PRESETS, currentAsPreset, RANDOMIZE_RANGES.rerollAttempts, eq);
}

// ---------- Motion ----------

/** Returns a random preset distinct from `currentPresetId` when possible. */
export function pickMotion(currentPresetId: string | null): AnimationPreset {
  const eq = (a: AnimationPreset, b: AnimationPreset) => a.id === b.id;
  const dummy: AnimationPreset = {
    ...ANIMATION_PRESETS[0],
    id: currentPresetId ?? '__none__',
  };
  return pickDifferent(ANIMATION_PRESETS, dummy, RANDOMIZE_RANGES.rerollAttempts, eq);
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -10`
Expected: succeeds. `BackgroundConfig` is imported from `@/lib/constants/backgrounds` (where it's actually defined — `lib/store/index.ts:9` imports it from there). `AnimationPreset` type lives in `@/types/animation`; `@/lib/animation/presets` only re-exports the runtime `ANIMATION_PRESETS` array.

- [ ] **Step 3: Commit**

```bash
git add lib/randomize/index.ts
git commit -m "feat: pure random picker functions for frame/bg/3d/motion"
```

---

### Task 10: Add four randomize actions to `useImageStore`

**Files:**
- Modify: `lib/store/index.ts`

Each action calls `set()` exactly once so Zundo records a single history entry per click.

- [ ] **Step 1: Add imports at the top of the store file**

Near the existing imports (around line 10-20):

```typescript
import { pickFrame, pickBackground, pick3D, pickMotion } from '@/lib/randomize';
```

- [ ] **Step 2: Add the four action types to the `ImageState` interface**

Find the interface block where actions like `setImageStylePreset`, `setShadowPreset`, `setPerspective3D` are declared (around lines 602-607). Directly below `setPerspective3D` add:

```typescript
  randomizeFrame: () => void;
  randomizeBackground: () => void;
  randomize3D: () => void;
  randomizeMotion: () => void;
```

- [ ] **Step 3: Add the four action implementations**

Append to the store body (e.g., immediately after the `setSlideOutPreset` action around line 1538, inside the `temporal(...)` block):

```typescript
    randomizeFrame: () => {
      const state = get();
      const next = pickFrame({
        imageStylePreset: state.imageStylePreset,
        borderRadius: state.borderRadius,
        imageScale: state.imageScale,
        imageBorder: state.imageBorder,
        shadowPreset: state.shadowPreset,
      });
      set({
        imageStylePreset: next.imageStylePreset,
        borderRadius: next.borderRadius,
        imageScale: next.imageScale,
        imageBorder: next.imageBorder,
        shadowPreset: next.shadowPreset,
      });
    },

    randomizeBackground: () => {
      const state = get();
      const next = pickBackground(state.backgroundConfig);
      set({
        backgroundConfig: {
          ...state.backgroundConfig,
          type: next.type,
          value: next.value,
        },
      });
    },

    randomize3D: () => {
      const state = get();
      const preset = pick3D({
        rotateX: state.perspective3D.rotateX,
        rotateY: state.perspective3D.rotateY,
        rotateZ: state.perspective3D.rotateZ,
      });
      set({
        perspective3D: { ...state.perspective3D, ...preset.values },
      });
    },

    randomizeMotion: () => {
      const state = get();
      if (state.slides.length === 0) return;
      const currentId = state.slides[0]?.inPresetId ?? null;
      const preset = pickMotion(currentId);
      set({
        slides: state.slides.map((s) => ({ ...s, inPresetId: preset.id })),
      });
    },
```

Rationale for `randomizeMotion`: the codebase uses per-slide `inPresetId`/`outPresetId`. Applying the same picked preset as `inPresetId` to all slides mirrors the intent of a single "randomize the motion" button and keeps the behavior trivial to undo (one `set` call → one history entry). `outPresetId` is intentionally left untouched.

- [ ] **Step 4: Verify build passes**

Run: `pnpm build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add lib/store/index.ts
git commit -m "feat: add randomizeFrame/Background/3D/Motion store actions"
```

---

### Task 11: Build the shared `RandomizeButtons` component

**Files:**
- Create: `components/editor/RandomizeButtons.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/editor/RandomizeButtons.tsx
'use client';

import * as React from 'react';
import { ShuffleIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/lib/store';

interface RandomizeButtonsProps {
  variant: 'left' | 'right';
  className?: string;
}

interface ButtonDef {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

export function RandomizeButtons({ variant, className }: RandomizeButtonsProps) {
  const randomizeFrame = useImageStore((s) => s.randomizeFrame);
  const randomizeBackground = useImageStore((s) => s.randomizeBackground);
  const randomize3D = useImageStore((s) => s.randomize3D);
  const randomizeMotion = useImageStore((s) => s.randomizeMotion);

  const buttons: ButtonDef[] =
    variant === 'left'
      ? [
          { label: 'Frame', ariaLabel: 'Randomize frame styling', onClick: randomizeFrame },
          { label: 'Background', ariaLabel: 'Randomize background', onClick: randomizeBackground },
        ]
      : [
          { label: '3D', ariaLabel: 'Randomize 3D perspective', onClick: randomize3D },
          { label: 'Motion', ariaLabel: 'Randomize motion preset', onClick: randomizeMotion },
        ];

  return (
    <div className={cn('grid grid-cols-2 gap-1.5', className)}>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          aria-label={b.ariaLabel}
          className={cn(
            'flex items-center justify-between gap-2 h-9 px-3 rounded-lg',
            'bg-muted/80 dark:bg-muted/50 border border-border/20',
            'text-sm text-foreground',
            'hover:bg-accent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <span className="font-medium truncate">{b.label}</span>
          <ShuffleIcon size={14} className="text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add components/editor/RandomizeButtons.tsx
git commit -m "feat: add shared RandomizeButtons component"
```

---

### Task 12: Mount `RandomizeButtons` in the left panel

**Files:**
- Modify: `components/editor/LeftEditPanel.tsx`

Place between `ModeDropdown` and the tab navigation. Always visible regardless of tab.

- [ ] **Step 1: Add the import**

At the top of the file, alongside the existing component imports:

```tsx
import { RandomizeButtons } from '@/components/editor/RandomizeButtons';
```

- [ ] **Step 2: Insert the component**

Find the JSX block containing `<ModeDropdown />` (around line 127-130):

```tsx
      {/* Mode Dropdown */}
      <div className="px-2.5 pt-2.5 pb-1 shrink-0">
        <ModeDropdown />
      </div>

      {/* Tab Navigation */}
      <div className="px-2.5 py-2.5 border-b border-border/30 shrink-0">
```

Insert a new block between them:

```tsx
      {/* Mode Dropdown */}
      <div className="px-2.5 pt-2.5 pb-1 shrink-0">
        <ModeDropdown />
      </div>

      {/* Randomize (Frame + Background) */}
      <div className="px-2.5 pt-1.5 pb-1 shrink-0">
        <RandomizeButtons variant="left" />
      </div>

      {/* Tab Navigation */}
      <div className="px-2.5 py-2.5 border-b border-border/30 shrink-0">
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add components/editor/LeftEditPanel.tsx
git commit -m "feat: mount RandomizeButtons (left) below ModeDropdown"
```

---

### Task 13: Mount `RandomizeButtons` in the right panel

**Files:**
- Modify: `components/editor/unified-right-panel.tsx`

Pin above the tab navigation so 3D + Motion randomize buttons are always visible.

- [ ] **Step 1: Add the import**

```tsx
import { RandomizeButtons } from '@/components/editor/RandomizeButtons';
```

- [ ] **Step 2: Insert the component**

Find the JSX block starting at:

```tsx
  return (
    <div className="w-full h-full bg-card flex flex-col overflow-hidden md:w-[460px] border-r border-border/40 relative">
      {/* Tab Navigation */}
      <div className="px-3 py-3 border-b border-border/30 shrink-0">
```

Insert before `{/* Tab Navigation */}`:

```tsx
      {/* Randomize (3D + Motion) */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <RandomizeButtons variant="right" />
      </div>

      {/* Tab Navigation */}
      <div className="px-3 py-3 border-b border-border/30 shrink-0">
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add components/editor/unified-right-panel.tsx
git commit -m "feat: mount RandomizeButtons (right) above tab nav"
```

---

### Task 14: End-to-end manual verification

No code changes. Run the authoritative acceptance checklist from the spec against a running dev server.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

Open `http://localhost:3000/editor` (or wherever the editor mounts).

- [ ] **Step 2: Walk the manual checklist**

Tick each item only after observing the behavior:

- [ ] Upload a screenshot. Click each of the 4 randomize buttons (Frame, Background, 3D, Motion). Canvas updates each time.
- [ ] `Cmd+Z` after each randomize reverts in exactly one step.
- [ ] `Cmd+Shift+Z` re-applies.
- [ ] The header undo button behaves identically to `Cmd+Z`.
- [ ] All 4 randomize buttons remain visible when switching tabs (Design / Layers / BG / Adjust / 3D / Motion).
- [ ] Randomize never clears uploaded image, image overlays, text overlays, annotations, browser mockup, or slide timeline.
- [ ] Clicking any randomize button 10× in a row produces varied values (no immediate repeats).
- [ ] On a fresh load (clear `localStorage` via devtools → `localStorage.clear()` → hard refresh), each section with advanced content shows primary visible and Advanced collapsed.
- [ ] Toggling a section's primary open/closed does not affect its Advanced open/closed, and vice versa.
- [ ] Both section open state and Advanced open state survive a full page reload.
- [ ] In a private tab (no `localStorage`), the app still works — open/closed state is in-memory only, no errors in the console.

- [ ] **Step 3: If any checkbox fails, log a follow-up task**

Open a new bullet list under a `## Follow-ups` header in this plan file (or in a new plan) capturing what failed. Do **not** silently mark the checklist as passed.

- [ ] **Step 4: Final commit (only if no follow-ups)**

```bash
git commit --allow-empty -m "chore: sidebar disclosure + randomize buttons verified"
```

---

## Self-Review Notes

**Spec coverage:**
- Centralized config → Task 2 (`sidebar-config.ts`).
- `SectionWrapper` extension → Task 4.
- Disclosure persistence → Task 5 (`disclosure-store.ts`).
- Per-section primary/advanced splits: Style (6), Border (7), Shadow (no advanced — sectionId-only in Task 5), Background (8), Transforms (sectionId-only in Task 3).
- Randomize pickers → Task 9.
- Randomize store actions → Task 10.
- Randomize UI component → Task 11.
- Left-panel placement → Task 12.
- Right-panel placement → Task 13.
- Architecture decision doc → Task 1.
- Acceptance via manual checklist → Task 14.

**Placeholder scan:** No "TBD" / "implement later" strings; every code step shows complete code.

**Type / name consistency:**
- `sectionId` is consistently the first required prop everywhere.
- `advancedContent` (not `advanced` alone) used consistently in props, JSX, and state references.
- Pickers (`pickFrame`, `pickBackground`, `pick3D`, `pickMotion`) match the action names (`randomizeFrame`, `randomizeBackground`, `randomize3D`, `randomizeMotion`) in Task 10.
- `DISCLOSURE_FOLDS` / `RANDOMIZE_RANGES` names match between Task 2 (definition) and Tasks 8-9 (consumption).
- `TRANSFORM_PRESETS` name matches between Task 3 (definition) and Tasks 3, 9 (usage).

**Known safe gap:** If `RightSettingsPanel.tsx` has more `<SectionWrapper>` call sites than catalogued in Task 5 Step 2, they surface as type errors during `pnpm build` — engineer fixes each one by assigning an `rs-<kebab>` `sectionId`. The build-fail-fast loop prevents a silent miss.
