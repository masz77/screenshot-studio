import { ANIMATION_PRESETS } from './presets'
import type { AnimationPreset, AnimationTrack } from '@/types/animation'

/**
 * Reverse a track's keyframe property values.
 * First keyframe gets last's values, last gets first's — timing structure stays the same.
 */
function reverseTrack(track: AnimationTrack): AnimationTrack {
  const keyframes = track.keyframes
  if (keyframes.length < 2) return { ...track, keyframes: [...keyframes] }

  // Swap property values between mirrored positions
  const reversed = keyframes.map((kf, i) => {
    const mirrorIndex = keyframes.length - 1 - i
    return {
      ...kf,
      properties: { ...keyframes[mirrorIndex].properties },
    }
  })

  return { ...track, keyframes: reversed }
}

/**
 * Generate an exit name from an entrance name.
 * "Fade In" -> "Fade Out", "Hero Landing" -> "Hero Landing Out"
 */
function getExitName(name: string): string {
  if (name.endsWith(' In')) {
    return name.replace(/ In$/, ' Out')
  }
  if (name.endsWith(' In 3D')) {
    return name.replace(/ In 3D$/, ' Out 3D')
  }
  return `${name} Out`
}

/**
 * Auto-reverse an entrance preset to create an exit version.
 */
function reversePreset(preset: AnimationPreset): AnimationPreset {
  return {
    ...preset,
    id: `${preset.id}-out`,
    name: getExitName(preset.name),
    description: `Exit: ${preset.description}`,
    direction: 'out',
    tracks: preset.tracks.map(reverseTrack),
  }
}

/** All entrance presets auto-reversed to exit versions */
export const REVERSED_EXIT_PRESETS: AnimationPreset[] =
  ANIMATION_PRESETS.map(reversePreset)

/** Dedicated exit presets that don't map to a reversed entrance */
export const DEDICATED_EXIT_PRESETS: AnimationPreset[] = [
  {
    id: 'fade-out-dedicated',
    name: 'Fade Out',
    description: 'Simple opacity fade to transparent',
    category: 'fade',
    duration: 800,
    direction: 'out',
    tracks: [
      {
        id: 'fade-out-track',
        name: 'Fade Out',
        type: 'opacity',
        keyframes: [
          { id: 'fo-kf1', time: 0, properties: { imageOpacity: 1 }, easing: 'ease-in' },
          { id: 'fo-kf2', time: 800, properties: { imageOpacity: 0 }, easing: 'ease-in' },
        ],
        isLocked: false,
        isVisible: true,
      },
    ],
  },
  {
    id: 'shrink-away',
    name: 'Shrink Away',
    description: 'Scales down slightly while fading out',
    category: 'fade',
    duration: 800,
    direction: 'out',
    tracks: [
      {
        id: 'shrink-transform',
        name: 'Shrink Away',
        type: 'transform',
        keyframes: [
          { id: 'sa-kf1', time: 0, properties: { scale: 1 }, easing: 'ease-in' },
          { id: 'sa-kf2', time: 800, properties: { scale: 0.95 }, easing: 'ease-in-cubic' },
        ],
        isLocked: false,
        isVisible: true,
      },
      {
        id: 'shrink-opacity',
        name: 'Shrink Away Fade',
        type: 'opacity',
        keyframes: [
          { id: 'sa-kf3', time: 0, properties: { imageOpacity: 1 }, easing: 'ease-in' },
          { id: 'sa-kf4', time: 800, properties: { imageOpacity: 0 }, easing: 'ease-in' },
        ],
        isLocked: false,
        isVisible: true,
      },
    ],
  },
  {
    id: 'push-away',
    name: 'Push Away',
    description: 'Pushes into the screen with perspective while fading',
    category: 'depth',
    duration: 1000,
    direction: 'out',
    tracks: [
      {
        id: 'push-transform',
        name: 'Push Away',
        type: 'transform',
        keyframes: [
          { id: 'pa-kf1', time: 0, properties: { scale: 1, rotateX: 0, perspective: 2400 }, easing: 'ease-in' },
          { id: 'pa-kf2', time: 1000, properties: { scale: 0.95, rotateX: -10, perspective: 2400 }, easing: 'ease-in-cubic' },
        ],
        isLocked: false,
        isVisible: true,
      },
      {
        id: 'push-opacity',
        name: 'Push Away Fade',
        type: 'opacity',
        keyframes: [
          { id: 'pa-kf3', time: 400, properties: { imageOpacity: 1 }, easing: 'ease-in' },
          { id: 'pa-kf4', time: 1000, properties: { imageOpacity: 0 }, easing: 'ease-in' },
        ],
        isLocked: false,
        isVisible: true,
      },
    ],
  },
]

/** All exit presets: auto-reversed + dedicated */
export const ALL_EXIT_PRESETS: AnimationPreset[] = [
  ...REVERSED_EXIT_PRESETS,
  ...DEDICATED_EXIT_PRESETS,
]

/** Combined lookup map of all presets (entrance + exit) by ID */
const ALL_PRESETS_MAP = new Map<string, AnimationPreset>()
ANIMATION_PRESETS.forEach((p) => ALL_PRESETS_MAP.set(p.id, p))
ALL_EXIT_PRESETS.forEach((p) => ALL_PRESETS_MAP.set(p.id, p))

/** Look up any preset (entrance or exit) by ID */
export function getAnyPresetById(id: string): AnimationPreset | undefined {
  return ALL_PRESETS_MAP.get(id)
}
