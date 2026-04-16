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

const JSQUASH_QUALITY: Record<ExportFormat, Record<QualityPreset, number>> = {
  jpeg: { high: 85, medium: 75, low: 60 },
  webp: { high: 82, medium: 72, low: 55 },
  png:  { high: 100, medium: 100, low: 100 },
};

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

function getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

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

export async function processImage(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  qualityPreset: QualityPreset,
  options?: { skipApi?: boolean; onProgress?: (percent: number) => void }
): Promise<ImageProcessingResult> {
  const { skipApi = false, onProgress } = options ?? {};

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
    console.warn('jSquash encoding failed, using browser fallback:', error);
    const quality = format !== 'png' ? FALLBACK_QUALITY[format][qualityPreset] : undefined;
    blob = await canvasToBlob(canvas, getMimeType(format), quality);
  }

  onProgress?.(90);

  const dataURL = URL.createObjectURL(blob);
  return { blob, dataURL, fileSize: blob.size };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
