# Screenshot & Media API

> See also: ARCHITECTURE.md -- "API Routes > /api/screenshot", "Key Features Implementation > 1. Image Upload > Website Screenshot"

## Overview

Stage exposes a set of Next.js API routes that handle website screenshot capture, tweet embedding, image proxying, and server-side image compression. The primary screenshot service uses Screen-Shot.xyz (free, no API key) with configurable self-hosting on Cloudflare Workers. All routes run as serverless functions on Vercel with rate limiting and input validation.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Screenshot provider | **Screen-Shot.xyz API** | Free, open-source, no API key required, self-hostable on Cloudflare Workers |
| Fallback capture | **playwright-core + @sparticuz/chromium** | Available as dependency for local/self-hosted Playwright-based capture |
| Image proxy | **Allowlisted domain proxy** | Avoids CORS issues with Twitter media; restricts to known-safe domains |
| Tweet embedding | **react-tweet server API** | Lightweight tweet data fetching without Twitter API keys |
| Server-side compression | **Sharp** | MozJPEG/libwebp encoders produce 10-15% smaller files than browser canvas.toBlob() |
| Rate limiting | **In-memory Map** | Simple per-IP sliding window; sufficient for single-instance serverless |
| API style | **Next.js Route Handlers** | Co-located with App Router; each route is a standalone serverless function |
| Screenshot API URL | **Configurable via env var** | `SCREENSHOT_API_URL` defaults to `https://api.screen-shot.xyz`, can point to self-hosted instance |

## Key Files

| File | Purpose |
|------|---------|
| `app/api/screenshot/route.ts` | POST endpoint: captures website screenshots via Screen-Shot.xyz |
| `app/api/tweet/[id]/route.ts` | GET endpoint: fetches tweet data by ID using react-tweet |
| `app/api/image-proxy/route.ts` | GET endpoint: proxies Twitter media images with domain allowlist |
| `app/api/export/route.ts` | POST endpoint: server-side image compression via Sharp |
| `lib/rate-limit.ts` | In-memory sliding-window rate limiter (20 req/min/IP) |

## Data Flow

### Screenshot Capture

```
User enters URL in editor
  |
  v
POST /api/screenshot { url, deviceType }
  |
  +-- Rate limit check (20 req/min/IP)
  |     |-- Exceeded: 429 + Retry-After header
  |     +-- Allowed: continue
  |
  +-- Input validation
  |     |-- URL format (must be http/https)
  |     +-- deviceType ("desktop" | "mobile")
  |
  +-- Normalize URL
  |     |-- Lowercase hostname, strip www
  |     |-- Remove default ports, trailing slashes
  |     +-- Sort query params (cache key consistency)
  |
  +-- captureViaService(normalizedUrl, deviceType)
  |     |-- Build params: width/height based on device type
  |     |-- GET {SCREENSHOT_API_URL}/take?url=...&width=...&height=...&format=png
  |     |-- 55s timeout via AbortSignal
  |     +-- Validate response (PNG/JPEG magic bytes)
  |
  +-- Return { screenshot (base64), url, cached, strategy, deviceType }
```

### Viewport Sizes

| Device | Width | Height |
|--------|-------|--------|
| Desktop | 1920 | 1080 |
| Mobile | 375 | 667 |

### Tweet Embedding

```
Client requests tweet data
  |
  v
GET /api/tweet/{id}
  |
  +-- react-tweet/api getTweet(id)
  |     |-- Found: { data: tweet }
  |     +-- Not found: 404 { data: null, error }
```

### Image Proxy

```
Client needs Twitter media image
  |
  v
GET /api/image-proxy?url={encoded_url}
  |
  +-- Parse URL, check hostname against allowlist
  |     Allowed: pbs.twimg.com, abs.twimg.com, ton.twitter.com, video.twimg.com
  |     |-- Not allowed: 403
  |     +-- Allowed: fetch upstream
  |
  +-- Return image with Cache-Control: public, max-age=86400, immutable
```

### Server-Side Export Compression

```
Client exports image via canvas
  |
  v
POST /api/export (FormData: image blob, format, qualityPreset)
  |
  +-- Validate format (png | jpeg | webp) and quality preset (high | medium | low)
  |
  +-- Sharp pipeline
  |     |-- JPEG: MozJPEG encoder (flatten alpha to white)
  |     |-- WebP: libwebp, effort=4
  |     +-- PNG: adaptive filtering, configurable compression level
  |
  +-- Return optimized image buffer
```

## Rate Limiting

- **Window**: 60 seconds sliding window per IP
- **Limit**: 20 requests per window
- **Storage**: In-memory `Map<string, { count, resetAt }>`
- **Cleanup**: `setInterval` sweeps expired entries every 60s
- **Headers**: Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

## Error Handling

The screenshot route maps upstream errors to user-friendly messages:

| Condition | HTTP Status | Message |
|-----------|-------------|---------|
| Rate limit exceeded | 429 | "Rate limit exceeded. Please try again later." |
| Missing/invalid URL | 400 | "URL is required" / "Invalid URL format" |
| Non-http(s) protocol | 400 | "URL must use http or https protocol" |
| Timeout (55s) | 408 | "Website took too long to load..." |
| DNS/connection failure | 400 | "Could not connect to the website..." |
| SSL certificate issues | 400 | "Website has SSL certificate issues..." |
| Service unavailable | 503 | "Screenshot service is unavailable..." |
| Unhandled error | 500 | "Failed to capture screenshot..." |

## Self-Hosting

The screenshot service can be self-hosted by:

1. Deploying Screen-Shot.xyz to your own Cloudflare Workers instance
2. Setting `SCREENSHOT_API_URL` env var to point to your instance
3. The API contract is: `GET /take?url=...&width=...&height=...&format=png` returning raw image bytes

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|---------------|
| Puppeteer in serverless function | Cold start latency too high; memory limits on Vercel; Screen-Shot.xyz offloads this |
| Browser-only screenshot (html2canvas) | Cannot capture external websites, only DOM elements |
| Paid screenshot APIs (ScreenshotOne, ScreenshotAPI) | Cost; Screen-Shot.xyz is free and self-hostable |
| Redis/external rate limiting | Overkill for single-instance serverless; in-memory Map is sufficient |
| Cloudinary for image optimization | Already used for storage; Sharp gives more control and lower latency for on-the-fly compression |
| Twitter API v2 for tweets | Requires API key management; react-tweet works without authentication |
