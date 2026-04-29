import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { TIMELINE_LEGEND_WIDTH } from '@/components/timeline/TimelineRowLegend';

const SCALE_WIDTH = 160; // matches TimelineEditor.tsx
const START_LEFT = 120;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export function useTimelineAutoFit(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  const fitMode = useImageStore((s) => s.timeline.fitMode);
  const durationMs = useImageStore((s) => s.timeline.duration);
  const slidesLength = useImageStore((s) => s.slides.length);
  const setTimeline = useImageStore((s) => s.setTimeline);

  React.useEffect(() => {
    if (fitMode !== 'fit') return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const recompute = () => {
      const rect = el.getBoundingClientRect();
      const usable =
        rect.width - TIMELINE_LEGEND_WIDTH - START_LEFT - 16 /* slack */;
      const durationSec = durationMs / 1000;
      if (usable <= 0 || durationSec <= 0) return;
      const desiredZoom = usable / (durationSec * SCALE_WIDTH);
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, desiredZoom));
      setTimeline({ zoom: Number(clamped.toFixed(3)) });
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitMode, durationMs, slidesLength, setTimeline, scrollContainerRef]);
}
