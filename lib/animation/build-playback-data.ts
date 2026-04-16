import type { AnimationClip, AnimationTrack } from '@/types/animation'
import { getSlideAnimationTiming } from '@/lib/animation/config'
import { getAnyPresetById } from '@/lib/animation/exit-presets'
import { clonePresetTracks } from '@/lib/animation/presets'

interface SlideInput {
  id: string
  duration: number
  inPresetId: string | null
  outPresetId: string | null
}

/**
 * Compute animation clips and tracks from slide preset IDs.
 * Called at playback start and before export — nothing is stored.
 */
export function buildPlaybackData(
  slides: SlideInput[],
  defaultDuration: number,
): { clips: AnimationClip[]; tracks: AnimationTrack[] } {
  const clips: AnimationClip[] = []
  const tracks: AnimationTrack[] = []
  let slideStartMs = 0

  for (const slide of slides) {
    const slideDurationMs = (slide.duration || defaultDuration) * 1000
    const timing = getSlideAnimationTiming(slideDurationMs)

    if (slide.inPresetId) {
      const preset = getAnyPresetById(slide.inPresetId)
      if (preset) {
        const clipId = `playback-in-${slide.id}`
        const clip: AnimationClip = {
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: slideStartMs,
          duration: timing.inMs,
          color: '#10B981',
        }
        clips.push(clip)
        tracks.push(
          ...clonePresetTracks(preset, { startTime: slideStartMs, clipId }),
        )
      }
    }

    if (slide.outPresetId) {
      const preset = getAnyPresetById(slide.outPresetId)
      if (preset) {
        const outStartMs = slideStartMs + slideDurationMs - timing.outMs
        const clipId = `playback-out-${slide.id}`
        const clip: AnimationClip = {
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: outStartMs,
          duration: timing.outMs,
          color: '#10B981',
        }
        clips.push(clip)
        tracks.push(
          ...clonePresetTracks(preset, { startTime: outStartMs, clipId }),
        )
      }
    }

    slideStartMs += slideDurationMs
  }

  return { clips, tracks }
}

/**
 * Check if any slide has an animation preset assigned.
 */
export function hasAnySlideAnimations(
  slides: SlideInput[],
): boolean {
  return slides.some((s) => s.inPresetId !== null || s.outPresetId !== null)
}
