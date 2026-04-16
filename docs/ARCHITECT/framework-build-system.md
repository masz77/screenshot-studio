# Framework & Build System

> See also: ARCHITECTURE.md — "Tech Stack > Core Framework", "Dependencies Overview", "Deployment > Vercel Configuration", "Deployment > Build Process"

## Overview

Stage uses Next.js 16 with the App Router and React 19 as the core framework. The build system has been migrated from webpack to Vinext (a Vite-based Next.js builder), with React Compiler enabled for automatic memoization. The app deploys to Vercel with custom headers for cross-origin isolation and a PostHog reverse proxy.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Next.js 16 (App Router)** | RSC support, file-based routing, API routes for screenshot endpoint |
| UI library | **React 19 + React Compiler** | Automatic memoization via `reactCompiler: true` eliminates manual `useMemo`/`useCallback` |
| Build tool | **Vinext (Vite-based)** | Faster dev/build than webpack; native ESM; simpler config for SSR externals (`canvas`, `sharp`) |
| Module system | **ESM (`"type": "module"`)** | Aligns with Vite/Vinext requirements and modern Node.js |
| TypeScript target | **ES2017, bundler resolution** | Supports async/await natively; `bundler` moduleResolution for Vite compatibility |
| Deployment | **Vercel** | Serverless functions for API routes, edge CDN for static assets |
| Analytics proxy | **PostHog reverse proxy via rewrites** | Bypasses ad blockers by proxying `/svc/*` to PostHog's US endpoints |
| Cross-origin isolation | **COOP/COEP on editor routes only** | Required for `SharedArrayBuffer` (FFmpeg WASM multi-threading); scoped to `/editor/*` and `/home` to avoid breaking YouTube embeds on landing page |

## Key Files

| File | Purpose |
|------|---------|
| `next.config.ts` | React Compiler flag, custom headers (COOP/COEP, security), redirects, PostHog rewrites |
| `vite.config.ts` | Vinext plugin, SSR externals (`canvas`, `sharp`), canvas alias for react-konva |
| `package.json` | Scripts (`vinext dev/build/start`), all production and dev dependencies |
| `tsconfig.json` | ES2017 target, bundler module resolution, `@/*` path alias, Next.js plugin |
| `vercel.json` | Function-level config: screenshot API route gets 10s timeout and 1024 MB memory |

## Data Flow

### Build Pipeline

```
pnpm dev / pnpm build
  |
  vinext (Vite-based builder)
  |
  +-- @vitejs/plugin-react (JSX transform)
  +-- @vitejs/plugin-rsc (React Server Components)
  +-- babel-plugin-react-compiler (automatic memoization)
  |
  +-- SSR externals: canvas, sharp (not bundled for server)
  +-- Client bundle: ESM, tree-shaken
  |
  vinext start (production server)
```

### Request Flow (Vercel)

```
Browser request
  |
  Vercel Edge Network
  |
  +-- Static assets: CDN-cached
  +-- /svc/* : Rewrite to PostHog (us.i.posthog.com)
  +-- /home : 301 redirect to /
  +-- /editor/* : Add COOP/COEP headers, serve app
  +-- /api/screenshot : Serverless function (10s timeout, 1GB RAM)
  +-- All routes: Security headers (X-Content-Type-Options, Referrer-Policy, etc.)
```

### Custom Headers

| Route | Headers | Purpose |
|-------|---------|---------|
| `/*` | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: on`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Security baseline |
| `/editor/*`, `/home` | `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: credentialless` | Enable `SharedArrayBuffer` for FFmpeg WASM |

### Redirects & Rewrites

| Type | Source | Destination | Purpose |
|------|--------|-------------|---------|
| 301 redirect | `/home` | `/` | SEO: old editor URL migrated to root |
| Rewrite | `/svc/static/:path*` | `us-assets.i.posthog.com/static/:path*` | PostHog static assets proxy |
| Rewrite | `/svc/:path*` | `us.i.posthog.com/:path*` | PostHog API proxy |

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Webpack (previous build)** | Slower dev server and builds; Vinext provides Vite's speed with Next.js compatibility. Migration captured in `vite.config.ts` SSR externals for `canvas`/`sharp`. |
| **Turbopack** | Next.js built-in alternative, but Vinext was chosen for full Vite ecosystem access and plugin compatibility. |
| **COEP `require-corp` (strict)** | Would break third-party resources; `credentialless` is sufficient for `SharedArrayBuffer` while allowing cross-origin loads. |
| **Global COOP/COEP headers** | Breaks YouTube embeds on the landing page; scoped to editor routes only. |
| **Client-side PostHog** | Blocked by ad blockers; reverse proxy through same origin ensures reliable analytics. |
| **`process.env` for secrets** | Not applicable in all runtimes; environment variables are accessed via Vercel's serverless function context. |
