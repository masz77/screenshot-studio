# Analytics

> See also: ARCHITECTURE.md — "Monitoring & Analytics"

## Overview

Stage uses PostHog as its sole analytics provider. Events are captured via helper functions in `lib/analytics.ts`, and PostHog is initialized in `instrumentation-client.ts` using Next.js's client instrumentation hook. A same-origin reverse proxy (`/svc/*` rewritten to `us.i.posthog.com`) routes all analytics traffic through the app's own domain to bypass ad blockers.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Analytics provider | **PostHog (single provider)** | Replaces earlier multi-provider setup; PostHog covers product analytics, session replay, and feature flags in one tool |
| Initialization | **`instrumentation-client.ts`** with `posthog.init()` | Next.js client instrumentation runs once on app boot before any component renders; ensures PostHog is ready for all pages |
| Ad blocker bypass | **Same-origin reverse proxy** via Next.js `rewrites` (`/svc/*` -> `us.i.posthog.com`) | First-party domain avoids most ad blocker filter lists; no extra infrastructure needed |
| Static asset proxy | **`/svc/static/*` -> `us-assets.i.posthog.com/static/*`** | PostHog's JS bundle and assets also need to be served first-party for the bypass to work end-to-end |
| Localhost exclusion | **`shouldTrack()` checks `window.location.hostname`** | Prevents polluting production analytics with local development noise |
| Event API | **Typed helper functions** (e.g., `trackImageUpload`, `trackExportComplete`) | Enforces consistent event names and property shapes; avoids typo-prone raw `posthog.capture` calls |
| Automatic capture | **PostHog defaults** (pageviews, clicks, interactions) | Built-in autocapture covers navigation and UI interactions without manual instrumentation |

## Key Files

| File | Purpose |
|------|---------|
| `lib/analytics.ts` | All event tracking helpers: `trackEvent`, `trackImageUpload`, `trackExportStart`, `trackExportComplete`, `trackBackgroundChange`, `trackEffectApply`, `trackPresetApply`, `trackOverlayAdd`, `trackError`, etc. |
| `instrumentation-client.ts` | PostHog initialization with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` env vars |
| `next.config.ts` (rewrites section) | Reverse proxy rules: `/svc/static/:path*` -> PostHog assets CDN, `/svc/:path*` -> PostHog ingest API |

## Data Flow

### Event Capture

```
User performs action (e.g., exports an image)
  |
  v
Component calls trackExportComplete(format, quality, scale, sizeKb, durationMs)
  |
  v
trackEvent() checks shouldTrack()
  |-- localhost --> log to console in dev, skip capture
  |-- production --> posthog.capture("export_complete", { format, quality, ... })
                       |
                       v
                     Browser sends POST to /svc/e/  (same-origin)
                       |
                       v
                     Next.js rewrite proxies to us.i.posthog.com/e/
                       |
                       v
                     PostHog ingests the event
```

### Initialization

```
Next.js app boots
  |
  v
instrumentation-client.ts runs (client-side only)
  |
  v
posthog.init(NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: NEXT_PUBLIC_POSTHOG_HOST,  // e.g., "/svc" for reverse proxy
  ui_host: "https://us.posthog.com",   // PostHog dashboard remains direct
  defaults: "2026-01-30",              // PostHog config defaults version
})
  |
  v
Autocapture enabled: pageviews, clicks, and form interactions tracked automatically
```

## Event Catalog

| Event | Helper | Properties |
|-------|--------|------------|
| `image_upload` | `trackImageUpload` | `source` (file/paste/drop/url), `file_size_kb` |
| `export_start` | `trackExportStart` | `format`, `quality`, `scale` |
| `export_complete` | `trackExportComplete` | `format`, `quality`, `scale`, `file_size_kb`, `duration_ms` |
| `export_error` | `trackExportError` | `format`, `error` (truncated to 100 chars) |
| `copy_to_clipboard` | `trackCopyToClipboard` | `success` |
| `background_change` | `trackBackgroundChange` | `type` (gradient/solid/image/transparent), `value` |
| `effect_apply` | `trackEffectApply` | `effect_type`, `value` |
| `frame_apply` | `trackFrameApply` | `frame_type` |
| `preset_apply` | `trackPresetApply` | `preset_id`, `preset_name` |
| `overlay_add` | `trackOverlayAdd` | `overlay_type` (text/image/sticker) |
| `aspect_ratio_change` | `trackAspectRatioChange` | `ratio` |
| `animation_clip_add` | `trackAnimationClipAdd` | `preset_id`, `preset_name`, `duration_ms` |
| `session_start` | `trackSessionStart` | `referrer` |
| `editor_open` | `trackEditorOpen` | (none) |
| `cta_click` | `trackCTAClick` | `location`, `label` |
| `error` | `trackError` | `error_type`, `message` (truncated to 200 chars) |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key (public, embedded in client bundle) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog API host; set to `/svc` for the reverse proxy route |

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|---------------|
| Multiple providers (Umami + PostHog + custom) | Consolidated to PostHog only; reduces bundle size and maintenance overhead |
| Direct PostHog domain (no proxy) | Blocked by most ad blockers; the `/svc/*` reverse proxy recovers significant tracking coverage |
| Server-side event capture | Adds backend complexity; client-side capture is sufficient for a browser-only editor |
| Google Analytics | Privacy concerns; heavier SDK; PostHog is self-hostable and more privacy-friendly |
| No analytics | Need visibility into which features are used to prioritize development |
