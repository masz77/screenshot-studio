# Editor Footer Spacer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an empty footer bar (half the navbar height) to prevent left sidebar and timeline content from being cut off at the bottom edge of the viewport.

**Architecture:** Add a single `div` spacer at the bottom of the root flex column in `EditorLayout.tsx`. The navbar is `h-14` (56px), so the footer is `h-7` (28px). Desktop only — mobile layout is unaffected.

**Tech Stack:** Tailwind CSS

---

### Task 1: Add footer spacer to EditorLayout

**Files:**
- Modify: `components/editor/EditorLayout.tsx:115` (before closing `</div>` of root container)

- [ ] **Step 1: Add the footer div**

Inside the root `div.h-screen.flex.flex-col` container, after the `flex-1 flex overflow-hidden` main content div (line 115), add an empty footer spacer visible only on desktop:

```tsx
      {/* Footer spacer — half navbar height to prevent bottom content clipping */}
      {!isMobile && (
        <div className="h-7 bg-card border-t border-border/40 shrink-0" />
      )}
    </div>
```

The full return JSX ending becomes:

```tsx
        {/* Mobile Sheet */}
        {isMobile && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent
              side="left"
              className="w-[460px] p-0 sm:max-w-[460px]"
            >
              <UnifiedRightPanel />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Footer spacer — half navbar height to prevent bottom content clipping */}
      {!isMobile && (
        <div className="h-7 bg-card border-t border-border/40 shrink-0" />
      )}
    </div>
```

- [ ] **Step 2: Verify visually**

Run: `pnpm dev`

Check:
1. Left sidebar — "1 layer" section and bottom items are fully visible, not clipped
2. Timeline editor — bottom track row is fully visible when timeline is open
3. Footer bar appears as a thin strip matching the header's card background and border style
4. On mobile (resize browser < 768px) — footer does not appear

- [ ] **Step 3: Commit**

```bash
git add components/editor/EditorLayout.tsx
git commit -m "fix: add footer spacer to prevent sidebar/timeline bottom clipping"
```
