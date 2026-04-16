# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot Studio (aka "Stage") is a fork of [KartikLabhshetwar/screenshot-studio](https://github.com/KartikLabhshetwar/screenshot-studio), rebuilt with vinext (Vite-powered Next.js) instead of standard webpack, with optimized timeline/export features. Users upload images, customize backgrounds/frames/3D effects/animations, and export high-quality images or videos. No backend auth, no signup — everything runs entirely in-browser. Deployed to Cloudflare Workers via `vinext deploy`.

**Live:** [screenshot-studio.com](https://screenshot-studio.com)

## Commands

```bash
pnpm install          # Install dependencies (pnpm preferred, bun.lock also present)
pnpm dev              # Dev server via vinext (Vite-based Next.js)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint auto-fix
pnpm deploy           # Deploy to Cloudflare Workers via vinext
pnpm deploy:preview   # Deploy to preview environment
```

Dev server runs at `localhost:3000`. No test framework is configured.

## Tech Stack

- **Next.js 16** with App Router, built via **vinext** (Vite replaces webpack)
- **React 19** with React Compiler enabled (`reactCompiler: true` in next.config.ts)
- **TypeScript 5.9** (strict mode)
- **Tailwind CSS 4** via PostCSS
- **Zustand** for state + **Zundo** for undo/redo
- **Konva/React-Konva** for 2D canvas rendering
- **FFmpeg WASM / WebCodecs / MediaRecorder** for video export
- **Cloudflare R2** for asset storage (optional)
- **PostHog** for analytics (proxied through `/svc/*` rewrites)

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details. Key points:

### Dual Zustand Store (`lib/store/index.ts`)

- **`useImageStore`** — all design state: image, background, overlays, transforms, 3D perspective, timeline/animation clips, slides. Has Zundo undo/redo.
- **`useEditorStore`** — canvas rendering state: screenshot ref, background mode, shadow, frame, dimensions.
- **`EditorStoreSync`** component keeps them in sync via React effects.

### Hybrid Canvas Rendering

Three layers composited during export:
1. **Background** (HTML/CSS) → captured with html2canvas
2. **User Image** (Konva Stage) → precise positioning
3. **Overlays** (text & image) → composited on top

### Video Export Encoder Selection

```
GIF   → FFmpeg WASM (only option)
WebM  → MediaRecorder (native)
MP4   → WebCodecs (if available) → FFmpeg (fallback)
```

FFmpeg WASM requires `SharedArrayBuffer`, which needs COOP/COEP headers — only enabled on `/editor/*` and `/home` routes (not globally, to avoid breaking landing page embeds).

### Animation System (`lib/animation/`)

Custom keyframe interpolation engine with 8 easing functions and 20+ presets. Timeline playback runs via `requestAnimationFrame` in `useTimelinePlayback` hook.

## Key Conventions

### Styling

- **Always use CSS theme variables** via Tailwind: `bg-background`, `text-foreground`, `bg-card`, `border-border`
- **Never hardcode colors**: no `bg-white`, `text-black`, `bg-neutral-*`, or hex values
- Theme tokens defined in `app/globals.css`

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Types: PascalCase interfaces

### Imports

Path alias `@/*` maps to project root (configured in tsconfig.json).

## API Routes (`app/api/`)

| Route | Purpose |
|-------|---------|
| `/api/screenshot` | Website screenshot via Screen-Shot.xyz API |
| `/api/tweet/[id]` | Tweet data fetching |
| `/api/image-proxy` | Proxy for external images (CORS) |
| `/api/export` | Server-side export handling |

## Environment Variables

All optional — core features work without any configuration:

```env
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ACCOUNT_ID  # Cloudflare R2
DATABASE_URL=postgresql://...                                            # Screenshot caching
SCREENSHOT_API_URL=https://api.screen-shot.xyz                          # Default, no key needed
```

## Common Extension Points

- **New background**: Add to `lib/constants/backgrounds.ts`
- **New animation preset**: Add to `lib/animation/presets.ts`, use `clonePresetTracks()` when applying
- **New browser mockup**: Add toolbar in `components/canvas/frames/BrowserToolbar.tsx`, update `canvas-dimensions.ts` for header height
- **New control panel**: Create in `components/controls/`, connect to Zustand store
- **Export logic**: Image in `lib/export/export-service.ts`, video in `lib/export/export-slideshow-video.ts`
