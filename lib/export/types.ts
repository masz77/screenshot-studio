/**
 * Type definitions for Sharp-based image export
 */

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type QualityPreset = 'high' | 'medium' | 'low';

export interface ExportApiRequest {
  imageData: string;  // base64 without prefix
  format: ExportFormat;
  qualityPreset: QualityPreset;
}

export interface ExportApiResponse {
  imageData: string;  // base64 processed image
  mimeType: string;
  fileSize: number;
}

export interface QualitySettings {
  jpeg: number;
  pngCompression: number;
  webp: number;
}

export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  high: { jpeg: 92, pngCompression: 6, webp: 90 },
  medium: { jpeg: 80, pngCompression: 9, webp: 80 },
  low: { jpeg: 60, pngCompression: 9, webp: 60 },
};

export const QUALITY_PRESET_LABELS: Record<QualityPreset, { label: string; description: Record<ExportFormat, string> }> = {
  high: {
    label: 'High',
    description: {
      png: 'Best quality, larger file',
      jpeg: '92% quality, minimal compression',
      webp: '90% quality, small file size',
    },
  },
  medium: {
    label: 'Medium',
    description: {
      png: 'Balanced size, lossless',
      jpeg: '80% quality, moderate compression',
      webp: '80% quality, very small file',
    },
  },
  low: {
    label: 'Low',
    description: {
      png: 'Smallest file, lossless',
      jpeg: '60% quality, maximum compression',
      webp: '60% quality, tiny file',
    },
  },
};
