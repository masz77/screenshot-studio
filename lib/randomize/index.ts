// lib/randomize/index.ts
// Pure pick functions for the four randomize buttons. No store coupling.
// Each picker avoids returning `current` when alternatives exist (up to `rerollAttempts` tries).

import {
  RANDOMIZE_RANGES,
} from '@/lib/editor/sidebar-config';
import type { ImageStylePreset, ShadowPreset, ImageBorder } from '@/lib/store';
import type { BackgroundConfig } from '@/lib/constants/backgrounds';
import { TRANSFORM_PRESETS, type TransformPreset } from '@/lib/constants/transform-presets';
import { backgroundCategories } from '@/lib/r2-backgrounds';
import { gradientColors, type GradientKey } from '@/lib/constants/gradient-colors';
import { meshGradients, magicGradients, type MeshGradientKey, type MagicGradientKey } from '@/lib/constants/mesh-gradients';
import { ANIMATION_PRESETS } from '@/lib/animation/presets';
import type { AnimationPreset } from '@/types/animation';

/** Pick a random element from `pool`, trying up to `attempts` times to avoid `current`. */
function pickDifferent<T>(pool: readonly T[], current: T, attempts: number, eq: (a: T, b: T) => boolean): T {
  if (pool.length === 0) return current;
  if (pool.length === 1) return pool[0];
  for (let i = 0; i < attempts; i++) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (!eq(candidate, current)) return candidate;
  }
  // Fall back to any element; after N tries we accept a repeat rather than loop forever.
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomInRange(min: number, max: number, step: number, currentApprox: number): number {
  const stepsCount = Math.max(1, Math.round((max - min) / step) + 1);
  const attempts = RANDOMIZE_RANGES.rerollAttempts;
  for (let i = 0; i < attempts; i++) {
    const n = min + Math.floor(Math.random() * stepsCount) * step;
    if (Math.abs(n - currentApprox) > step / 2) {
      return roundToStep(n, step);
    }
  }
  return roundToStep(min + Math.random() * (max - min), step);
}

function roundToStep(n: number, step: number): number {
  return Math.round(n / step) * step;
}

// ---------- Frame ----------

export interface FrameRandomResult {
  imageStylePreset: ImageStylePreset;
  borderRadius: number;
  imageBorder: ImageBorder;
  shadowPreset: ShadowPreset;
}

export function pickFrame(current: {
  imageStylePreset: ImageStylePreset;
  borderRadius: number;
  imageBorder: ImageBorder;
  shadowPreset: ShadowPreset;
}): FrameRandomResult {
  const r = RANDOMIZE_RANGES.frame;
  const attempts = RANDOMIZE_RANGES.rerollAttempts;

  const stylePreset = pickDifferent(r.stylePresets, current.imageStylePreset, attempts, (a, b) => a === b);
  const shadowPreset = pickDifferent(r.shadowPresets, current.shadowPreset, attempts, (a, b) => a === b);
  const borderRadius = pickDifferent(r.borderRadiusChoices, current.borderRadius, attempts, (a, b) => a === b);
  const opacity = pickRandomInRange(r.opacity.min, r.opacity.max, r.opacity.step, current.imageBorder.opacity ?? 0.3);

  return {
    imageStylePreset: stylePreset,
    borderRadius,
    imageBorder: { ...current.imageBorder, opacity },
    shadowPreset,
  };
}

// ---------- Background ----------

export type BackgroundPick =
  | { type: 'image'; value: string }
  | { type: 'gradient'; value: string };

export function pickBackground(current: BackgroundConfig): BackgroundPick {
  const pool: BackgroundPick[] = [];

  // All category image paths
  for (const category of Object.keys(backgroundCategories)) {
    const paths = backgroundCategories[category] || [];
    for (const p of paths) pool.push({ type: 'image', value: p });
  }
  // Classic gradients
  for (const k of Object.keys(gradientColors) as GradientKey[]) {
    pool.push({ type: 'gradient', value: k });
  }
  // Mesh gradients (prefixed)
  for (const k of Object.keys(meshGradients) as MeshGradientKey[]) {
    pool.push({ type: 'gradient', value: `mesh:${k}` });
  }
  // Magic gradients (prefixed)
  for (const k of Object.keys(magicGradients) as MagicGradientKey[]) {
    pool.push({ type: 'gradient', value: `magic:${k}` });
  }

  const eq = (a: BackgroundPick, b: BackgroundPick) =>
    a.type === b.type && a.value === b.value;
  const currentAsPick: BackgroundPick = {
    type: current.type === 'image' ? 'image' : 'gradient',
    value: current.value ?? '',
  };

  return pickDifferent(pool, currentAsPick, RANDOMIZE_RANGES.rerollAttempts, eq);
}

// ---------- 3D ----------

export function pick3D(current: { rotateX: number; rotateY: number; rotateZ: number }): TransformPreset {
  const eq = (a: TransformPreset, b: TransformPreset) =>
    Math.abs(a.values.rotateX - b.values.rotateX) < 2 &&
    Math.abs(a.values.rotateY - b.values.rotateY) < 2 &&
    Math.abs(a.values.rotateZ - b.values.rotateZ) < 2;

  const currentAsPreset: TransformPreset = {
    name: '__current__',
    values: {
      perspective: 2400,
      rotateX: current.rotateX,
      rotateY: current.rotateY,
      rotateZ: current.rotateZ,
      translateX: 0,
      translateY: 0,
      scale: 1,
    },
  };
  return pickDifferent(TRANSFORM_PRESETS, currentAsPreset, RANDOMIZE_RANGES.rerollAttempts, eq);
}

// ---------- Motion ----------

/** Returns a random preset distinct from `currentPresetId` when possible. */
export function pickMotion(currentPresetId: string | null): AnimationPreset {
  const eq = (a: AnimationPreset, b: AnimationPreset) => a.id === b.id;
  const dummy: AnimationPreset = {
    ...ANIMATION_PRESETS[0],
    id: currentPresetId ?? '__none__',
  };
  return pickDifferent(ANIMATION_PRESETS, dummy, RANDOMIZE_RANGES.rerollAttempts, eq);
}
