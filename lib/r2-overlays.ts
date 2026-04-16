/**
 * Overlay Assets Configuration
 *
 * These are the paths to overlay images served from /public.
 */

import { getR2PublicUrl } from './r2';

/**
 * Arrow overlay paths
 */
export const ARROW_PATHS = [
  "overlays/arrow/arrow-1.svg",
  "overlays/arrow/arrow-2.svg",
  "overlays/arrow/arrow-3.svg",
  "overlays/arrow/arrow-4.svg",
  "overlays/arrow/arrow-5.svg",
  "overlays/arrow/arrow-6.svg",
  "overlays/arrow/arrow-7.svg",
  "overlays/arrow/arrow-8.svg",
  "overlays/arrow/arrow-9.svg",
  "overlays/arrow/arrow-10.svg",
] as const;

/**
 * Shadow overlay paths (served from /public/overlay-shadow/)
 */
export const SHADOW_OVERLAY_PATHS = [
  "/overlay-shadow/001.webp",
  "/overlay-shadow/002.webp",
  "/overlay-shadow/007.webp",
  "/overlay-shadow/017.webp",
  "/overlay-shadow/019.webp",
  "/overlay-shadow/023.webp",
  "/overlay-shadow/031.webp",
  "/overlay-shadow/037.webp",
  "/overlay-shadow/041.webp",
  "/overlay-shadow/050.webp",
  "/overlay-shadow/053.webp",
  "/overlay-shadow/057.webp",
  "/overlay-shadow/063.webp",
  "/overlay-shadow/064.webp",
  "/overlay-shadow/082.webp",
  "/overlay-shadow/083.webp",
  "/overlay-shadow/088.webp",
  "/overlay-shadow/097.webp",
  "/overlay-shadow/099.webp",
] as const;

/**
 * All overlay paths combined
 */
export const OVERLAY_PATHS = [...ARROW_PATHS, ...SHADOW_OVERLAY_PATHS] as const;

export type ArrowPath = typeof ARROW_PATHS[number];
export type ShadowOverlayPath = typeof SHADOW_OVERLAY_PATHS[number];
export type OverlayPath = typeof OVERLAY_PATHS[number];

/**
 * Get URL for an overlay image
 */
export function getOverlayUrl(path: string): string {
  return getR2PublicUrl(path);
}

/**
 * Check if a path is a known overlay path
 */
export function isOverlayPath(path: string): boolean {
  return (OVERLAY_PATHS as readonly string[]).includes(path);
}

/**
 * Check if a path is an arrow overlay
 */
export function isArrowPath(path: string): boolean {
  return (ARROW_PATHS as readonly string[]).includes(path);
}

/**
 * Check if a path is a shadow overlay
 */
export function isShadowOverlayPath(path: string): boolean {
  return (SHADOW_OVERLAY_PATHS as readonly string[]).includes(path);
}

/**
 * Get all available overlay paths
 */
export function getAllOverlayPaths(): readonly string[] {
  return OVERLAY_PATHS;
}

/**
 * Get all arrow paths
 */
export function getAllArrowPaths(): readonly string[] {
  return ARROW_PATHS;
}

/**
 * Get all shadow overlay paths
 */
export function getAllShadowOverlayPaths(): readonly string[] {
  return SHADOW_OVERLAY_PATHS;
}
