import type { AnimationClip, AnimationTrack } from '@/types/animation'
import { getSlideAnimationTiming } from '@/lib/animation/config'
import { getAnyPresetById } from '@/lib/animation/exit-presets'
import { clonePresetTracks } from '@/lib/animation/presets'

interface SlideInput {
  id: string
  duration: number
  inPresetId: string | null
  outPresetId: string | null
  inCustomTracks: AnimationTrack[] | null
  outCustomTracks: AnimationTrack[] | null
}

function offsetTracks(
  tracks: AnimationTrack[],
  startMs: number,
  clipId: string,
): AnimationTrack[] {
  return tracks.map((track) => ({
    ...track,
    clipId,
    keyframes: track.keyframes.map((kf) => ({
      ...kf,
      time: kf.time + startMs,
    })),
  }))
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

    // ── In ──
    if (slide.inCustomTracks && slide.inCustomTracks.length > 0) {
      const clipId = `playback-in-${slide.id}`
      clips.push({
        id: clipId,
        presetId: 'custom',
        name: 'Custom (In)',
        startTime: slideStartMs,
        duration: timing.inMs,
        color: '#10B981',
      })
      tracks.push(...offsetTracks(slide.inCustomTracks, slideStartMs, clipId))
    } else if (slide.inPresetId) {
      const preset = getAnyPresetById(slide.inPresetId)
      if (preset) {
        const clipId = `playback-in-${slide.id}`
        clips.push({
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: slideStartMs,
          duration: timing.inMs,
          color: '#10B981',
        })
        tracks.push(
          ...clonePresetTracks(preset, { startTime: slideStartMs, clipId }),
        )
      }
    }

    // ── Out ──
    if (slide.outCustomTracks && slide.outCustomTracks.length > 0) {
      const outStartMs = slideStartMs + slideDurationMs - timing.outMs
      const clipId = `playback-out-${slide.id}`
      clips.push({
        id: clipId,
        presetId: 'custom',
        name: 'Custom (Out)',
        startTime: outStartMs,
        duration: timing.outMs,
        color: '#10B981',
      })
      tracks.push(...offsetTracks(slide.outCustomTracks, outStartMs, clipId))
    } else if (slide.outPresetId) {
      const preset = getAnyPresetById(slide.outPresetId)
      if (preset) {
        const outStartMs = slideStartMs + slideDurationMs - timing.outMs
        const clipId = `playback-out-${slide.id}`
        clips.push({
          id: clipId,
          presetId: preset.id,
          name: preset.name,
          startTime: outStartMs,
          duration: timing.outMs,
          color: '#10B981',
        })
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
  return slides.some(
    (s) =>
      s.inPresetId !== null ||
      s.outPresetId !== null ||
      (s.inCustomTracks?.length ?? 0) > 0 ||
      (s.outCustomTracks?.length ?? 0) > 0,
  )
}
