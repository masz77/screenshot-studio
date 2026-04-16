# Export Pipeline

> See also: ARCHITECTURE.md -- "Architecture Patterns > Export Pipeline", "Key Features Implementation > 6. Export System", "Data Flow > Export Flow", "Performance Considerations > Export Performance"

## Overview

The export pipeline converts the live HTML/CSS canvas into a downloadable image file. It captures the DOM tree using `modern-screenshot` (domToCanvas), applies post-processing for effects that don't render in DOM capture (blur regions), optionally compresses via a Sharp API endpoint, and delivers the result as a downloaded file or clipboard copy. Heavy image processing operations are offloaded to a Web Worker to keep the UI responsive.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DOM capture library | **modern-screenshot (domToCanvas)** | Better CSS fidelity than html2canvas for box-shadows, CSS filters, border-radius, and 3D perspective transforms. Single capture of the entire `[data-html-canvas]` container. |
| Image compression | **Sharp via `/api/export` serverless endpoint** with browser `canvas.toBlob()` fallback | Sharp (MozJPEG/libwebp/zlib) produces significantly smaller files at the same visual quality. Falls back to browser encoding if the API is unavailable, times out (30s), or source exceeds 4MB Vercel limit. |
| Export formats | **PNG, JPEG, WebP** | PNG for lossless/transparency, JPEG for smallest size with MozJPEG, WebP for best quality-to-size ratio. |
| Worker offloading | **Web Worker via `export-worker-service.ts`** | Gaussian noise generation, blur, opacity, and compositing are CPU-intensive pixel operations. Running them on the main thread causes jank. The worker uses `OffscreenCanvas` for canvas operations and transfers `ImageData` buffers for zero-copy performance. |
| Progress tracking | **Callback-based with smooth animation** | `exportElement()` accepts an `onProgress` callback that reports 0-95%. The `useExport` hook wraps this with a `requestAnimationFrame`-based animator that eases between reported values for visually smooth progress bars. |
| Storage | **IndexedDB for exports and preferences** | Exported images are persisted in IndexedDB (`exports` store) with metadata. Export settings (format, quality, scale) are saved in an `export-preferences` store so they persist across sessions. |

## Key Files

| File | Purpose |
|------|---------|
| `lib/export/export-service.ts` | Core export orchestrator. Contains `exportElement()` (full export with Sharp processing) and `exportElementAsCanvas()` (raw canvas for video frame capture). Handles 3D vs flat capture paths, blur region post-processing, and canvas scaling. |
| `lib/export/sharp-client.ts` | Client-side Sharp API integration. `processWithSharp()` sends canvas to `/api/export` via FormData, falls back to `canvas.toBlob()`. Handles source blob sizing (PNG if <4MB, JPEG q=0.95 fallback for larger images). |
| `lib/export/export-utils.ts` | Utility functions: oklch-to-RGB conversion for styles, noise texture generation (sync and async), image style preservation for cloned DOMs, SVG style conversion, and image load waiting. |
| `lib/export/types.ts` | Type definitions for `ExportFormat` (`png`/`jpeg`/`webp`), `QualityPreset` (`high`/`medium`/`low`), and quality settings constants mapping presets to compression values. |
| `lib/workers/export.worker.ts` | Web Worker that handles: noise texture generation (Gaussian, Box-Muller transform), blur (OffscreenCanvas filter), opacity (alpha channel manipulation), layer compositing (normal/overlay/multiply/screen blend modes), and format conversion (OffscreenCanvas `convertToBlob`). |
| `lib/workers/export-worker-service.ts` | Main-thread API for the export worker. Singleton `ExportWorkerService` class handles worker lifecycle, message passing with Promise-based API, transferable buffer management, 30s request timeouts, and fallback to main-thread computation if workers are unavailable. |
| `lib/workers/index.ts` | Re-exports worker service and payload types. |
| `hooks/useExport.ts` | React hook providing the export UI API. Manages export settings state, IndexedDB preference persistence, progress animation, download trigger, clipboard copy, confetti celebration, analytics tracking, and error handling with toast notifications. |
| `lib/export-storage.ts` | IndexedDB operations for saving/loading exported images and export preferences. |
| `components/canvas/ClientCanvas.tsx` | Exposes `getCanvasContainer()` which returns the `HTMLDivElement` ref used as the export source element. |

## Data Flow

### Image export (download)

```
User clicks "Export"
  │
  ▼
useExport.exportImage()
  ├── Read export settings (format, qualityPreset, scale)
  ├── Get aspect ratio preset → exportWidth, exportHeight
  ├── Get canvasContainer ref from ClientCanvas.getCanvasContainer()
  │
  ▼
exportElement() [lib/export/export-service.ts]
  │
  ├── [0-10%] DOM preparation
  │     Wait for pending React renders (double rAF)
  │     Find #image-render-card → [data-html-canvas] container
  │
  ├── [10-55%] Canvas capture (one of two paths)
  │     │
  │     ├─ 3D transform active?
  │     │   YES → capture3DTransformWithModernScreenshot()
  │     │          ├── Find [data-3d-overlay] element
  │     │          ├── domToCanvas(container, { scale, filter, onCloneNode })
  │     │          │     filter: exclude resize handles, blur regions
  │     │          │     onCloneNode: set overflow:visible on canvas container
  │     │          ├── applyBlurRegionsToCanvas() (post-process)
  │     │          └── Resize to target dimensions if needed
  │     │
  │     │   NO → exportHTMLCanvas()
  │     │         ├── Calculate export scale from container → target dimensions
  │     │         ├── domToCanvas(container, { scale, filter, onCloneNode })
  │     │         ├── applyBlurRegionsToCanvas() (post-process)
  │     │         └── Scale to final dimensions (reuse canvas for video frames)
  │     │
  │     └─ Fallback: if 3D capture fails → exportHTMLCanvas()
  │
  ├── [55-90%] Sharp processing
  │     processWithSharp(canvas, format, qualityPreset)
  │       ├── getSourceBlob(): PNG if <4MB, else JPEG q=0.95
  │       ├── POST /api/export (FormData: image + format + qualityPreset)
  │       │     Sharp compresses with MozJPEG / libwebp / zlib
  │       └── Fallback: canvas.toBlob() with format-specific quality
  │
  └── [90-100%] Delivery
        ├── Save to IndexedDB (exports store)
        ├── Create download link → trigger click → cleanup
        ├── Track analytics (format, quality, scale, fileSize, duration)
        └── Show confetti + success toast
```

### Clipboard copy

```
User clicks "Copy"
  │
  ▼
useExport.copyImage()
  ├── Same exportElement() pipeline but:
  │     format: 'png', qualityPreset: 'medium', scale: 2
  │     skipSharp: true (speed > compression for clipboard)
  │
  ├── Convert to PNG blob if not already PNG
  │     (Clipboard API requires image/png)
  │
  └── navigator.clipboard.write([ClipboardItem])
        → confetti + success toast
```

### Video frame capture

```
exportElementAsCanvas() [called by video export pipeline]
  │
  ├── Same DOM capture as exportElement() but:
  │     skipDelay: true (no rAF wait -- video frames are sequential)
  │     Returns raw HTMLCanvasElement (no Sharp, no blob)
  │
  └── Reuses canvas allocation for sequential frames
        (reusableCanvas/reusableCtx pattern to reduce GC pressure)
```

## Web Worker Architecture

```
Main Thread                          Worker Thread (export.worker.ts)
─────────────────────────────────    ─────────────────────────────────
ExportWorkerService (singleton)
  │                                  ctx.onmessage handler
  ├── initializeWorker()                 │
  │   new Worker('./export.worker.ts')   ├── 'ready' signal on init
  │                                      │
  ├── sendMessage(type, payload)  ──→    ├── 'generateNoise'
  │   pendingRequests.set(id, {})        │     Gaussian noise (Box-Muller)
  │                                      │     → ImageData (transferred)
  │                        ←── result    │
  │   pendingRequests.get(id).resolve()  ├── 'applyBlur'
  │                                      │     OffscreenCanvas filter
  │                                      │     → ImageData (transferred)
  │                                      │
  │                                      ├── 'applyOpacity'
  │                                      │     Alpha channel manipulation
  │                                      │     → ImageData (transferred)
  │                                      │
  │                                      ├── 'composite'
  │                                      │     Pixel-level blend modes
  │                                      │     (normal/overlay/multiply/screen)
  │                                      │     Supports tiled overlays
  │                                      │     → ImageData (transferred)
  │                                      │
  │                                      └── 'convertFormat'
  │                                            OffscreenCanvas.convertToBlob()
  │                                            → ArrayBuffer (transferred)
  │
  └── Every operation has main-thread fallback
      (runs if worker init fails, times out, or errors)
```

**Buffer transfer**: All `ImageData` results use `postMessage` with `transfer` option to move the underlying `ArrayBuffer` to the receiving thread without copying. This is critical for large images where copying pixel data would be expensive.

**Lifecycle**: The worker is lazily initialized on first use with a 5s timeout. If initialization fails, all operations fall back to synchronous main-thread equivalents. A 30s timeout per request prevents hung operations.

## Quality Presets

| Preset | JPEG Quality | PNG Compression | WebP Quality |
|--------|-------------|-----------------|-------------|
| High | 85% | Level 6 | 82% |
| Medium | 75% | Level 9 | 72% |
| Low | 60% | Level 9 | 55% |

## Blur Region Post-Processing

CSS `backdrop-filter: blur()` does not render in `domToCanvas`. The export pipeline handles this by:

1. Excluding `[data-blur-region]` elements from the DOM capture (via `filter` option)
2. After capture, reading `blurRegions` from `useImageStore`
3. For each visible region: clipping a rectangle on the canvas, applying `ctx.filter = blur(Npx)`, and redrawing the source pixels within that clip

This ensures blur regions appear correctly in exports despite the CSS limitation.

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|---------------|
| **html2canvas** | Cannot capture CSS 3D transforms. Has issues with oklch colors, complex box-shadows, and font rendering. `modern-screenshot` handles all of these correctly. |
| **All processing on main thread** | Noise generation, blur, and compositing operations on large images (e.g., 3840x2160 at 2x scale) cause multi-second UI freezes. Web Worker offloading keeps the UI responsive. |
| **Always use Sharp API** | Adds latency and has a 4MB upload limit on Vercel. Clipboard copies prioritize speed over compression, so they skip the API. Video frame capture needs raw canvas, not compressed blobs. |
| **Client-side Sharp (WASM)** | Sharp's WASM build is large (~5MB) and would increase bundle size. The serverless endpoint keeps the client lean while still providing MozJPEG/libwebp quality. Browser fallback ensures the feature works without the API. |
| **Canvas 2D API for all rendering** | Would require manually drawing every CSS effect (gradients, shadows, border-radius, frames, 3D transforms) using Canvas 2D draw calls. The HTML/CSS approach leverages the browser's rendering engine and captures it as-is. |
| **Separate layer capture + manual compositing** | The ARCHITECTURE.md describes a multi-step pipeline (background, Konva stage, overlays, composite). The current implementation simplified this to a single `domToCanvas()` call that captures the entire stacked HTML tree at once, avoiding manual layer compositing for the common path. Blur regions are the only post-processing step. |
