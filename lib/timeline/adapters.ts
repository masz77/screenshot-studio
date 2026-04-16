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

export interface SlotAction extends TimelineActionBase {
  slideId: string
  slideName: string
  inPresetId: string | null
  outPresetId: string | null
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
  inPresetId: string | null
  outPresetId: string | null
}

// ── Row IDs ──────────────────────────────────────────────────────────

export const ANIMATION_ROW_ID = 'animation-row'
export const MEDIA_ROW_ID = 'media-row'

// ── Effect IDs ───────────────────────────────────────────────────────

export const SLOT_EFFECT_ID = 'slot-effect'
export const MEDIA_EFFECT_ID = 'media-effect'

// ── Effects map (required by the library) ────────────────────────────

export const timelineEffects: Record<string, TimelineEffectBase> = {
  [SLOT_EFFECT_ID]: { id: SLOT_EFFECT_ID, name: 'Animation Slot' },
  [MEDIA_EFFECT_ID]: { id: MEDIA_EFFECT_ID, name: 'Media' },
}

// ── Conversion helpers ──────────────────────────────────────────────

function msToSec(ms: number): number {
  return ms / 1000
}

// ── Slides → Slot Actions (one per slide, full width) ────────────────

function slidesToSlotActions(slides: Slide[]): SlotAction[] {
  let startSec = 0
  return slides.map((slide, index) => {
    const durationSec = slide.duration
    const action: SlotAction = {
      id: `slot-${slide.id}`,
      start: startSec,
      end: startSec + durationSec,
      effectId: SLOT_EFFECT_ID,
      slideId: slide.id,
      slideName: slide.name ?? `Slide ${index + 1}`,
      inPresetId: slide.inPresetId,
      outPresetId: slide.outPresetId,
      flexible: false,
      movable: false,
    }
    startSec += durationSec
    return action
  })
}

// ── Slides → Media Actions ──────────────────────────────────────────

function slidesToMediaActions(slides: Slide[]): MediaAction[] {
  let startSec = 0
  return slides.map((slide, index) => {
    const durationSec = slide.duration
    const action: MediaAction = {
      id: `media-${slide.id}`,
      start: startSec,
      end: startSec + durationSec,
      effectId: MEDIA_EFFECT_ID,
      slideName: slide.name ?? `Slide ${index + 1}`,
      slideSrc: slide.src,
      slideIndex: index,
      flexible: false,
      movable: false,
    }
    startSec += durationSec
    return action
  })
}

// ── Single image → Action (full duration, no slots) ─────────────────

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
  slides: Slide[],
  timelineDurationMs: number,
  uploadedImageUrl: string | null,
  imageName: string | null,
): TimelineRowBase[] {
  // Only show animation slots for multi-slide
  const slotActions = slides.length > 1 ? slidesToSlotActions(slides) : []

  const mediaActions =
    slides.length > 0
      ? slidesToMediaActions(slides)
      : uploadedImageUrl
        ? singleImageAction(uploadedImageUrl, imageName ?? 'Image', timelineDurationMs)
        : []

  const rows: TimelineRowBase[] = []

  if (slotActions.length > 0) {
    rows.push({
      id: ANIMATION_ROW_ID,
      actions: slotActions,
      rowHeight: 48,
    })
  }

  rows.push({
    id: MEDIA_ROW_ID,
    actions: mediaActions,
    rowHeight: 56,
  })

  return rows
}
