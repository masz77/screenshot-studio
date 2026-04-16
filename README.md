# Screenshot Studio

> Fork of [KartikLabhshetwar/screenshot-studio](https://github.com/KartikLabhshetwar/screenshot-studio) — rebuilt with [vinext](https://github.com/nicolo-ribaudo/vinext) (Vite-powered Next.js), optimized timeline/export, and deployed to Cloudflare Workers.

A free, browser-based screenshot editor. Beautiful backgrounds, device frames, 3D effects, animations, and video export. No signup, no watermarks. **Runs entirely in the browser** — no server-side processing required.

## What's Different in This Fork

- **vinext instead of webpack** — uses [vinext](https://github.com/nicolo-ribaudo/vinext) to build Next.js 16 with Vite, replacing webpack for faster builds and HMR
- **Optimized timeline** — improved keyframe interpolation, animation presets, and multi-slide playback
- **Optimized export** — hardware-accelerated video encoding via WebCodecs, FFmpeg WASM with frame streaming, and encoder auto-selection (MP4/WebM/GIF)
- **100% browser-side** — all rendering, animation, and export happens client-side (no server-side image processing)
- **Cloudflare Worker deployment** — deployed via `vinext deploy` to Cloudflare Workers with static assets on Cloudflare, instead of Vercel

## Features

- **100+ Backgrounds** — gradients, solid colors, images, blur, noise
- **Browser Mockups** — Safari & Chrome (light/dark) with realistic toolbars, adjustable header size, and custom URL
- **Device Frames** — Arc browser, Polaroid, glass, outline, border styles
- **3D Transforms** — 30+ perspective presets with realistic depth
- **Draw & Markup** — arrows, shapes, blur regions, text overlays
- **Tweet & Code Snippets** — import tweets, generate code images
- **Animations** — 20+ presets, timeline editor, keyframe control
- **Video Export** — MP4, WebM, GIF with hardware-accelerated encoding
- **High-Res Export** — PNG/JPG up to 5x scale, fully in-browser

## Quick Start

```bash
git clone <your-fork-url>
cd screenshot-studio
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). No environment variables needed — core features work out of the box.

### Deployment

```bash
pnpm build             # Production build via vinext
pnpm deploy            # Deploy to Cloudflare Workers
pnpm deploy:preview    # Deploy to preview environment
```

Requires a `wrangler.jsonc` with your Cloudflare account ID. See [Cloudflare Workers docs](https://developers.cloudflare.com/workers/) for setup.

### Optional Environment Variables

For cloud asset storage and screenshot caching, create `.env.local`:

```env
# Cloudflare R2 (asset storage)
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket
R2_ACCOUNT_ID=your-account-id

# Screenshot API (defaults to free Screen-Shot.xyz — no key required)
SCREENSHOT_API_URL=https://api.screen-shot.xyz
```

## Tech Stack

[vinext](https://github.com/nicolo-ribaudo/vinext) (Vite + Next.js 16) · React 19 · TypeScript · Tailwind CSS 4 · Zustand · Radix UI · Motion · FFmpeg WASM · WebCodecs · Cloudflare Workers

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[Apache License 2.0](./LICENSE)

---

Based on [screenshot-studio](https://github.com/KartikLabhshetwar/screenshot-studio) by [Kartik Labhshetwar](https://github.com/KartikLabhshetwar).
