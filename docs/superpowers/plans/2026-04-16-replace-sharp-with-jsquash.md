# Replace Sharp with jSquash (Client-Side WASM Compression)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace server-side Sharp image compression with client-side jSquash WASM codecs so the app deploys to Cloudflare Workers without native module issues.

**Architecture:** Remove the `/api/export` route and `sharp` dependency entirely. Replace `sharp-client.ts` (which POSTs to `/api/export`) with `image-compress.ts` that uses jSquash WASM codecs (MozJPEG, WebP, OxiPNG) running in the browser. The existing `processWithSharp()` API shape stays the same so `export-service.ts` needs only an import path change. Fallback to `canvas.toBlob()` is preserved for browsers that can't load WASM.

**Tech Stack:** `@jsquash/jpeg` (MozJPEG), `@jsquash/webp`, `@jsquash/png` (OxiPNG)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `lib/export/image-compress.ts` | jSquash-based compression (replaces `sharp-client.ts`) |
| **Delete** | `lib/export/sharp-client.ts` | Old Sharp API client |
| **Delete** | `app/api/export/route.ts` | Old Sharp server endpoint |
| **Modify** | `lib/export/export-service.ts:19` | Update import path |
| **Modify** | `lib/export/types.ts:1` | Remove Sharp reference in doc comment |
| **Modify** | `vite.config.ts:20` | Remove `"sharp"` from `ssr.external` |
| **Modify** | `package.json` | Remove `sharp`, add `@jsquash/*` packages |

---

### Task 1: Install jSquash packages and remove Sharp

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install jSquash packages**

Run:
```bash
pnpm add @jsquash/jpeg @jsquash/webp @jsquash/png
```

- [ ] **Step 2: Remove Sharp**

Run:
```bash
pnpm remove sharp
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: replace sharp with @jsquash/* client-side codecs"
```

---

### Task 2: Create `image-compress.ts` (jSquash compression module)

**Files:**
- Create: `lib/export/image-compress.ts`

- [ ] **Step 1: Create `lib/export/image-compress.ts`**

This file replaces `sharp-client.ts`. It exports the same `processWithSharp` function name (renamed to `processImage`) and `SharpProcessingResult` type (renamed to `ImageProcessingResult`) with the same API shape. It uses jSquash WASM codecs instead of POSTing to `/api/export`.

```typescript
/**
 * Client-side image compression using jSquash WASM codecs.
 *
 * Pipeline:
 * 1. Canvas → ImageData via getImageData()
 * 2. Encode with jSquash (MozJPEG / WebP / OxiPNG)
 * 3. Falls back to canvas.toBlob() if WASM fails to load
 */

import type { ExportFormat, QualityPreset } from './types';

export interface ImageProcessingResult {
  blob: Blob;
  dataURL: string;
  fileSize: number;
}

// Quality values for jSquash encoders (0-100 scale)
const JSQUASH_QUALITY: Record<ExportFormat, Record<QualityPreset, number>> = {
  jpeg: { high: 85, medium: 75, low: 60 },
  webp: { high: 82, medium: 72, low: 55 },
  png:  { high: 100, medium: 100, low: 100 }, // lossless — compression level varies
};

// Fallback quality for canvas.toBlob() (0-1 scale)
const FALLBACK_QUALITY: Record<ExportFormat, Record<QualityPreset, number>> = {
  jpeg: { high: 0.85, medium: 0.75, low: 0.60 },
  webp: { high: 0.82, medium: 0.72, low: 0.55 },
  png:  { high: 1, medium: 1, low: 1 },
};

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return 'image/png';
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      mimeType,
      quality
    );
  });
}

/**
 * Get ImageData from canvas for jSquash encoders.
 */
function getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Encode ImageData using jSquash WASM codecs.
 * Dynamically imports codec modules so WASM is only loaded when needed.
 */
async function encodeWithJSquash(
  imageData: ImageData,
  format: ExportFormat,
  qualityPreset: QualityPreset
): Promise<ArrayBuffer> {
  const quality = JSQUASH_QUALITY[format][qualityPreset];

  switch (format) {
    case 'jpeg': {
      const { encode } = await import('@jsquash/jpeg');
      return encode(imageData, { quality });
    }
    case 'webp': {
      const { encode } = await import('@jsquash/webp');
      return encode(imageData, { quality });
    }
    case 'png': {
      const { encode } = await import('@jsquash/png');
      return encode(imageData);
    }
  }
}

/**
 * Process and compress canvas for export via jSquash WASM codecs.
 * Falls back to canvas.toBlob() if WASM loading fails.
 */
export async function processImage(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  qualityPreset: QualityPreset,
  options?: { skipApi?: boolean; onProgress?: (percent: number) => void }
): Promise<ImageProcessingResult> {
  const { skipApi = false, onProgress } = options ?? {};

  // Skip WASM encoding for clipboard or when explicitly requested
  if (skipApi) {
    const quality = format !== 'png' ? FALLBACK_QUALITY[format][qualityPreset] : undefined;
    const blob = await canvasToBlob(canvas, getMimeType(format), quality);
    const dataURL = URL.createObjectURL(blob);
    return { blob, dataURL, fileSize: blob.size };
  }

  onProgress?.(65);

  let blob: Blob;

  try {
    const imageData = getImageData(canvas);
    onProgress?.(70);

    const encoded = await encodeWithJSquash(imageData, format, qualityPreset);
    onProgress?.(85);

    blob = new Blob([encoded], { type: getMimeType(format) });
  } catch (error) {
    // Fallback: use browser canvas.toBlob()
    console.warn('jSquash encoding failed, using browser fallback:', error);
    const quality = format !== 'png' ? FALLBACK_QUALITY[format][qualityPreset] : undefined;
    blob = await canvasToBlob(canvas, getMimeType(format), quality);
  }

  onProgress?.(90);

  const dataURL = URL.createObjectURL(blob);
  return { blob, dataURL, fileSize: blob.size };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/export/image-compress.ts
git commit -m "feat: add jSquash-based client-side image compression"
```

---

### Task 3: Wire up `export-service.ts` to use new module

**Files:**
- Modify: `lib/export/export-service.ts:19,638`
- Modify: `lib/export/types.ts:1`

- [ ] **Step 1: Update import in `export-service.ts`**

Change line 19 from:
```typescript
import { processWithSharp } from './sharp-client';
```
to:
```typescript
import { processImage } from './image-compress';
```

- [ ] **Step 2: Update the function call in `export-service.ts`**

Change line 638 from:
```typescript
    const sharpResult = await processWithSharp(
```
to:
```typescript
    const result = await processImage(
```

- [ ] **Step 3: Update the variable references after the call**

Change lines 647-652 from:
```typescript
    if (!sharpResult.blob || sharpResult.blob.size === 0) {
      throw new Error('Failed to generate image');
    }

    report(95);
    return { dataURL: sharpResult.dataURL, blob: sharpResult.blob };
```
to:
```typescript
    if (!result.blob || result.blob.size === 0) {
      throw new Error('Failed to generate image');
    }

    report(95);
    return { dataURL: result.dataURL, blob: result.blob };
```

- [ ] **Step 4: Update `ExportOptions` interface doc comment**

Change line 30 from:
```typescript
  /** Skip Sharp API (e.g. for clipboard copies where speed matters more than compression) */
  skipSharp?: boolean;
```
to:
```typescript
  /** Skip WASM compression (e.g. for clipboard copies where speed matters more) */
  skipSharp?: boolean;
```

- [ ] **Step 5: Update `types.ts` doc comment**

Change line 1-3 from:
```typescript
/**
 * Type definitions for Sharp-based image export
 */
```
to:
```typescript
/**
 * Type definitions for image export
 */
```

- [ ] **Step 6: Check for any other imports of `sharp-client` or `processWithSharp`**

Run:
```bash
grep -r "sharp-client\|processWithSharp" --include="*.ts" --include="*.tsx" lib/ components/ app/ hooks/
```

Expected: No results (only `export-service.ts` imported it, which we already updated).

- [ ] **Step 7: Commit**

```bash
git add lib/export/export-service.ts lib/export/types.ts
git commit -m "refactor: switch export-service from Sharp to jSquash"
```

---

### Task 4: Delete Sharp files and clean up config

**Files:**
- Delete: `lib/export/sharp-client.ts`
- Delete: `app/api/export/route.ts`
- Modify: `vite.config.ts:20`

- [ ] **Step 1: Delete `sharp-client.ts`**

```bash
rm lib/export/sharp-client.ts
```

- [ ] **Step 2: Delete `app/api/export/route.ts`**

```bash
rm app/api/export/route.ts
```

If the `app/api/export/` directory is now empty:
```bash
rmdir app/api/export
```

- [ ] **Step 3: Remove `"sharp"` from `ssr.external` in `vite.config.ts`**

Change:
```typescript
  ssr: {
    noExternal: [],
    external: ["canvas", "sharp"],
  },
```
to:
```typescript
  ssr: {
    noExternal: [],
    external: ["canvas"],
  },
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Sharp server-side compression (replaced by jSquash)"
```

---

### Task 5: Verify build and deploy

**Files:** None (verification only)

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: No errors related to sharp/export changes.

- [ ] **Step 2: Run build**

```bash
pnpm build
```

Expected: Build succeeds without `sharp` module errors.

- [ ] **Step 3: Test dev server**

```bash
pnpm dev
```

Open `localhost:3000`, upload an image, export as JPEG/WebP/PNG. Verify:
- Export completes without errors
- Downloaded file is valid image
- Console shows no errors (or shows "jSquash" loading, not "Sharp API unavailable")

- [ ] **Step 4: Deploy to Cloudflare Workers**

```bash
pnpm deploy
```

Expected: Deploy succeeds without `sharp` module errors.

- [ ] **Step 5: Commit any fixes if needed, then tag**

```bash
git add -A
git commit -m "fix: resolve any remaining sharp references"
```
