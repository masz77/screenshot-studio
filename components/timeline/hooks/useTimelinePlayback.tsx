'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { getClipInterpolatedProperties } from '@/lib/animation/interpolation';
import { DEFAULT_ANIMATABLE_PROPERTIES } from '@/types/animation';
import { applyDirectDOM, restoreTransition } from '@/lib/animation/playback-refs';

/**
 * Calculate which slide should be active at a given time
 * Returns the slide ID or null if no slides
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

  // If past all slides, return the last one
  return slides[slides.length - 1].id;
}

export function useTimelinePlayback() {
  const {
    timeline,
    animationClips,
    slides,
    activeSlideId,
    slideshow,
    setActiveSlide,
    setPlayhead,
    setTimeline,
    setPerspective3D,
    setImageOpacity,
  } = useImageStore();

  const { isPlaying, playhead, duration, isLooping, tracks } = timeline;
  const lastTimeRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const playheadRef = React.useRef(timeline.playhead);
  const lastInterpolatedRef = React.useRef(DEFAULT_ANIMATABLE_PROPERTIES);
  const hasPlayedRef = React.useRef(false);

  // Keep playhead ref in sync
  React.useEffect(() => {
    playheadRef.current = timeline.playhead;
  }, [timeline.playhead]);

  // Animation loop - minimal dependencies to prevent recreation
  React.useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Sync final state if we actually played (not on initial mount)
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

    const animate = (currentTime: number) => {
      // Get fresh state values to avoid stale closures
      const state = useImageStore.getState();
      const currentPlayhead = playheadRef.current;
      const {
        duration: currentDuration,
        isLooping: currentIsLooping,
        tracks: currentTracks,
      } = state.timeline;
      const currentSlides = state.slides;
      const currentActiveSlideId = state.activeSlideId;
      const currentAnimationClips = state.animationClips;
      const defaultSlideDuration = state.slideshow.defaultDuration;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Calculate new playhead position
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

      // Update playhead ref and store (cheap write, needed for timeline UI)
      playheadRef.current = newPlayhead;
      state.setPlayhead(newPlayhead);

      // Switch to the correct slide based on playhead position
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

      // Compute interpolated properties at current time
      const interpolated = getClipInterpolatedProperties(
        currentAnimationClips,
        currentTracks,
        newPlayhead,
        DEFAULT_ANIMATABLE_PROPERTIES,
      );

      // Store for sync-back when playback stops
      lastInterpolatedRef.current = interpolated;

      // Try direct DOM path (bypasses React re-renders for 3D overlay)
      const usedDirectDOM = applyDirectDOM(interpolated);

      if (!usedDirectDOM) {
        // Fallback: no 3D overlay rendered, write to store
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
        // Sync final state to store before stopping
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

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]); // Only depend on isPlaying to start/stop

  // Track whether the playhead value actually changed (vs re-render from other deps)
  const prevPlayheadRef = React.useRef(playhead);

  // Apply interpolated properties when playhead changes (for scrubbing)
  // Also switches slides and resets to defaults when playhead is outside any clip's time range
  React.useEffect(() => {
    if (isPlaying) return; // Skip during playback (handled in animation loop)

    // Only switch slides when the playhead actually moved (scrubbing),
    // NOT when activeSlideId changes from a user click — otherwise
    // clicking a slide gets immediately reverted by this effect.
    const playheadChanged = prevPlayheadRef.current !== playhead;
    prevPlayheadRef.current = playhead;

    if (playheadChanged && slides.length > 1) {
      const targetSlideId = getActiveSlideAtTime(slides, playhead, slideshow.defaultDuration);
      if (targetSlideId && targetSlideId !== useImageStore.getState().activeSlideId) {
        setActiveSlide(targetSlideId);
      }
    }

    // Always calculate interpolated values, even if no tracks
    // This ensures we reset to defaults when clips are removed or playhead is outside clips
    const interpolated = getClipInterpolatedProperties(
      animationClips,
      tracks,
      playhead,
      DEFAULT_ANIMATABLE_PROPERTIES
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
  }, [playhead, isPlaying, tracks, animationClips, slides, slideshow.defaultDuration, setActiveSlide, setPerspective3D, setImageOpacity]);

  // Reset to defaults when animation clips are removed
  React.useEffect(() => {
    if (animationClips.length === 0 && tracks.length === 0) {
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
  }, [animationClips.length, tracks.length, setPerspective3D, setImageOpacity]);
}
