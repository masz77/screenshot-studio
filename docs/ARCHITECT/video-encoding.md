# Video Encoding

> See also: ARCHITECTURE.md -- "Key Features Implementation > 9. Video Export System", "Tech Stack > Animation & Video"

## Overview

Stage exports animations and slideshows as video files (MP4, WebM, GIF) entirely in the browser. Three independent encoders cover all format/performance combinations, with automatic selection based on the requested format and browser capabilities. FFmpeg WASM handles H.264 and GIF, WebCodecs provides hardware-accelerated H.264 via the `mp4-muxer` library, and MediaRecorder captures native WebM through the browser's built-in API.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Triple encoder strategy | **FFmpeg WASM + WebCodecs + MediaRecorder** | Each encoder excels at different formats/environments; fallback chain ensures every browser can export |
| GIF encoding | **FFmpeg WASM only** | FFmpeg's palettegen/paletteuse filter produces high-quality 256-color GIF with Bayer dithering; no browser API supports GIF natively |
| MP4 primary encoder | **WebCodecs + mp4-muxer** | Hardware-accelerated H.264 encoding; no WASM download required; significantly faster than FFmpeg WASM |
| MP4 fallback encoder | **FFmpeg WASM (libx264, ultrafast preset)** | Works on browsers without WebCodecs support; ultrafast preset trades minimal quality for major speed gains in WASM |
| WebM encoding | **MediaRecorder (VP8/VP9)** | Browser-native, zero overhead, no WASM or extra libraries needed |
| COOP/COEP headers scope | **Editor routes only (`/editor/*`, `/home`)** | SharedArrayBuffer requires cross-origin isolation but applying COEP globally breaks third-party embeds (e.g., YouTube on the landing page) |
| COEP header value | **`credentialless` (not `require-corp`)** | Allows fetching cross-origin resources (like CDN images) without CORP headers while still enabling SharedArrayBuffer |
| Frame format for FFmpeg | **JPEG at 0.92 quality** | ~5x faster per frame than PNG; quality loss invisible in video encoding |
| FFmpeg instance management | **Singleton with mutex lock** | Prevents concurrent exports from corrupting FFmpeg's virtual filesystem |
| WASM binary persistence | **Browser Cache API** | Avoids re-downloading ~25MB of WASM binaries across sessions; falls back to `toBlobURL` if Cache API is unavailable |
| Slideshow frame strategy | **Concat demuxer (1 file per slide)** | Writes 1 JPEG per unique slide with a duration script instead of N duplicate frame files, drastically reducing VFS writes |
| Animation FPS | **60fps for animations, 30fps for slideshows** | Animations need smooth motion; static slideshows don't benefit from 60fps and halving frames cuts encoding work in half |
| WebCodecs codec negotiation | **Cascading profile/level probe with cache** | Tries High Profile Level 5.0 down to Baseline Level 3.0; caches supported codec per resolution to avoid repeated probes |
| Even dimension enforcement | **WebCodecs pads to even width/height** | H.264 requires even dimensions; encoder auto-pads odd dimensions with OffscreenCanvas resize |

## Key Files

| File | Purpose |
|------|---------|
| `lib/export-slideshow-video.ts` | Orchestrator -- routes to correct encoder based on format, manages store state save/restore, handles progress and download |
| `lib/export/ffmpeg-encoder.ts` | FFmpeg WASM encoder -- singleton loading, Cache API persistence, frame mode and concat demuxer mode, VFS cleanup |
| `lib/export/webcodecs-encoder.ts` | WebCodecs encoder -- H.264 codec negotiation, mp4-muxer integration, backpressure handling, VideoFrame lifecycle |
| `lib/export/video-encoder.ts` | MediaRecorder wrapper -- native WebM/MP4 recording, codec detection, canvas-to-stream capture |
| `next.config.ts` | COOP/COEP header configuration scoped to editor routes |
| `hooks/useExportProgress.ts` | Zustand store for export progress tracking across encoder phases |

## Data Flow

### Encoder Selection (Auto Mode)

```
Format requested
  |
  +-- GIF ---------> FFmpeg WASM (only option)
  |
  +-- WebM --------> MediaRecorder (native VP8/VP9)
  |
  +-- MP4
       |
       +-- WebCodecs supported? --yes--> WebCodecs + mp4-muxer
       |
       +-- no -----------------------> FFmpeg WASM (libx264 fallback)
```

### Frame Capture and Encoding Loop

```
User clicks "Export Video"
  |
  v
Save store state (perspective3D, imageOpacity, activeSlideId)
  |
  v
Select encoder (based on format + browser capabilities)
  |
  v
For each frame (animation) or slide (slideshow):
  1. Set playhead to frame time
  2. Call getClipInterpolatedProperties() for animation values
  3. Apply interpolated values to store (perspective, opacity)
  4. Capture canvas via exportSlideFrameAsCanvas()
  5. Feed canvas to encoder (addFrame / encodeFromCanvas / drawImage)
  6. Yield to main thread periodically (every 5-10 frames)
  |
  v
Finalize encoder (flush, mux, read output)
  |
  v
Restore store state to pre-export values
  |
  v
Trigger browser download of Blob
```

### FFmpeg WASM Loading

```
loadFFmpeg() called
  |
  v
Check singleton (already loaded?) --yes--> return instance
  |
  v
Check crossOriginIsolated
  |
  +-- true ----> Load multi-threaded core (core-mt@0.12.6)
  |              with worker.js for SharedArrayBuffer
  |
  +-- false ---> Load single-threaded core (core@0.12.6)
  |
  v
For each binary (core.js, core.wasm, worker.js):
  1. Check Cache API for cached response
  2. If cached -> create blob URL from cache
  3. If not -> fetch from unpkg CDN, store in cache, create blob URL
  |
  v
ffmpeg.load({ coreURL, wasmURL, workerURL })
  |
  v
Revoke temporary blob URLs, store singleton
```

## Quality Presets

| Quality | Bitrate (WebCodecs/MediaRecorder) | CRF (FFmpeg) | Use Case |
|---------|-----------------------------------|--------------|----------|
| High | 25 Mbps | 18 (visually lossless) | Final export, presentation |
| Medium | 10 Mbps | 23 (good quality) | Sharing, social media |
| Low | 5 Mbps | 28 (smaller file) | Quick preview, drafts |

FFmpeg WebM uses CRF + 10 offset (e.g., CRF 28 for "high") because VP9 CRF values run on a different scale than H.264.

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Server-side encoding (e.g., Lambda + FFmpeg) | Adds latency, server cost, and data transfer; browser encoding keeps everything local and free |
| Single encoder (FFmpeg WASM for everything) | WebCodecs is 5-10x faster for MP4 via hardware acceleration; MediaRecorder is zero-overhead for WebM |
| WebCodecs for all formats | WebCodecs only supports H.264/VP8/VP9 encoding, not GIF; browser support varies |
| PNG frames for FFmpeg | JPEG is ~5x faster to encode from canvas; quality delta is invisible after video compression |
| Global COOP/COEP headers | Breaks third-party embeds (YouTube, etc.) on non-editor pages; scoping to `/editor/*` isolates the requirement |
| `require-corp` COEP | Too strict; blocks cross-origin image loads unless the CDN sends CORP headers; `credentialless` is more permissive while still enabling SharedArrayBuffer |
| Web Workers for encoding | Would add complexity for FFmpeg (already runs in its own WASM thread); WebCodecs already uses GPU; main thread yielding with periodic `setTimeout(0)` keeps UI responsive enough |
