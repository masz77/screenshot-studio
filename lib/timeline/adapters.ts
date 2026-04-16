import type { AnimationClip } from '@/types/animation'

// ── Base types (structurally compatible with @xzdarcy/timeline-engine) ──

export interface TimelineActionBase {
  id: string
  start: number
  end: number
  effectId: string
  selected?: boolean
  flexible?: boolean
  movable?: boolean
  disable?: boolean
  minStart?: number
  maxEnd?: number
}

export interface TimelineRowBase {
  id: string
  actions: TimelineActionBase[]
  rowHeight?: number
  selected?: boolean
  classNames?: string[]
}

export interface TimelineEffectBase {
  id: string
  name?: string
}

// ── Extended action types ────────────────────────────────────────────

export interface AnimationAction extends TimelineActionBase {
  clipName: string
  clipColor: string
}

export interface MediaAction extends TimelineActionBase {
  slideName: string
  slideSrc: string
  slideIndex: number
}

// ── Slide type (matches store shape) ─────────────────────────────────

export interface Slide {
  id: string
  src: string
  name: string | null
  duration: number
}

// ── Row IDs ──────────────────────────────────────────────────────────

export const ANIMATION_ROW_ID = 'animation-row'
export const MEDIA_ROW_ID = 'media-row'

// ── Effect IDs ───────────────────────────────────────────────────────

export const ANIMATION_EFFECT_ID = 'animation-effect'
export const MEDIA_EFFECT_ID = 'media-effect'

// ── Effects map (required by the library) ────────────────────────────

export const timelineEffects: Record<string, TimelineEffectBase> = {
  [ANIMATION_EFFECT_ID]: { id: ANIMATION_EFFECT_ID, name: 'Animation' },
  [MEDIA_EFFECT_ID]: { id: MEDIA_EFFECT_ID, name: 'Media' },
}

// ── Conversion helpers (ms ↔ seconds) ────────────────────────────────

function msToSec(ms: number): number {
  return ms / 1000
}

function secToMs(sec: number): number {
  return sec * 1000
}

// ── Clips → Actions ──────────────────────────────────────────────────

function clipsToActions(clips: AnimationClip[]): AnimationAction[] {
  return clips.map((clip) => ({
    id: clip.id,
    start: msToSec(clip.startTime),
    end: msToSec(clip.startTime + clip.duration),
    effectId: ANIMATION_EFFECT_ID,
    clipName: clip.name,
    clipColor: clip.color,
  }))
}

// ── Slides → Actions (evenly distributed) ────────────────────────────

function slidesToActions(
  slides: Slide[],
  timelineDurationMs: number,
): MediaAction[] {
  if (slides.length === 0) return []
  const sliceDurationSec = msToSec(timelineDurationMs) / slides.length

  return slides.map((slide, index) => ({
    id: `media-${slide.id}`,
    start: index * sliceDurationSec,
    end: (index + 1) * sliceDurationSec,
    effectId: MEDIA_EFFECT_ID,
    slideName: slide.name ?? `Slide ${index + 1}`,
    slideSrc: slide.src,
    slideIndex: index,
    flexible: false,
    movable: false,
  }))
}

// ── Single image → Action (full duration) ────────────────────────────

function singleImageAction(
  imageUrl: string,
  imageName: string,
  durationMs: number,
): MediaAction[] {
  return [
    {
      id: 'main',
      start: 0,
      end: msToSec(durationMs),
      effectId: MEDIA_EFFECT_ID,
      slideName: imageName,
      slideSrc: imageUrl,
      slideIndex: 0,
      flexible: false,
      movable: false,
    },
  ]
}

// ── Build editorData ─────────────────────────────────────────────────

export function toTimelineRows(
  clips: AnimationClip[],
  slides: Slide[],
  timelineDurationMs: number,
  uploadedImageUrl: string | null,
  imageName: string | null,
): TimelineRowBase[] {
  const animationActions = clipsToActions(clips)

  const mediaActions =
    slides.length > 0
      ? slidesToActions(slides, timelineDurationMs)
      : uploadedImageUrl
        ? singleImageAction(uploadedImageUrl, imageName ?? 'Image', timelineDurationMs)
        : []

  return [
    {
      id: ANIMATION_ROW_ID,
      actions: animationActions,
      rowHeight: 48,
    },
    {
      id: MEDIA_ROW_ID,
      actions: mediaActions,
      rowHeight: 56,
    },
  ]
}

// ── Library onChange → store update ──────────────────────────────────

export function applyAnimationRowChanges(
  newActions: TimelineActionBase[],
  updateClip: (id: string, updates: { startTime?: number; duration?: number }) => void,
): void {
  for (const action of newActions) {
    updateClip(action.id, {
      startTime: secToMs(action.start),
      duration: secToMs(action.end - action.start),
    })
  }
}

