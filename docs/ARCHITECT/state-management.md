# State Management

> See also: ARCHITECTURE.md — "Architecture Patterns > State Management", "Data Flow > State Update Flow"

## Overview

Stage uses a dual Zustand store pattern to separate design state (what the user is editing) from canvas rendering state (how the canvas engine draws it). The image store (`useImageStore`) is the source of truth for all user-facing design data and supports undo/redo via Zundo. The editor store (`useEditorStore`) holds derived rendering values consumed by the Konva canvas. An `EditorStoreSync` component bridges the two stores using React effects.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State library | **Zustand v5** | Minimal API, no providers, direct subscription from any component; works well with `"use client"` boundary |
| Two stores instead of one | **`useImageStore` + `useEditorStore`** | Separation of concerns: design state (user intent) vs render state (canvas engine values). Prevents Konva re-renders on every design change that doesn't affect rendering. |
| Undo/redo | **Zundo (`temporal` middleware)** on `useImageStore` only | Only design state needs undo/redo; rendering state is derived and doesn't need its own history |
| Store sync mechanism | **`EditorStoreSync` React component** | Uses `useEffect` to watch image store changes and push derived values to editor store. Renders `null` — it's a side-effect-only component mounted in the editor layout. |
| Imperative sync escape hatch | **Direct `useEditorStore.getState()` calls** | `setUploadedImageUrl` and `setActiveSlide` bypass the React effect cycle by writing directly to the editor store for instant canvas updates during export/slide-switching |

## Key Files

| File | Purpose |
|------|---------|
| `lib/store/index.ts` | Both store definitions (`useImageStore`, `useEditorStore`), `useEditorStoreSync` hook, all types and interfaces |
| `lib/store/export-utils.ts` | Export helper used by `useImageStore.exportImage()` |
| `components/canvas/EditorStoreSync.tsx` | Standalone sync component (more detailed sync logic than the hook version in `index.ts`) |
| `components/editor/EditorLayout.tsx` | Mounts `EditorStoreSync` in the component tree |
| `types/animation.ts` | Timeline/animation types consumed by `useImageStore` |

## Data Flow

### Store Ownership

```
useImageStore (design state, with Zundo undo/redo)
  |
  |-- Image: uploadedImageUrl, imageName, imageScale, imageOpacity, borderRadius
  |-- Background: backgroundConfig (type/value/opacity), backgroundBlur, backgroundNoise
  |-- Overlays: textOverlays[], imageOverlays[], mockups[]
  |-- Transforms: perspective3D, imageFilters
  |-- Frame/Border: imageBorder (type, width, color, padding, title, opacity)
  |-- Shadow: imageShadow (blur, offset, spread, color, opacity)
  |-- Layout: selectedAspectRatio, customDimensions
  |-- Presets: imageStylePreset, shadowPreset
  |-- Timeline: timeline (TimelineState), animationClips[], showTimeline
  |-- Slideshow: slides[], activeSlideId, slideshow config, preview state
  |-- Annotations: annotations[], activeAnnotationTool, blurRegions[]
  |-- Export: exportSettings (quality, format, fileName)
  |-- UI: activeRightPanelTab, showTemplates, editorMode, browserUrl

useEditorStore (canvas rendering state, no undo/redo)
  |
  |-- screenshot: { src, scale, offsetX, offsetY, rotation, radius }
  |-- background: { mode, colorA, colorB, gradientDirection }
  |-- shadow: { enabled, elevation, side, softness, spread, color, intensity, offsetX, offsetY }
  |-- pattern: { enabled, type, scale, spacing, color, rotation, blur, opacity }
  |-- frame: { enabled, type, width, color, padding, title, opacity }
  |-- canvas: { aspectRatio, padding }
  |-- noise: { enabled, type, opacity }
```

### Sync Flow

```
User changes a control (e.g., image scale slider)
  |
  useImageStore.setImageScale(75)
  |
  Zustand notifies subscribers
  |
  +-- UI components re-render (sliders, panels)
  +-- Zundo records state snapshot for undo/redo
  +-- EditorStoreSync useEffect triggers
       |
       Reads: imageStore.imageScale (75)
       Derives: scale = 75 / 100 = 0.75
       Writes: editorStore.setScreenshot({ scale: 0.75 })
       |
       Konva canvas re-renders with new scale
```

### Imperative Sync (Export/Slides)

```
useImageStore.setActiveSlide(slideId)
  |
  set({ activeSlideId, uploadedImageUrl: slide.src })
  |
  +-- Normal React effect path (EditorStoreSync)
  +-- ALSO: useEditorStore.getState().setScreenshot({ src: slide.src })
       ^-- Immediate, bypasses effect cycle
       ^-- Necessary during video export where React doesn't re-render between frames
```

### What EditorStoreSync Transforms

| Image Store Value | Editor Store Value | Transformation |
|-------------------|--------------------|----------------|
| `uploadedImageUrl` | `screenshot.src` | Direct pass-through |
| `imageScale` (0-200) | `screenshot.scale` (0-2) | Divide by 100 |
| `borderRadius` | `screenshot.radius` | Direct pass-through |
| `backgroundConfig.type = "gradient"` | `background.mode = "gradient"` | Parse CSS gradient string into `colorA`, `colorB`, `gradientDirection` |
| `backgroundConfig.type = "solid"` | `background.mode = "solid"` | Look up color key in `solidColors` map |
| `imageBorder.*` | `frame.*` | Direct field mapping |
| `imageShadow.*` | `shadow.*` | Compute `elevation`, `side`, `intensity` from raw offset/opacity values |
| `selectedAspectRatio` | `canvas.aspectRatio` | Map internal keys (`4_3`) to display keys (`4:3`); unmapped ratios become `free` |

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Single store** | Would cause unnecessary Konva re-renders when non-rendering state changes (e.g., toggling timeline visibility). Two stores allow fine-grained subscriptions. |
| **Context API** | No built-in subscription optimization; would re-render entire subtree on any state change. Zustand's selector-based subscriptions are critical for canvas performance. |
| **Redux Toolkit** | Heavier API surface; Zustand's simplicity fits a client-only app with no middleware needs beyond undo/redo. |
| **Zundo on both stores** | Editor store is fully derived from image store — undoing editor state independently would create inconsistencies. Only the source-of-truth store needs history. |
| **Jotai (atomic state)** | Atomic model would fragment the design state across many atoms, making undo/redo across the full design snapshot harder to implement. Zustand's single-object store maps naturally to Zundo's temporal snapshots. |
| **Derived store (computed from image store)** | Zustand doesn't natively support derived stores. The `EditorStoreSync` component achieves the same result with explicit control over when and how values are derived. |
