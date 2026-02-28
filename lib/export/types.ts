/**
 * Type definitions for Sharp-based image export
 */

export type ExportFormat = 'png' | 'jpeg';
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
  // NOTE: Do NOT add `effort` — sharp treats it as a palette-mode flag
  // which quantises to ≤256 colours and destroys shadow gradients.
}

export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  high: { jpeg: 92, pngCompression: 6 },
  medium: { jpeg: 80, pngCompression: 9 },
  low: { jpeg: 60, pngCompression: 9 },
};

export const QUALITY_PRESET_LABELS: Record<QualityPreset, { label: string; description: Record<ExportFormat, string> }> = {
  high: {
    label: 'High',
    description: {
      png: 'Best quality, larger file',
      jpeg: '92% quality, minimal compression',
    },
  },
  medium: {
    label: 'Medium',
    description: {
      png: 'Balanced size, lossless',
      jpeg: '80% quality, moderate compression',
    },
  },
  low: {
    label: 'Low',
    description: {
      png: 'Smallest file, lossless',
      jpeg: '60% quality, maximum compression',
    },
  },
};
