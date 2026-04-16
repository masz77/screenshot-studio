'use client'

import * as React from 'react'
import { Timeline } from '@xzdarcy/react-timeline-editor'
import type { TimelineState } from '@xzdarcy/react-timeline-editor'
import '@xzdarcy/react-timeline-editor/dist/react-timeline-editor.css'

import { useImageStore, useEditorStore } from '@/lib/store'
import { TimelineControls } from '@/components/timeline/TimelineControls'
import { useTimelinePlayback } from '@/components/timeline/hooks/useTimelinePlayback'
import { SlotRenderer } from '@/components/timeline/renderers/SlotRenderer'
import { MediaClipRenderer } from '@/components/timeline/renderers/MediaClipRenderer'
import {
  toTimelineRows,
  timelineEffects,
  ANIMATION_ROW_ID,
  MEDIA_ROW_ID,
} from '@/lib/timeline/adapters'
import type {
  SlotAction,
  MediaAction,
  TimelineRowBase,
  TimelineActionBase,
} from '@/lib/timeline/adapters'

const TIMELINE_HEIGHT = 248
const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

const SCALE_WIDTH = 160
const SCALE_SPLIT_COUNT = 10
const START_LEFT = 120

export function TimelineEditor() {
  const {
    timeline,
    uploadedImageUrl,
    imageName,
    slides,
    activeSlideId,
    showTimeline,
    setActiveRightPanelTab,
    toggleTimeline,
    setTimeline,
    setPlayhead,
    stopPlayback,
    removeSlide,
    setActiveSlide,
    setSlideInPreset,
    setSlideOutPreset,
  } = useImageStore()

  const {
    selectedSlot,
    pendingPresetId,
    setSelectedSlot,
    setPendingPresetId,
  } = useEditorStore()

  const timelineRef = React.useRef<TimelineState>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  useTimelinePlayback()

  // Build editor data from store state
  const editorData = React.useMemo(
    () =>
      toTimelineRows(
        slides,
        timeline.duration,
        uploadedImageUrl,
        imageName,
      ),
    [slides, timeline.duration, uploadedImageUrl, imageName],
  )

  // Sync store playhead → library cursor
  React.useEffect(() => {
    if (!timelineRef.current) return
    const timeSec = timeline.playhead / 1000
    timelineRef.current.setTime(timeSec)
  }, [timeline.playhead])

  // Handle cursor drag: update store playhead
  const handleCursorDrag = React.useCallback(
    (time: number) => {
      stopPlayback()
      setPlayhead(time * 1000)
    },
    [stopPlayback, setPlayhead],
  )

  // Handle click on time ruler
  const handleClickTimeArea = React.useCallback(
    (time: number) => {
      stopPlayback()
      setPlayhead(time * 1000)
      return undefined
    },
    [stopPlayback, setPlayhead],
  )

  // Handle click on action: select slide if media track
  const handleClickAction = React.useCallback(
    (
      _e: React.MouseEvent,
      params: { action: TimelineActionBase; row: TimelineRowBase },
    ) => {
      if (params.row.id === MEDIA_ROW_ID && params.action.id !== 'main') {
        const slideId = params.action.id.replace('media-', '')
        setActiveSlide(slideId)
      }
    },
    [setActiveSlide],
  )

  // Slot click handler (supports bidirectional flow)
  const handleSlotClick = React.useCallback(
    (slideId: string, slot: 'in' | 'out') => {
      // If a preset is pending (preset-first flow), assign it
      if (pendingPresetId) {
        if (slot === 'in') {
          setSlideInPreset(slideId, pendingPresetId)
        } else {
          setSlideOutPreset(slideId, pendingPresetId)
        }
        setPendingPresetId(null)
        return
      }

      // Otherwise, select the slot (slot-first flow)
      const isSameSlot =
        selectedSlot?.slideId === slideId && selectedSlot?.slot === slot
      setSelectedSlot(isSameSlot ? null : { slideId, slot })

      // Open animate tab in right panel
      setActiveRightPanelTab('animate')
    },
    [
      pendingPresetId,
      selectedSlot,
      setSlideInPreset,
      setSlideOutPreset,
      setPendingPresetId,
      setSelectedSlot,
      setActiveRightPanelTab,
    ],
  )

  // Clear slot handler
  const handleClearSlot = React.useCallback(
    (slideId: string, slot: 'in' | 'out') => {
      if (slot === 'in') {
        setSlideInPreset(slideId, null)
      } else {
        setSlideOutPreset(slideId, null)
      }
    },
    [setSlideInPreset, setSlideOutPreset],
  )

  // Custom action renderer
  const getActionRender = React.useCallback(
    (action: TimelineActionBase, row: TimelineRowBase) => {
      if (row.id === ANIMATION_ROW_ID) {
        return (
          <SlotRenderer
            action={action as SlotAction}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
            onClearSlot={handleClearSlot}
          />
        )
      }
      if (row.id === MEDIA_ROW_ID) {
        const mediaAction = action as MediaAction
        const slideId = mediaAction.id.replace('media-', '')
        return (
          <MediaClipRenderer
            action={mediaAction}
            isActive={activeSlideId === slideId}
            slidesCount={slides.length}
            onRemove={(id) => removeSlide(id.replace('media-', ''))}
            onSelect={(id) => setActiveSlide(id.replace('media-', ''))}
          />
        )
      }
      return null
    },
    [selectedSlot, handleSlotClick, handleClearSlot, activeSlideId, slides.length, removeSlide, setActiveSlide],
  )

  // Ctrl/Cmd + mousewheel zoom handler
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const currentZoom = useImageStore.getState().timeline.zoom
      const newZoom =
        Math.round(
          Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta)) * 100,
        ) / 100
      if (newZoom !== currentZoom) {
        setTimeline({ zoom: newZoom })
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [setTimeline])

  // Clear selection on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSlot(null)
        setPendingPresetId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedSlot, setPendingPresetId])

  if (!showTimeline || (!uploadedImageUrl && slides.length === 0)) {
    return null
  }

  const handleClose = () => {
    toggleTimeline()
  }

  const durationSec = timeline.duration / 1000
  const scaleWidth = SCALE_WIDTH * timeline.zoom

  return (
    <div
      className="timeline-editor-wrapper bg-card border-t border-border/40 flex flex-col"
      style={{ height: TIMELINE_HEIGHT }}
    >
      {/* Banner for preset-first flow */}
      {pendingPresetId && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border-b border-primary/20 shrink-0">
          <span className="text-xs font-medium text-primary">
            Click a slot to apply the selected animation
          </span>
          <button
            onClick={() => setPendingPresetId(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Controls bar */}
      <TimelineControls onClose={handleClose} />

      {/* Timeline area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-hidden">
        <Timeline
          ref={timelineRef}
          editorData={editorData as TimelineRowBase[]}
          effects={timelineEffects}
          scale={durationSec > 10 ? 2 : 1}
          scaleWidth={scaleWidth}
          scaleSplitCount={SCALE_SPLIT_COUNT}
          startLeft={START_LEFT}
          minScaleCount={Math.ceil(durationSec)}
          maxScaleCount={Math.ceil(durationSec) + 2}
          rowHeight={48}
          onCursorDrag={handleCursorDrag}
          onCursorDragEnd={handleCursorDrag}
          onClickTimeArea={handleClickTimeArea}
          onClickAction={handleClickAction}
          getActionRender={getActionRender}
          autoScroll
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
