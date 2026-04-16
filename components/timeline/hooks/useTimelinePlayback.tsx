'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { getClipInterpolatedProperties } from '@/lib/animation/interpolation';
import { DEFAULT_ANIMATABLE_PROPERTIES } from '@/types/animation';
import { applyDirectDOM, restoreTransition } from '@/lib/animation/playback-refs';
import { buildPlaybackData, hasAnySlideAnimations } from '@/lib/animation/build-playback-data';

/**
 * Calculate which slide should be active at a given time.
 */
function getActiveSlideAtTime(
  slides: { id: string; duration: number }[],
  timeMs: number,
  defaultDuration: number
): string | null {
  if (slides.length === 0) return null;
  if (slides.length === 1) return slides[0].id;

  let cumulativeTime = 0;
  for (const slide of slides) {
    const slideDurationMs = (slide.duration || defaultDuration) * 1000;
    if (timeMs < cumulativeTime + slideDurationMs) {
      return slide.id;
    }
    cumulativeTime += slideDurationMs;
  }
  return slides[slides.length - 1].id;
}

export function useTimelinePlayback() {
  const {
    timeline,
    slides,
    slideshow,
    setActiveSlide,
    setPerspective3D,
    setImageOpacity,
  } = useImageStore();

  const { isPlaying, playhead } = timeline;
  const lastTimeRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const playheadRef = React.useRef(timeline.playhead);
  const lastInterpolatedRef = React.useRef(DEFAULT_ANIMATABLE_PROPERTIES);
  const hasPlayedRef = React.useRef(false);

  // Keep playhead ref in sync
  React.useEffect(() => {
    playheadRef.current = timeline.playhead;
  }, [timeline.playhead]);

  // Animation loop
  React.useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (hasPlayedRef.current) {
        hasPlayedRef.current = false;
        const state = useImageStore.getState();
        const last = lastInterpolatedRef.current;
        state.setPerspective3D({
          perspective: last.perspective,
          rotateX: last.rotateX,
          rotateY: last.rotateY,
          rotateZ: last.rotateZ,
          translateX: last.translateX,
          translateY: last.translateY,
          scale: last.scale,
        });
        state.setImageOpacity(last.imageOpacity);
        restoreTransition();
      }
      return;
    }

    hasPlayedRef.current = true;

    // Build playback data once at playback start
    const state = useImageStore.getState();
    const { clips, tracks } = buildPlaybackData(
      state.slides,
      state.slideshow.defaultDuration,
    );

    const animate = (currentTime: number) => {
      const state = useImageStore.getState();
      const currentPlayhead = playheadRef.current;
      const {
        duration: currentDuration,
        isLooping: currentIsLooping,
      } = state.timeline;
      const currentSlides = state.slides;
      const currentActiveSlideId = state.activeSlideId;
      const defaultSlideDuration = state.slideshow.defaultDuration;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      let newPlayhead = currentPlayhead + deltaMs;
      let shouldStop = false;

      if (newPlayhead >= currentDuration) {
        if (currentIsLooping) {
          newPlayhead = newPlayhead % currentDuration;
        } else {
          newPlayhead = currentDuration;
          shouldStop = true;
        }
      }

      playheadRef.current = newPlayhead;
      state.setPlayhead(newPlayhead);

      if (currentSlides.length > 1) {
        const targetSlideId = getActiveSlideAtTime(
          currentSlides,
          newPlayhead,
          defaultSlideDuration,
        );
        if (targetSlideId && targetSlideId !== currentActiveSlideId) {
          state.setActiveSlide(targetSlideId);
        }
      }

      const interpolated = getClipInterpolatedProperties(
        clips,
        tracks,
        newPlayhead,
        DEFAULT_ANIMATABLE_PROPERTIES,
      );

      lastInterpolatedRef.current = interpolated;

      const usedDirectDOM = applyDirectDOM(interpolated);
      if (!usedDirectDOM) {
        state.setPerspective3D({
          perspective: interpolated.perspective,
          rotateX: interpolated.rotateX,
          rotateY: interpolated.rotateY,
          rotateZ: interpolated.rotateZ,
          translateX: interpolated.translateX,
          translateY: interpolated.translateY,
          scale: interpolated.scale,
        });
        if (interpolated.imageOpacity !== undefined) {
          state.setImageOpacity(interpolated.imageOpacity);
        }
      }

      if (shouldStop) {
        state.setPerspective3D({
          perspective: interpolated.perspective,
          rotateX: interpolated.rotateX,
          rotateY: interpolated.rotateY,
          rotateZ: interpolated.rotateZ,
          translateX: interpolated.translateX,
          translateY: interpolated.translateY,
          scale: interpolated.scale,
        });
        state.setImageOpacity(interpolated.imageOpacity);
        restoreTransition();
        state.setTimeline({ isPlaying: false });
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Scrubbing effect (when not playing)
  const prevPlayheadRef = React.useRef(playhead);

  React.useEffect(() => {
    if (isPlaying) return;

    const playheadChanged = prevPlayheadRef.current !== playhead;
    prevPlayheadRef.current = playhead;

    if (playheadChanged && slides.length > 1) {
      const targetSlideId = getActiveSlideAtTime(slides, playhead, slideshow.defaultDuration);
      if (targetSlideId && targetSlideId !== useImageStore.getState().activeSlideId) {
        setActiveSlide(targetSlideId);
      }
    }

    // Build playback data for scrub position
    const { clips, tracks } = buildPlaybackData(slides, slideshow.defaultDuration);

    const interpolated = getClipInterpolatedProperties(
      clips,
      tracks,
      playhead,
      DEFAULT_ANIMATABLE_PROPERTIES,
    );

    setPerspective3D({
      perspective: interpolated.perspective,
      rotateX: interpolated.rotateX,
      rotateY: interpolated.rotateY,
      rotateZ: interpolated.rotateZ,
      translateX: interpolated.translateX,
      translateY: interpolated.translateY,
      scale: interpolated.scale,
    });

    if (interpolated.imageOpacity !== undefined) {
      setImageOpacity(interpolated.imageOpacity);
    }
  }, [playhead, isPlaying, slides, slideshow.defaultDuration, setActiveSlide, setPerspective3D, setImageOpacity]);

  // Reset to defaults when all slide animations are cleared
  React.useEffect(() => {
    if (!hasAnySlideAnimations(slides)) {
      setPerspective3D({
        perspective: DEFAULT_ANIMATABLE_PROPERTIES.perspective,
        rotateX: DEFAULT_ANIMATABLE_PROPERTIES.rotateX,
        rotateY: DEFAULT_ANIMATABLE_PROPERTIES.rotateY,
        rotateZ: DEFAULT_ANIMATABLE_PROPERTIES.rotateZ,
        translateX: DEFAULT_ANIMATABLE_PROPERTIES.translateX,
        translateY: DEFAULT_ANIMATABLE_PROPERTIES.translateY,
        scale: DEFAULT_ANIMATABLE_PROPERTIES.scale,
      });
      setImageOpacity(DEFAULT_ANIMATABLE_PROPERTIES.imageOpacity);
    }
  }, [slides, setPerspective3D, setImageOpacity]);
}
