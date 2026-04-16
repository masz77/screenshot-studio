import type { AnimatableProperties } from '@/types/animation';

/**
 * Module-level ref registry for direct DOM updates during playback.
 * Components register their DOM elements on mount.
 * useTimelinePlayback writes to them during the rAF loop to bypass React re-renders.
 */
export const playbackRefs = {
  /** Outer div -- CSS perspective property */
  perspectiveContainer: null as HTMLDivElement | null,
  /** Inner div -- CSS transform (translate, scale, rotateX/Y/Z) */
  transformDiv: null as HTMLDivElement | null,
  /** img element -- opacity */
  imageEl: null as HTMLImageElement | null,
  /** Cached screenshot.rotation (stable during playback, set by Perspective3DOverlay) */
  screenshotRotation: 0,
};

/**
 * Build the CSS transform string for the 3D overlay.
 * Must match the format in Perspective3DOverlay.tsx.
 */
export function buildTransformString(
  props: AnimatableProperties,
  rotationOffset: number,
): string {
  const rZ = props.rotateZ + rotationOffset;
  return `translate(${props.translateX}%, ${props.translateY}%) scale(${props.scale}) rotateX(${props.rotateX}deg) rotateY(${props.rotateY}deg) rotateZ(${rZ}deg)`;
}

/**
 * Apply interpolated animation values directly to registered DOM elements.
 * Returns true if the direct DOM path was used, false if refs are unavailable
 * (caller should fall back to Zustand store writes).
 */
export function applyDirectDOM(props: AnimatableProperties): boolean {
  const { perspectiveContainer, transformDiv, imageEl, screenshotRotation } =
    playbackRefs;

  if (!transformDiv) return false;

  transformDiv.style.transform = buildTransformString(props, screenshotRotation);
  transformDiv.style.transition = 'none';

  if (perspectiveContainer) {
    perspectiveContainer.style.perspective = `${props.perspective}px`;
  }

  if (imageEl) {
    imageEl.style.opacity = String(props.imageOpacity);
  }

  return true;
}

/**
 * Restore CSS transition on the transform div (called when playback stops).
 */
export function restoreTransition(): void {
  if (playbackRefs.transformDiv) {
    playbackRefs.transformDiv.style.transition = 'transform 0.125s linear';
  }
}
