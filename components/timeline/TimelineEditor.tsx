'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { TimelineControls } from './TimelineControls';
import { useTimelinePlayback } from './hooks/useTimelinePlayback';
import { cn } from '@/lib/utils';
import { VideoReplayIcon, Image01Icon, Cancel01Icon, Add01Icon } from 'hugeicons-react';
import type { AnimationClip } from '@/types/animation';

const TIMELINE_HEIGHT = 210;
const TRACK_LABEL_WIDTH = 120;
const PIXELS_PER_SECOND = 105;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `0:${seconds.toString().padStart(2, '0')}`;
}

/* ─── Time Track ─────────────────────────────────────────────── */
function TimeTrack({ duration, width }: { duration: number; width: number }) {
  const { setPlayhead, stopPlayback } = useImageStore();
  const durationSeconds = Math.ceil(duration / 1000);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / width));
    stopPlayback();
    setPlayhead(percentage * duration);
  };

  return (
    <div
      className="relative h-6 cursor-pointer select-none"
      style={{ width }}
      onClick={handleClick}
    >
      {Array.from({ length: durationSeconds + 1 }, (_, i) => {
        const leftPercent = (i / durationSeconds) * 100;
        const tickWidth = 100 / durationSeconds;
        return (
          <div
            key={i}
            className="absolute top-0 h-full"
            style={{ left: `${leftPercent}%`, width: `${tickWidth}%` }}
          >
            {/* Major tick: label + dot */}
            <div className="flex flex-col items-start h-full">
              <span className="text-[9px] text-muted-foreground/60 font-mono leading-none ml-1 mt-1">
                {formatTime(i * 1000)}
              </span>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30 ml-[1px] mt-auto mb-1" />
            </div>

            {/* Minor tick: half-second dot */}
            {i < durationSeconds && (
              <div
                className="absolute bottom-1 w-1 h-1 rounded-full bg-muted-foreground/15"
                style={{ left: '50%' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Playhead Ticker ────────────────────────────────────────── */
function PlayheadTicker({ position, height, timeLabel }: { position: number; height: number; timeLabel: string }) {
  const { setPlayhead, timeline, stopPlayback } = useImageStore();
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const track = document.querySelector('.timeline-track-area');
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      stopPlayback();
      setPlayhead(percentage * timeline.duration);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setPlayhead, timeline.duration, stopPlayback]);

  return (
    <div
      className="absolute top-0 z-30 cursor-ew-resize pointer-events-auto"
      style={{ left: position, height, transform: 'translateX(-50%)' }}
      onMouseDown={() => setIsDragging(true)}
    >
      <div className="relative flex flex-col items-center h-full">
        {/* Orb with time label */}
        <div className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground shrink-0 shadow-md min-w-[32px]">
          <span className="text-[9px] font-semibold tabular-nums leading-none">{timeLabel}</span>
        </div>
        {/* Needle */}
        <div className="w-[1.5px] flex-1 bg-primary" />
      </div>
    </div>
  );
}

/* ─── Resizable Animation Clip ───────────────────────────────── */
function ResizableAnimationClip({
  clip,
  timelineWidth,
  duration,
  isSelected,
  onSelect,
}: {
  clip: AnimationClip;
  timelineWidth: number;
  duration: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { updateAnimationClip, removeAnimationClip } = useImageStore();
  const [isDragging, setIsDragging] = React.useState<'move' | 'left' | 'right' | null>(null);
  const dragStartRef = React.useRef({ x: 0, startTime: 0, clipDuration: 0 });

  const leftPercent = (clip.startTime / duration) * 100;
  const widthPercent = (clip.duration / duration) * 100;

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaTime = (deltaX / timelineWidth) * duration;

      if (isDragging === 'move') {
        const newStart = Math.max(0, Math.min(duration - clip.duration, dragStartRef.current.startTime + deltaTime));
        updateAnimationClip(clip.id, { startTime: newStart });
      } else if (isDragging === 'left') {
        const newStart = Math.max(0, Math.min(clip.startTime + clip.duration - 200, dragStartRef.current.startTime + deltaTime));
        const newDuration = dragStartRef.current.clipDuration - (newStart - dragStartRef.current.startTime);
        updateAnimationClip(clip.id, { startTime: newStart, duration: Math.max(200, newDuration) });
      } else if (isDragging === 'right') {
        const newDuration = Math.max(200, Math.min(duration - clip.startTime, dragStartRef.current.clipDuration + deltaTime));
        updateAnimationClip(clip.id, { duration: newDuration });
      }
    };

    const handleMouseUp = () => setIsDragging(null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, clip, duration, timelineWidth, updateAnimationClip]);

  const startDrag = (type: 'move' | 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(type);
    dragStartRef.current = { x: e.clientX, startTime: clip.startTime, clipDuration: clip.duration };
  };

  return (
    <div
      className={cn(
        'absolute top-1 bottom-1 rounded-lg cursor-grab transition-shadow group',
        'bg-primary/15 border border-primary/30',
        isSelected ? 'ring-1 ring-primary/60 shadow-md bg-primary/25' : 'hover:bg-primary/20 hover:border-primary/40'
      )}
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
      onMouseDown={(e) => startDrag('move', e)}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-lg hover:bg-primary/20"
        onMouseDown={(e) => startDrag('left', e)}
      />

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-lg hover:bg-primary/20"
        onMouseDown={(e) => startDrag('right', e)}
      />

      {/* Content */}
      <div className="flex items-center gap-1.5 px-3 h-full overflow-hidden pointer-events-none">
        <VideoReplayIcon size={12} className="text-primary shrink-0" />
        <span className="text-[10px] text-primary font-medium truncate">{clip.name}</span>
      </div>

      {/* Delete on hover */}
      <button
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-sm z-10 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          removeAnimationClip(clip.id);
        }}
      >
        <Cancel01Icon size={8} className="text-destructive-foreground" />
      </button>
    </div>
  );
}

/* ─── Animation Track ────────────────────────────────────────── */
function AnimationTrack({ width, onAddAnimation }: { width: number; onAddAnimation?: () => void }) {
  const { timeline, animationClips } = useImageStore();
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const trackWidth = width - TRACK_LABEL_WIDTH;

  return (
    <div className="flex h-12">
      {/* Track label */}
      <div
        className="shrink-0 flex items-center gap-2.5 px-3 border-r border-border/20"
        style={{ width: TRACK_LABEL_WIDTH }}
      >
        {/* Animation icon (dotted line icon from shots.so) */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground shrink-0">
          <g fill="currentColor">
            <path d="M7.905 20.573a.616.616 0 0 1-1.23 0 .614.614 0 0 1 1.23 0m-.931-1.683a.617.617 0 0 1-.616.615.61.61 0 0 1-.611-.615c0-.335.269-.615.611-.615.335 0 .616.28.616.615m-.94-1.691a.61.61 0 0 1-.615.615.616.616 0 0 1-.612-.615c0-.335.281-.615.612-.615.342 0 .615.28.615.615m-.936-1.675a.62.62 0 0 1-.615.615.615.615 0 0 1 0-1.23c.334 0 .615.28.615.615m-.932-1.691a.62.62 0 0 1-.612.615.616.616 0 0 1-.615-.615c0-.335.273-.615.615-.615a.62.62 0 0 1 .612.615m-.94-1.683a.615.615 0 0 1-.611.615A.62.62 0 0 1 2 12.15c0-.335.28-.615.615-.615.339 0 .611.28.611.615m.94-1.683a.62.62 0 0 1-.612.615.616.616 0 0 1-.615-.615c0-.335.273-.615.615-.615a.62.62 0 0 1 .612.615m.932-1.691a.62.62 0 0 1-.615.615.615.615 0 0 1 0-1.23c.334 0 .615.28.615.615m.936-1.675a.616.616 0 0 1-.615.615.62.62 0 0 1-.612-.615c0-.343.281-.615.612-.615.342 0 .615.272.615.615m.94-1.691a.62.62 0 0 1-.615.615.613.613 0 0 1-.612-.615c0-.343.269-.615.612-.615.334 0 .615.272.615.615m.931-1.683a.614.614 0 1 1-1.232-.004.614.614 0 0 1 1.232.004" />
            <path d="M12.612 3.323l-4.89 8.489a.7.7 0 0 0-.109.338c0 .086.031.194.113.338l4.886 8.49c-.217.228-.437.326-.714.326-.465 0-.763-.265-1.156-.93l-4.135-7.168c-.228-.404-.341-.719-.341-1.056s.106-.652.337-1.056l4.139-7.169c.393-.664.691-.925 1.156-.925.276 0 .496.096.714.323" />
            <path d="M16.376 21.304c.457 0 .755-.265 1.148-.93l4.135-7.168c.231-.404.341-.719.341-1.056s-.11-.652-.341-1.056l-4.135-7.169C17.131 3.261 16.833 3 16.376 3c-.462 0-.764.261-1.153.925l-4.139 7.169c-.231.404-.34.719-.34 1.056s.113.652.344 1.056l4.135 7.168c.389.665.691.93 1.153.93m-.138-1.794-4.027-7.022c-.082-.144-.117-.237-.117-.338s.031-.194.109-.338l4.035-7.022a.149.149 0 0 1 .267 0l4.031 7.022c.082.144.117.237.117.338s-.035.194-.117.338l-4.031 7.022c-.061.114-.206.114-.267 0" />
          </g>
        </svg>
        <span className="text-[11px] text-muted-foreground font-medium">Animations</span>
      </div>

      {/* Track content */}
      <div
        className="relative shrink-0 timeline-track-area"
        style={{ width: trackWidth }}
        onClick={() => setSelectedClipId(null)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Clips */}
        {animationClips.map((clip) => (
          <ResizableAnimationClip
            key={clip.id}
            clip={clip}
            timelineWidth={trackWidth}
            duration={timeline.duration}
            isSelected={selectedClipId === clip.id}
            onSelect={() => setSelectedClipId(clip.id)}
          />
        ))}

        {/* Empty state */}
        {animationClips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {isHovered ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAnimation?.();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
              >
                <Add01Icon size={14} className="text-foreground" />
                <span className="text-xs text-foreground font-medium">Add Animation</span>
              </button>
            ) : (
              <span className="text-xs text-muted-foreground/40 font-medium">
                Hover here to add Animation
              </span>
            )}
          </div>
        )}

        {/* Add button at end when clips exist */}
        {animationClips.length > 0 && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddAnimation?.();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-accent hover:bg-accent/80 transition-colors"
          >
            <Add01Icon size={14} className="text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Video / Media Track ────────────────────────────────────── */
function VideoTrack({ width }: { width: number }) {
  const { slides, uploadedImageUrl, imageName, timeline, removeSlide, setActiveSlide, activeSlideId } = useImageStore();
  const durationSeconds = timeline.duration / 1000;
  const trackWidth = width - TRACK_LABEL_WIDTH;

  const mediaItems = slides.length > 0 ? slides : uploadedImageUrl ? [{
    id: 'main',
    src: uploadedImageUrl,
    name: imageName || 'Image',
    duration: durationSeconds,
  }] : [];

  const itemDurationMs = timeline.duration / Math.max(1, mediaItems.length);

  return (
    <div className="flex h-14">
      {/* Track label */}
      <div
        className="shrink-0 flex items-center gap-2.5 px-3 border-r border-border/20"
        style={{ width: TRACK_LABEL_WIDTH }}
      >
        {/* Thumbnail */}
        {mediaItems.length > 0 && mediaItems[0].src ? (
          <div className="w-5 h-5 rounded overflow-hidden shrink-0 border border-border/30">
            <img src={mediaItems[0].src} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <Image01Icon size={16} className="text-muted-foreground shrink-0" />
        )}
        <span className="text-[11px] text-muted-foreground font-medium truncate">
          {imageName || 'Screenshot'}
        </span>
      </div>

      {/* Track content */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: trackWidth }}
      >
        {/* Clip items */}
        <div className="absolute inset-0 flex">
          {mediaItems.map((item) => {
            const itemWidthPercent = 100 / mediaItems.length;
            const itemDurationSeconds = itemDurationMs / 1000;
            return (
              <div
                key={item.id}
                className={cn(
                  'relative h-full border-r border-border/10 cursor-pointer transition-all group/clip',
                  activeSlideId === item.id && slides.length > 1 && 'ring-1 ring-inset ring-primary/50'
                )}
                style={{ width: `${itemWidthPercent}%` }}
                onClick={() => item.id !== 'main' && setActiveSlide(item.id)}
              >
                {/* Clip content */}
                <div className="absolute inset-1 rounded-md overflow-hidden bg-muted/30 border border-border/20">
                  <div className="flex items-center gap-2 h-full px-2">
                    {/* Mini preview */}
                    <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-border/20">
                      <img src={item.src} alt="" className="w-full h-full object-cover" />
                    </div>
                    {/* Details */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-foreground/70 font-medium truncate">
                        {slides.length > 1 ? `Slide ${mediaItems.indexOf(item) + 1}` : 'Mockup'}
                      </span>
                      <span className="text-[9px] text-muted-foreground truncate">
                        {imageName || 'Screenshot'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove button for multi-slide */}
                {slides.length > 1 && item.id !== 'main' && (
                  <button
                    className="absolute top-0 right-0 w-4 h-4 bg-background/80 rounded-full flex items-center justify-center hover:bg-destructive z-10 opacity-0 group-hover/clip:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(item.id);
                    }}
                  >
                    <Cancel01Icon size={8} className="text-foreground" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Slide Duration Handle ──────────────────────────────────── */
function SlideDurationHandle({ timelineWidth, trackWidth, pixelsPerSecond }: { timelineWidth: number; trackWidth: number; pixelsPerSecond: number }) {
  const { timeline, setTimelineDuration } = useImageStore();
  const [isDragging, setIsDragging] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const trackArea = document.querySelector('.timeline-track-area');
      if (!trackArea) return;
      const rect = trackArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newDurationSeconds = Math.max(1, Math.min(30, Math.round(x / pixelsPerSecond)));
      setTimelineDuration(newDurationSeconds * 1000);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setTimelineDuration, pixelsPerSecond]);

  return (
    <div
      className="absolute top-0 bottom-0 z-20 flex items-stretch cursor-ew-resize group/handle"
      style={{ left: TRACK_LABEL_WIDTH + trackWidth }}
      onMouseDown={() => setIsDragging(true)}
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => !isDragging && setShowHint(false)}
    >
      {/* Handle knob */}
      <div className="w-2 h-full bg-border/40 hover:bg-primary/40 transition-colors flex items-center justify-center">
        <div className="w-0.5 h-6 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Hint tooltip */}
      {(showHint || isDragging) && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-foreground text-background text-[10px] font-medium whitespace-nowrap shadow-lg z-50">
          Drag to adjust duration
        </div>
      )}

      {/* Gray area beyond the handle */}
      <div className="w-[200px] h-full bg-muted/20" />
    </div>
  );
}

/* ─── Main Timeline Editor ───────────────────────────────────── */
export function TimelineEditor() {
  const { timeline, uploadedImageUrl, slides, showTimeline, setActiveRightPanelTab, toggleTimeline, setTimeline } = useImageStore();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useTimelinePlayback();

  const pixelsPerSecond = PIXELS_PER_SECOND * timeline.zoom;
  const durationSeconds = timeline.duration / 1000;
  const timelineWidth = Math.max(600, durationSeconds * pixelsPerSecond + TRACK_LABEL_WIDTH);

  // Ctrl/Cmd + mousewheel zoom handler
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const currentZoom = useImageStore.getState().timeline.zoom;
      const newZoom = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta)) * 100) / 100;
      if (newZoom !== currentZoom) {
        setTimeline({ zoom: newZoom });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setTimeline]);

  if (!showTimeline || (!uploadedImageUrl && slides.length === 0)) {
    return null;
  }

  const trackContentWidth = timelineWidth - TRACK_LABEL_WIDTH;
  const playheadPosition = (timeline.playhead / timeline.duration) * trackContentWidth + TRACK_LABEL_WIDTH;
  const playheadTimeLabel = formatTime(timeline.playhead);
  const totalTrackHeight = 25 + 49 + 57; // time(h-6=24+1border) + animation(h-12=48+1border) + video(h-14=56+1border)

  const handleAddAnimation = () => {
    setActiveRightPanelTab('animate');
  };

  const handleClose = () => {
    toggleTimeline();
  };

  return (
    <div className="bg-card border-t border-border/40 flex flex-col" style={{ height: TIMELINE_HEIGHT }}>
      {/* Controls bar */}
      <TimelineControls onAddAnimation={handleAddAnimation} onClose={handleClose} />

      {/* Tracks area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30"
      >
        <div style={{ width: timelineWidth + 200 }} className="relative">
          {/* Time track row */}
          <div className="flex h-6 border-b border-border/15">
            {/* Empty label space for time track */}
            <div
              className="shrink-0 border-r border-border/20"
              style={{ width: TRACK_LABEL_WIDTH }}
            />
            <TimeTrack duration={timeline.duration} width={trackContentWidth} />
          </div>

          {/* Animation track */}
          <div className="border-b border-border/15">
            <AnimationTrack width={timelineWidth} onAddAnimation={handleAddAnimation} />
          </div>

          {/* Video / Media track */}
          <div className="border-b border-border/15">
            <VideoTrack width={timelineWidth} />
          </div>

          {/* Playhead ticker — spans all tracks */}
          <PlayheadTicker
            position={playheadPosition}
            height={totalTrackHeight}
            timeLabel={playheadTimeLabel}
          />

          {/* Slide duration handle */}
          <SlideDurationHandle timelineWidth={timelineWidth} trackWidth={trackContentWidth} pixelsPerSecond={pixelsPerSecond} />
        </div>
      </div>
    </div>
  );
}
