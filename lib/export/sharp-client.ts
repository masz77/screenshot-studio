/**
 * Client-side image export & compression
 *
 * Strategy:
 * 1. canvas.toBlob() for initial conversion (PNG/JPEG/WebP)
 * 2. browser-image-compression for further size reduction (Web Worker-based)
 *
 * All processing is client-side — no network round-trip needed.
 */

import imageCompression from 'browser-image-compression';
import type { ExportFormat, QualityPreset } from './types';

export interface SharpProcessingResult {
  blob: Blob;
  dataURL: string;
  fileSize: number;
}

const QUALITY_MAP: Record<QualityPreset, number> = {
  high: 0.92,
  medium: 0.80,
  low: 0.65,
};

// Max file size targets for compression (in MB)
const SIZE_TARGETS: Record<QualityPreset, number> = {
  high: 10,
  medium: 4,
  low: 2,
};

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return 'image/png';
  }
}

/**
 * Convert canvas to blob using native API
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      getMimeType(format),
      quality
    );
  });
}

/**
 * Process and compress canvas for export
 */
export async function processWithSharp(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  qualityPreset: QualityPreset
): Promise<SharpProcessingResult> {
  const quality = format !== 'png' ? QUALITY_MAP[qualityPreset] : undefined;

  // Step 1: Convert canvas to blob
  let blob = await canvasToBlob(canvas, format, quality);

  // Step 2: Compress further with browser-image-compression for lossy formats
  if (format !== 'png') {
    try {
      const file = new File([blob], `export.${format}`, { type: getMimeType(format) });
      const compressed = await imageCompression(file, {
        maxSizeMB: SIZE_TARGETS[qualityPreset],
        maxWidthOrHeight: Math.max(canvas.width, canvas.height),
        useWebWorker: true,
        fileType: getMimeType(format),
        initialQuality: QUALITY_MAP[qualityPreset],
      });

      // Only use compressed version if it's actually smaller
      if (compressed.size < blob.size) {
        blob = compressed;
      }
    } catch {
      // Compression failed — use the original blob (already fine)
    }
  }

  // Step 3: Create object URL for download (faster than dataURL for large files)
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
