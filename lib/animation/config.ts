export const SLIDE_ANIMATION_CONFIG = {
  /** Fraction of slide duration used for entrance animation */
  inRatio: 0.10,
  /** Fraction of slide duration used for exit animation */
  outRatio: 0.10,
  /** Minimum animation duration in ms (prevents too-short on short slides) */
  minDurationMs: 400,
  /** Maximum animation duration in ms (prevents too-long on long slides) */
  maxDurationMs: 2000,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getSlideAnimationTiming(slideDurationMs: number): {
  inMs: number
  outMs: number
  holdMs: number
} {
  const { inRatio, outRatio, minDurationMs, maxDurationMs } = SLIDE_ANIMATION_CONFIG
  const inMs = clamp(slideDurationMs * inRatio, minDurationMs, maxDurationMs)
  const outMs = clamp(slideDurationMs * outRatio, minDurationMs, maxDurationMs)
  const holdMs = Math.max(0, slideDurationMs - inMs - outMs)
  return { inMs, outMs, holdMs }
}
