/**
 * Demo Images Configuration
 *
 * These are the paths to demo images served from /public.
 */

import { getR2PublicUrl } from './r2';

export const demoImagePaths: string[] = [
  "/demo/demo-1.png",
  "/demo/demo-2.png",
  "/demo/demo-3.png",
  "/demo/demo-4.png",
  "/demo/demo-5.png",
  "/demo/demo-6.png",
  "/demo/demo-11.png",
  "/demo/demo-8.png",
  "/demo/demo-9.png",
  "/demo/demo-10.png",
];

/**
 * Get URL for a demo image
 */
export function getDemoImageUrl(path: string): string {
  return getR2PublicUrl(path);
}
