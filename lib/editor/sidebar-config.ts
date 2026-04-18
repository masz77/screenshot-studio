// lib/editor/sidebar-config.ts
// Central tunables for sidebar progressive disclosure and randomize behavior.
// Adjust values here only — do not inline numbers inside components or pickers.

import type { ImageStylePreset, ShadowPreset } from '@/lib/store';

/** How many items show as primary before "Advanced" in each sub-section. */
export const DISCLOSURE_FOLDS = {
  lightAndShadow: { primaryTileCount: 6 },     // incl. "None" tile, so 6 total visible
  magicGradients: { primaryRows: 2 },          // 2 rows × N columns visible; rest under Advanced
  gradients: { primaryRows: 1 },               // classic row visible; mesh row under Advanced
  backgroundCategory: { primaryTilesPerCategory: 8 },
} as const;

/** Inclusive numeric ranges + catalog choices for randomize actions. */
export const RANDOMIZE_RANGES = {
  frame: {
    stylePresets: [
      'default',
      'glass-light',
      'glass-dark',
      'outline',
      'border-light',
      'border-dark',
    ] as ImageStylePreset[],
    shadowPresets: ['none', 'hug', 'soft', 'strong'] as ShadowPreset[],
    borderRadiusChoices: [0, 12, 20] as const,
    imageScale: { min: 85, max: 115 },         // percent
    padding: { min: 0, max: 8, step: 0.5 },
    opacity: { min: 0.05, max: 1.0, step: 0.01 },
  },
  rerollAttempts: 3,
} as const;
