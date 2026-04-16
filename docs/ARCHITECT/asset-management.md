# Asset Management

> See also: ARCHITECTURE.md — "Tech Stack > Image Processing & Storage", "Environment Variables"

## Overview

Stage serves all static assets (backgrounds, overlays, demo images) from the `/public` directory via Next.js static file serving. The codebase retains an `r2.ts` abstraction layer — originally built for Cloudflare R2 and Cloudinary — that now resolves paths locally. Three registry modules (`r2-backgrounds.ts`, `r2-overlays.ts`, `r2-demo-images.ts`) enumerate every available asset by category so the UI can render galleries without filesystem reads.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Asset hosting | **Self-hosted `/public` static files** | Zero external CDN dependency; assets ship with the deployment; simplifies local dev |
| Previous hosting | Cloudflare R2 + Cloudinary | Migrated away to reduce external service coupling and simplify the stack |
| URL resolution layer | **`r2.ts` with `getR2PublicUrl` / `getR2ImageUrl`** | Thin abstraction that normalizes paths with a leading slash; makes a future CDN migration a single-file change |
| Asset registries | **TypeScript constant arrays** in `r2-backgrounds.ts`, `r2-overlays.ts`, `r2-demo-images.ts` | Static enumeration avoids runtime filesystem reads; `as const` gives literal types for type safety |
| Background categories | **Object keyed by category name** (assets, mac, radiant, mesh, demo, paper, raycast, pattern) | Enables category-based gallery browsing in the UI |
| Overlay organization | **Two groups: arrows (SVG) and shadows (WebP)** | Distinct visual types with different rendering needs |

## Key Files

| File | Purpose |
|------|---------|
| `lib/r2.ts` | URL resolution helpers (`getR2PublicUrl`, `getR2ImageUrl`); handles blob/data/http URLs as passthrough |
| `lib/r2-backgrounds.ts` | Registry of background images organized by category; exports `backgroundCategories`, `getBackgroundUrl`, `getBackgroundThumbnailUrl` |
| `lib/r2-overlays.ts` | Registry of overlay assets (arrows + shadow overlays); exports `ARROW_PATHS`, `SHADOW_OVERLAY_PATHS`, `getOverlayUrl` |
| `lib/r2-demo-images.ts` | Registry of demo screenshot images; exports `demoImagePaths`, `getDemoImageUrl` |
| `public/` | Static asset root — subdirectories: `assets/`, `mac/`, `radiant/`, `mesh/`, `demo/`, `paper/`, `raycast/`, `pattern/`, `overlays/`, `overlay-shadow/` |

## Data Flow

### Asset Resolution

```
Component needs a background/overlay image
  |
  v
Import from registry module (e.g., backgroundCategories["mesh"])
  |
  v
Get path string (e.g., "/mesh/mesh1.webp")
  |
  v
Pass through getR2PublicUrl() or getR2ImageUrl()
  |-- starts with "/" --> return as-is (Next.js /public serving)
  |-- starts with "http" / "blob:" / "data:" --> return as-is (passthrough)
  |-- no leading slash --> prepend "/" and return
  |
  v
Rendered in <img> or used as CSS background-image
```

### Asset Categories

| Category | Directory | Count | Format | Purpose |
|----------|-----------|-------|--------|---------|
| assets | `/assets/` | 7 | AVIF, JPG | General-purpose backgrounds |
| mac | `/mac/` | 10 | JPEG, JPG, PNG | macOS-style wallpapers |
| radiant | `/radiant/` | 9 | JPG | Gradient-style backgrounds |
| mesh | `/mesh/` | 17 | WebP | Mesh gradient backgrounds |
| demo | `/demo/` | 11 | PNG | Demo screenshot images |
| paper | `/paper/` | 8 | WebP | Paper texture backgrounds |
| raycast | `/raycast/` | 26 | WebP | Raycast-inspired backgrounds |
| pattern | `/pattern/` | 11 | WebP | Repeating pattern backgrounds |
| arrows | `/overlays/arrow/` | 10 | SVG | Arrow overlay decorations |
| shadows | `/overlay-shadow/` | 19 | WebP | Shadow overlay effects |

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|---------------|
| Cloudflare R2 (previous) | External service dependency; adds latency for cold reads; requires API keys and CORS config |
| Cloudinary (previous) | Per-transform billing; URL complexity; external dependency |
| Next.js Image Optimization for static assets | Overkill for pre-optimized assets already in WebP/AVIF; adds server-side processing cost |
| Dynamic filesystem scan at build time | Fragile; requires build-step integration; static arrays are simpler and give full type safety |
| Keeping the R2 abstraction layer | Retained intentionally — the `r2.ts` module is a one-file abstraction that makes a future CDN migration trivial |
