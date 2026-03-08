<br />
<br />
<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>
<br/>
<br/>
<a href="https://peerlist.io/code_kartik/project/screenshot-studio" target="_blank" rel="noreferrer">
			<img
			  src="https://dqy38fnwh4fqs.cloudfront.net/website/project-spotlight/project-week-rank-one-dark.svg"
			  alt="Screenshot Studio"
			  style="width: auto; height: 64px;"
			/>
</a>

# Screenshot Studio

<img width="3600" height="1890" alt="screenshot-studio-1772957884669" src="https://github.com/user-attachments/assets/2c27aef0-b5d0-41a0-98b3-d2008ad9c232" />



A free, browser-based editor for creating stunning screenshots, animated visuals, and videos. No signup, no watermarks.

**Live:** [https://screenshot-studio.com](https://screenshot-studio.com)

![Screenshot Studio](https://img.shields.io/badge/Screenshot%20Studio-Canvas%20Editor-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

### Editor
- **Drag & Drop Upload** - PNG, JPG, WEBP up to 100MB
- **Website Screenshots** - Capture any URL via [Screen-Shot.xyz](https://screen-shot.xyz)
- **50+ Backgrounds** - Gradients, solid colors, images, blur, and noise effects
- **Device Frames** - macOS, Windows, Arc-style (with width & opacity controls), Polaroid borders
- **3D Transforms** - Perspective rotation with realistic depth
- **Shadows & Borders** - Customizable blur, spread, offset, and color
- **Text Overlays** - Multiple layers with custom fonts and shadows
- **Image Overlays** - Arrows, icons, and decorative elements with on-canvas resize handles
- **Custom Presets** - Save and reuse your own canvas configurations
- **Aspect Ratios** - Instagram, YouTube, Twitter, LinkedIn, Open Graph
- **High-Res Export** - PNG/JPG up to 5x scale, fully in-browser
- **Undo/Redo** - Unlimited history with keyboard shortcuts

### Animation & Timeline
- **Timeline Editor** - Interactive timeline with playhead, ruler, and tracks
- **20+ Animation Presets** - Reveal, Flip, Perspective, Orbit, and Depth categories
- **Keyframe Animation** - Per-property keyframes with 8 easing functions
- **Real-time Preview** - Scrub and play animations directly in the editor
- **Multi-clip Support** - Layer multiple animations with overlap handling

### Video Export
- **MP4, WebM, GIF** - Export animations as video in multiple formats
- **Hardware-accelerated Encoding** - WebCodecs with mp4-muxer for fast H.264
- **FFmpeg Fallback** - Multi-threaded WASM encoder for broad compatibility
- **Quality Presets** - High (25 Mbps), Medium (10 Mbps), Low (5 Mbps)
- **Progress Tracking** - Real-time export progress with frame count

## Quick Start

```bash
# Clone and install
git clone https://github.com/KartikLabhshetwar/screenshot-studio.git
cd screenshot-studio
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local` for optional features:

```env
# Cloudflare R2 (for asset storage)
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket
R2_ACCOUNT_ID=your-account-id

# Database (for screenshot caching)
DATABASE_URL="postgresql://user:password@host:port/dbname"

# Screenshot API (optional, defaults to free Screen-Shot.xyz)
SCREENSHOT_API_URL=https://api.screen-shot.xyz
```

> **Note**: Core features work without any configuration. Database and R2 are only needed for website screenshots and asset optimization.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Next.js 16](https://nextjs.org/) with App Router |
| UI | [React 19](https://react.dev/) with React Compiler |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Components | [Radix UI](https://www.radix-ui.com/) |
| State | [Zustand](https://github.com/pmndrs/zustand) + [Zundo](https://github.com/charkour/zundo) (undo/redo) |
| Animations | [Motion](https://motion.dev/) |
| Video Export | [FFmpeg WASM](https://ffmpegwasm.netlify.app/) + [WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API) |
| Data Fetching | [TanStack Query](https://tanstack.com/query) |
| Canvas Export | [modern-screenshot](https://github.com/nichenqin/modern-screenshot) |
| Image Processing | [Sharp](https://sharp.pixelplumbing.com/) |
| Storage | [Cloudflare R2](https://www.cloudflare.com/r2/) |
| Database | [Prisma](https://www.prisma.io/) + PostgreSQL |
| Icons | [Hugeicons](https://hugeicons.com/) |

## Project Structure

```
screenshot-studio/
├── app/                 # Next.js pages and API routes
├── components/
│   ├── canvas/         # Canvas rendering (HTML/CSS based)
│   ├── editor/         # Editor panels and controls
│   ├── timeline/       # Timeline editor, tracks, and playback
│   ├── landing/        # Landing page components
│   └── ui/             # Shared UI components
├── lib/
│   ├── store/          # Zustand state management
│   ├── animation/      # Animation engine, presets, interpolation
│   ├── export/         # Image & video export pipeline
│   └── constants/      # Backgrounds, presets, fonts
├── hooks/              # Custom React hooks
└── types/              # TypeScript definitions
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm start          # Production server
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Contributors

<a href="https://github.com/KartikLabhshetwar/screenshot-studio/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=KartikLabhshetwar/screenshot-studio" />
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=KartikLabhshetwar/screenshot-studio&type=Date)](https://star-history.com/#KartikLabhshetwar/screenshot-studio&Date)

## License

[Apache License 2.0](./LICENSE)

## Support

- [GitHub Issues](https://github.com/KartikLabhshetwar/screenshot-studio/issues)
- [GitHub Discussions](https://github.com/KartikLabhshetwar/screenshot-studio/discussions)
