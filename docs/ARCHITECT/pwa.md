# PWA (Progressive Web App)

## Overview

Make Screenshot Studio installable on mobile and desktop, and keep the editor usable offline once it has been visited. Built on `vite-plugin-pwa` with the `injectManifest` strategy so we author a real Workbox service worker (`app/sw.ts`) while letting the plugin generate the precache manifest (with content hashes) at build time. Runtime caching covers the app shell, hashed static assets, FFmpeg WASM (cross-origin), and Google Fonts. Updates ship silently via `skipWaiting` + `clientsClaim` — the user explicitly chose no update toast.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Service worker framework | **vite-plugin-pwa with `injectManifest`** | Lets us write our own SW logic while Workbox auto-generates the precache manifest with content hashes (auto-invalidates per deploy). Hand-rolled SW would require manual hash management; `generateSW` strategy is too restrictive for our Workbox routes. |
| HTML caching strategy | **NetworkFirst** | Always try to fetch fresh HTML so deploys propagate immediately; fall back to cached HTML when offline. Preserves cached `Cross-Origin-*` headers for `/editor/*`. |
| Static asset caching | **CacheFirst** for hashed assets (JS/CSS/images/fonts) | Hashed filenames are content-addressed and immutable — safe to serve from cache indefinitely, fastest repeat loads. |
| FFmpeg WASM caching | **CacheFirst** against `unpkg.com/@ffmpeg/*` | FFmpeg WASM is large (~30MB). Opaque cross-origin responses are acceptable here because we only need byte-for-byte replay through `toBlobURL`. |
| Google Fonts | **CacheFirst** for `fonts.gstatic.com`, **StaleWhileRevalidate** for `fonts.googleapis.com` | Font files are immutable; CSS index can change so we revalidate in background. |
| Update flow | **Silent: `skipWaiting` + `clientsClaim`** | User explicitly requested silent updates. New SW takes over on next navigation with no UI prompt. |
| Icon source | **Static PNGs in `public/icons/*` generated from `public/logo.svg`** | PWA install prompts require static, dimensioned PNGs referenced from `manifest.json`. Dynamic `app/icon.tsx` and `app/apple-icon.tsx` routes stay in place for SEO/favicon use. |
| Web App Manifest | **Keep hand-written `public/manifest.json` (`manifest: false` in plugin config)** | We already maintain a manifest; no need for the plugin to overwrite it. Single source of truth. |
| Offline scope | **App shell + previously-cached assets only** | User image data already lives in IndexedDB / in-memory Zustand store (see `docs/ARCHITECT/client-storage.md`). The SW does not duplicate that storage. |
| `/api/*` and `/svc/*` | **NetworkOnly (never cached)** | Screenshot API, image proxy, tweet fetch, and PostHog analytics must always hit the network. Avoids stale data and accidental token caching. |

## Key Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | Web App Manifest (name, icons, theme, display mode, start URL) |
| `public/icons/icon-192.png` | Standard 192×192 PWA icon |
| `public/icons/icon-512.png` | Standard 512×512 PWA icon |
| `public/icons/icon-192-maskable.png` | Maskable 192×192 icon (Android adaptive) |
| `public/icons/icon-512-maskable.png` | Maskable 512×512 icon (Android adaptive) |
| `public/icons/apple-touch-icon.png` | iOS home-screen icon (180×180) |
| `app/sw.ts` | Service worker source (Workbox routes, runtime caching, lifecycle) |
| `vite.config.ts` | `vite-plugin-pwa` configuration (`injectManifest`, `manifest: false`) |
| `components/pwa/ServiceWorkerRegister.tsx` | Client component that registers `/sw.js` after mount |
| `app/offline/page.tsx` | Offline fallback page used when navigation cache misses |
| `app/layout.tsx` | Mounts `ServiceWorkerRegister`, declares iOS PWA meta tags via Metadata API |
| `public/_headers` | Cloudflare headers config — `Cache-Control: no-cache` on `/sw.js` so updates are picked up |
| `scripts/generate-pwa-icons.ts` | One-shot generator that rasterizes `public/logo.svg` into all `public/icons/*` PNGs |

## Data Flow

```
First visit
  User ──▶ Cloudflare Worker ──▶ HTML + JS (app shell)
            │
            └─▶ ServiceWorkerRegister mounts ──▶ navigator.serviceWorker.register('/sw.js')
                                                    │
                                                    └─▶ SW install: Workbox precaches build manifest
                                                        (hashed JS/CSS/icons/manifest.json)

Repeat visit (online)
  User navigation ──▶ SW fetch handler
                       │
                       ├─ HTML  ──▶ NetworkFirst ──▶ network OK → cache + respond
                       ├─ /assets/*.{js,css,png}  ──▶ CacheFirst ──▶ precache hit
                       └─ /api/*, /svc/*          ──▶ NetworkOnly

Repeat visit (offline)
  User navigation ──▶ SW fetch handler
                       │
                       ├─ HTML  ──▶ NetworkFirst miss ──▶ cached shell ──▶ if miss → /offline
                       └─ /assets/*               ──▶ CacheFirst hit

FFmpeg load (editor first export)
  Editor calls toBlobURL('https://unpkg.com/@ffmpeg/core/...')
        │
        └─▶ SW intercepts cross-origin GET ──▶ CacheFirst ('ffmpeg-wasm' cache)
              │
              ├─ first time: fetch from unpkg → store opaque response
              └─ subsequent: serve instantly from cache (offline-capable)

Deploy / update
  New deploy ──▶ next navigation fetches new /sw.js (no-cache header)
              ──▶ SW install: new precache manifest (new content hashes)
              ──▶ skipWaiting() ──▶ activates immediately
              ──▶ clientsClaim() ──▶ takes control of open tabs
              ──▶ next navigation served by new SW (transparent to user)
```

## Security Considerations

- **COOP/COEP `credentialless` on `/editor/*` must survive caching.** `next.config.ts` sets these headers so FFmpeg WASM can use `SharedArrayBuffer`. Workbox's NetworkFirst stores the `Response` object intact (headers included), so cached editor HTML continues to satisfy cross-origin isolation when served offline.
- **No API or analytics traffic is cached.** `/api/*` (screenshot, tweet, image-proxy, export) and `/svc/*` (PostHog proxy) are matched as NetworkOnly. This prevents accidental caching of authorization tokens, analytics payloads, or stale third-party data.
- **Service worker scope is `/`.** Served from the origin root with standard same-origin restrictions; cannot be hijacked by subpaths or third-party origins.
- **No user content is persisted by the SW.** User-uploaded images and design state live in IndexedDB / in-memory Zustand stores managed by the app (see `docs/ARCHITECT/client-storage.md`). The SW only caches static build artifacts and explicit third-party libraries (FFmpeg, Google Fonts).
- **Manifest stays under our control.** `manifest: false` in the plugin config prevents the build from overwriting `public/manifest.json`, so icon URLs, scope, and start_url cannot drift from intentional configuration.
- **`/sw.js` is served with `Cache-Control: no-cache`** via `public/_headers`. Without this, Cloudflare or browser HTTP caches could serve a stale SW and prevent updates from ever activating.

## Implementation Status (2026-04-29)

Completed across commits `fee2211` through `1135aed`.

### Build verification
- `dist/sw.js` emitted (~27 KB, 27829 bytes) with Workbox precache manifest
- `dist/client/_headers` includes `/sw.js` no-cache rule (copied from `public/_headers` at build time)
- `dist/client/manifest.json` (1396 bytes) and `dist/client/icons/` (5 PNGs, 88 KB total) in place
- Precache scope excludes large image folders (`mac/`, `mesh/`, `pattern/`, `paper/`, `radiant/`, `raycast/`, `overlay/`, `overlay-shadow/`, `demo/`) — runtime CacheFirst handles them
- First precache URLs: `client/assets/worker-entry-*.{css,js}`, `client/assets/worker-*.js`, `client/assets/webp_enc*.js`, `client/assets/router-*.js`, `client/assets/rolldown-runtime-*.js`, `client/assets/preload-helper-*.js`, `client/assets/index-*.{js,css}`, `client/assets/framework-*.js`, `client/assets/ClientCanvas-*.js` (~20 entries observed)
- Workbox runtime emitted at `dist/client/assets/workbox-window.prod.es5-*.js`
- `dist/client/assets/` is 12 MB total — large but expected (worker bundles, codecs)

### Concerns surfaced during verification (need follow-up tasks)
1. **Service worker emitted at `dist/sw.js`, not `dist/client/sw.js`.** vinext serves static from `dist/client/`, so `/sw.js` may not resolve at the production origin unless the Cloudflare worker / static handler is configured to also serve files from `dist/`. Worth a smoke test: `curl https://screenshot-studio.com/sw.js` after deploy.
2. **Precache manifest URLs are prefixed with `client/`** (e.g. `client/assets/worker-*.js`). At runtime these would resolve as `/client/assets/...` — but production URLs are `/assets/...`. The precache install step is likely to 404 every entry, leaving the SW registered but with an empty cache. Runtime caching routes (CacheFirst on `/assets/*`) should still populate on demand, so the user-facing impact is "no offline app shell" rather than a broken site, but installability + offline fallback may be degraded.
3. The two issues above stem from `vite-plugin-pwa` running against the Vite outDir (`dist/`) rather than vinext's client output dir (`dist/client/`). May need a `buildBase` / `outDir` override in `vite.config.ts` or a post-build copy step.

### Manual verification still required (user-driven)
1. `pnpm build && pnpm start` — open `/editor` in incognito Chrome
2. DevTools → Application → Service Workers — confirm `sw.js` activated (or 404 if concern #1 is real)
3. DevTools → Network → reload → `/editor` response keeps `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`
4. Console: `crossOriginIsolated === true`
5. Trigger video export — FFmpeg WASM still works (proves SAB intact)
6. Lighthouse PWA audit — should show "Installable"
7. Test offline: DevTools → Network → Offline → reload → see `/offline` page
8. Test install prompt: Chrome may show install icon in URL bar; trigger install and verify standalone window opens
9. After deploy: `curl -I https://screenshot-studio.com/sw.js` — should return 200 with `Cache-Control: public, max-age=0, must-revalidate`

### Known caveats
- `vite-plugin-pwa@1.2.0` declares peer `vite ^3-7`; project uses vite ^8. Build works but watch for plugin updates.
- Cache TTLs: 30d for static assets, 1y for FFmpeg WASM and Google Fonts, 7d for HTML pages.
- Update flow is silent (`skipWaiting` + `clientsClaim`) per user choice — no toast on new version.
