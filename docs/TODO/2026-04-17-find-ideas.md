# Ideas — 2026-04-17

Generated from a full-codebase scan across six dimensions: security, performance, code improvements, code quality, UI/UX, documentation.

## Project Summary

Screenshot Studio is a mature, browser-only editor (Next.js 16 + vinext, React 19, Zustand + Zundo) fresh off a major refactor: slot-based timeline, slide transitions, and a new per-slide in/out preset animation model that replaced the old clip system. Architecture is solid (clean layered rendering, custom animation engine, encoder auto-selection), but the codebase shows classic signs of rapid feature velocity: a 1,657-line monolithic store, 700+ line canvas layers, 80MB+ of unoptimized PNGs in `/public`, an in-memory rate limiter incompatible with Cloudflare Workers, zero tests, and a single top-level error boundary.

---

## Security

### Rate limiter won't work on Cloudflare Workers

**Problem:** `lib/rate-limit.ts:1` uses an in-memory `Map<string, ...>`. On Cloudflare Workers each request may hit a different isolate, and isolates are ephemeral — the map resets constantly, making `checkRateLimit` effectively a no-op in production. The only protected route (`app/api/screenshot/route.ts:131`) is wide open.

**What to do:** Replace with Cloudflare KV (TTL per-window) or a Durable Object counter. Bind `RATE_LIMIT_KV` in `wrangler.jsonc`, read/write keys like `rl:${ip}:${window}`. For `app/api/image-proxy/route.ts` (no rate limit at all), add the same guard.

**Impact:** The screenshot API hits a third-party service; unbounded traffic = abuse vector + bill risk.
**Effort:** Small

---

### `image-proxy` has no rate limit and no size cap

**Problem:** `app/api/image-proxy/route.ts` proxies arbitrary Twitter CDN URLs with `await response.arrayBuffer()` — no content-length check, no streaming, no rate limit. An attacker can spray the endpoint or request maximally-sized media to exhaust worker CPU/memory (128 MB limit on Workers).

**What to do:** In `app/api/image-proxy/route.ts:22`, check `response.headers.get('content-length')` and reject >10 MB. Stream the response via `new Response(response.body)` instead of materializing an ArrayBuffer. Add the upgraded rate limiter.

**Impact:** Reduces DoS/cost-amplification surface.
**Effort:** Small

---

## Performance

### 80+ MB of unoptimized PNG/JPG in `public/`

**Problem:** `public/raycast` = 40 MB, `public/mac` = 23 MB (`mac-asset-7.png` alone is 13 MB), `public/demo` = 18 MB. These are demo/asset images shipped with the Worker bundle. Even though Cloudflare serves them as static assets, 13 MB PNGs crush LCP/mobile UX.

**What to do:** Convert to AVIF/WebP via a one-shot script using `@jsquash/png` + `@jsquash/webp` (already in deps). Target <300 KB per image. Update references in `lib/constants/backgrounds.ts` and `r2-*.ts` if applicable. Consider moving the largest assets to R2 and serving via the existing `r2-*` loaders.

**Impact:** Faster first paint, smaller deploy, lower Workers egress.
**Effort:** Medium

---

### `EditorStoreSync` runs a 150-line diff-and-write on every image-store change

**Problem:** `lib/store/index.ts:400-537` — `EditorStoreSync` is a `useEffect` that compares ~15 fields between two stores and writes to the editor store on any mismatch. The dependency array at line 528 includes object references (`backgroundConfig`, `imageBorder`, `imageShadow`) that are replaced on every setter call, causing this effect to fire on virtually every state change. Each call does N equality checks + potential writes that trigger further renders.

**What to do:** Replace the `useEffect` mirror with Zustand's `subscribeWithSelector` middleware — subscribe to each primitive field independently and write only the changed slice. Or eliminate the dual-store entirely: if `useEditorStore` is purely derived, make it selectors on `useImageStore` instead of a mirrored store.

**Impact:** Removes per-keystroke re-renders across the canvas; likely the biggest single perf win in the editor.
**Effort:** Medium

---

## Code Improvements

### `lib/store/index.ts` is 1,657 lines — split by domain

**Problem:** One file holds: types, helpers (`parseGradientColors`), `EditorState`, `EditorStoreSync`, `ImageState`, setters for overlays, mockups, annotations, filters, 3D transforms, timeline, slides, and Zundo config. Any touch to one domain invalidates the whole file's review surface.

**What to do:** Split into:
- `lib/store/types.ts` — all interfaces
- `lib/store/editor-store.ts` — `useEditorStore`
- `lib/store/image-store.ts` — `useImageStore`
- `lib/store/sync.ts` — `EditorStoreSync`
- `lib/store/slices/` — `overlays.ts`, `annotations.ts`, `slides.ts`, `transforms.ts` using Zustand slice pattern

Re-export from `lib/store/index.ts` to keep imports stable.

**Impact:** Reviewability, easier testing, unblocks future work like persisting specific slices.
**Effort:** Medium

---

### Eight `console.error`/`log` inside `export-worker-service.ts`

**Problem:** `lib/workers/export-worker-service.ts` has 9 console calls, `hooks/useExport.ts` has 5, `lib/image-storage.ts` has 4. These ship to production. Some are error paths that silently swallow failures (`lib/store/index.ts:172` — `catch (e) { /* Use defaults */ }`). No central error reporting.

**What to do:** Create `lib/logger.ts` with a thin wrapper that forwards to PostHog `capture_exception` in production and `console` in dev. Replace `console.error` at the catch sites with `logger.error(err, context)`. Remove noisy `console.log`.

**Impact:** Errors stop disappearing; PostHog already loaded (see `instrumentation-client.ts`) so no new dep.
**Effort:** Small

---

## Code Quality

### Zero tests in a codebase with complex pure logic

**Problem:** `find . -name "*.test.*"` returns nothing. No Vitest, no Playwright. Yet `lib/animation/interpolation.ts`, `lib/animation/build-playback-data.ts`, `lib/aspect-ratio-utils.ts`, and `app/api/screenshot/route.ts:normalizeUrl` are all pure-logic modules that would be trivial to test. The recent `slide-transitions` refactor touched playback data and exit presets with no safety net.

**What to do:** Add Vitest (`pnpm add -D vitest @vitest/ui`). Seed with tests for:
1. `normalizeUrl` (app/api/screenshot/route.ts:8) — URL normalization edge cases
2. `buildPlaybackData` (lib/animation/build-playback-data.ts) — per-slide in/out expansion
3. `parseGradientColors` (lib/store/index.ts:141) — gradient string parsing

**Impact:** Catch regressions in the animation engine, which the last 10 commits all touched.
**Effort:** Small (initial setup) / Medium (full coverage)

---

### `as any` in 8 files across the export pipeline

**Problem:** `grep` shows 19 `any` occurrences across 8 files. `lib/export/export-service.ts` has 5, `lib/export/export-utils.ts` has 4 — these are the export pipeline, where type precision would catch real bugs (wrong codec options, missing format fields).

**What to do:** Audit the 19 sites; most are likely `as any` on FFmpeg/WebCodecs option objects where a `satisfies` or a narrow interface works. Replace with proper types from `@ffmpeg/ffmpeg` types or `VideoEncoderConfig`.

**Impact:** Prevents encoder-misconfiguration bugs at build time.
**Effort:** Small

---

## UI/UX

### `ErrorBoundary` only wraps the editor, not sub-features

**Problem:** `app/page.tsx:40` wraps the whole `EditorLayout` in one boundary. If a single panel (e.g. `TweetImportSection.tsx` at 589 lines, or the Konva canvas) throws, the entire editor blanks out with "Something went wrong." Users lose their unsaved design.

**What to do:** Add granular boundaries around:
- `components/canvas/ClientCanvas.tsx` (Konva crashes shouldn't kill side panels)
- `components/editor/sections/TweetImportSection.tsx` (external API failures)
- `components/timeline/TimelineEditor.tsx` (animation engine bugs)

Each with a local "This panel errored — reset" UI instead of the full-page fallback.

**Impact:** Users keep working when one feature breaks.
**Effort:** Small

---

### No draft recovery prompt after a crash

**Problem:** `hooks/useAutosaveDraft.ts` exists (402 lines — it's doing real work), but the error boundary's "Reload Page" button (`components/ErrorBoundary.tsx:49`) does a hard reload with no "Recover your draft?" offer.

**What to do:** In `ErrorBoundary.tsx` render, check if a draft exists via `lib/draft-storage.ts` and show a secondary action "Restore last draft" alongside reload.

**Impact:** Reduces lost-work frustration after a crash.
**Effort:** Small

---

## Documentation

### `/docs/ARCHITECT` is thorough but never referenced from entry points

**Problem:** `docs/ARCHITECT/` has 11 excellent design docs (animation-engine, canvas-rendering, export-pipeline, state-management, etc.), but `README.md` only links `ARCHITECTURE.md`, and `CLAUDE.md` doesn't mention them. New contributors won't find them.

**What to do:** Add a "Deep dives" section to `ARCHITECTURE.md` linking each `docs/ARCHITECT/*.md`. Add a pointer from `CLAUDE.md` under "## Architecture". In `CONTRIBUTING.md`, suggest reading the relevant doc before touching that subsystem.

**Impact:** Makes existing docs discoverable.
**Effort:** Small

---

### Shipped plans still sitting in `docs/superpowers/plans/`

**Problem:** `docs/superpowers/plans/2026-04-16-*` contains 8 plans, several of which are already shipped (slide-transitions, timeline-cleanup, randomize-animation-presets — confirmed in `git log`). Leaving them in `plans/` confuses future work about what's planned vs. done.

**What to do:** Move shipped plans to `docs/DONE/` (referenced in `session-continuity.md` rule). Add a status header (Shipped / Planned / Abandoned) to the remaining ones.

**Impact:** Keeps planning state accurate for session handoffs.
**Effort:** Small

---

## Priority Table

| # | Idea | Type | Impact | Effort |
|---|------|------|--------|--------|
| 1 | Rate limiter broken on CF Workers | Security | High | Small |
| 2 | `image-proxy` unbounded + no rate limit | Security | High | Small |
| 3 | 80MB+ unoptimized images in `/public` | Performance | High | Medium |
| 4 | Add Vitest + seed 3 pure-logic tests | Code Quality | High | Small |
| 5 | Central `logger.ts` + route `console.error` to PostHog | Code Improvements | Medium | Small |
| 6 | Granular error boundaries per panel | UI/UX | Medium | Small |
| 7 | Kill `any` in export pipeline | Code Quality | Medium | Small |
| 8 | Link `docs/ARCHITECT` from README/CLAUDE | Documentation | Medium | Small |
| 9 | Move shipped plans to `docs/DONE` | Documentation | Low | Small |
| 10 | "Restore draft" in error boundary | UI/UX | Medium | Small |
| 11 | Rewrite `EditorStoreSync` as fine-grained subscriptions | Performance | High | Medium |
| 12 | Split 1,657-line `lib/store/index.ts` | Code Improvements | Medium | Medium |

**Top 3 quick wins (high impact, small effort):** #1 (CF-compatible rate limiter), #2 (image-proxy hardening), #4 (seed tests for the animation engine you just refactored).
