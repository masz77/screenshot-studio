'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  getBackgroundCSS,
  type BackgroundConfig,
} from '@/lib/constants/backgrounds';

interface HTMLBackgroundLayerProps {
  backgroundConfig: BackgroundConfig;
  backgroundBlur: number;
  backgroundBorderRadius: number;
  width: number;
  height: number;
  noiseTexture: HTMLCanvasElement | null;
  backgroundNoise: number;
}

const TRANSITION_DURATION = 400; // ms

/**
 * HTML/CSS-based background layer that replaces Konva BackgroundLayer.
 * Renders backgrounds (solid, gradient, image) with blur and noise support.
 * Uses a crossfade effect for smooth transitions between backgrounds.
 */
export function HTMLBackgroundLayer({
  backgroundConfig,
  backgroundBlur,
  backgroundBorderRadius,
  width,
  height,
  noiseTexture,
  backgroundNoise,
}: HTMLBackgroundLayerProps) {
  const backgroundStyle = useMemo(
    () => getBackgroundCSS(backgroundConfig),
    [backgroundConfig]
  );

  // Track which layer (A or B) is active for crossfade
  const [activeLayer, setActiveLayer] = useState<'a' | 'b'>('a');
  const [layerAStyle, setLayerAStyle] =
    useState<React.CSSProperties>(backgroundStyle);
  const [layerBStyle, setLayerBStyle] =
    useState<React.CSSProperties>(backgroundStyle);
  const [showTransition, setShowTransition] = useState(false);
  const prevConfigRef = useRef(backgroundConfig);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const abortController = new AbortController();

    // Skip crossfade on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setLayerAStyle(backgroundStyle);
      setLayerBStyle(backgroundStyle);
      return;
    }

    const prev = prevConfigRef.current;
    const changed =
      prev.type !== backgroundConfig.type ||
      prev.value !== backgroundConfig.value;

    if (changed) {
      prevConfigRef.current = backgroundConfig;

      const applyNewBackground = (style: React.CSSProperties) => {
        if (abortController.signal.aborted) return;
        if (activeLayer === 'a') {
          setLayerBStyle(style);
          setShowTransition(true);
          requestAnimationFrame(() => {
            if (!abortController.signal.aborted) setActiveLayer('b');
          });
        } else {
          setLayerAStyle(style);
          setShowTransition(true);
          requestAnimationFrame(() => {
            if (!abortController.signal.aborted) setActiveLayer('a');
          });
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setShowTransition(false);
        }, TRANSITION_DURATION + 50);
      };

      applyNewBackground(backgroundStyle);
    } else {
      // Opacity-only change, update active layer style directly
      if (activeLayer === 'a') {
        setLayerAStyle(backgroundStyle);
      } else {
        setLayerBStyle(backgroundStyle);
      }
    }

    return () => {
      abortController.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [backgroundConfig, backgroundStyle, activeLayer]);

  const noiseDataUrl = useMemo(() => {
    if (!noiseTexture || backgroundNoise <= 0) return null;
    try {
      return noiseTexture.toDataURL('image/png');
    } catch {
      return null;
    }
  }, [noiseTexture, backgroundNoise]);

  const sharedStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: `${backgroundBorderRadius}px`,
    overflow: 'hidden',
    filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
  };

  const transitionStyle = showTransition
    ? `opacity ${TRANSITION_DURATION}ms ease-in-out`
    : undefined;

  return (
    <>
      {/* Layer A */}
      <div
        id={activeLayer === 'a' ? 'canvas-background' : undefined}
        style={{
          ...sharedStyle,
          ...layerAStyle,
          zIndex: 0,
          transition: transitionStyle,
          opacity: activeLayer === 'a' ? (layerAStyle.opacity ?? 1) : 0,
        }}
      />

      {/* Layer B */}
      <div
        id={activeLayer === 'b' ? 'canvas-background' : undefined}
        style={{
          ...sharedStyle,
          ...layerBStyle,
          zIndex: 0,
          transition: transitionStyle,
          opacity: activeLayer === 'b' ? (layerBStyle.opacity ?? 1) : 0,
        }}
      />

      {/* Noise overlay */}
      {noiseDataUrl && backgroundNoise > 0 && (
        <div
          id="canvas-noise-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${backgroundBorderRadius}px`,
            backgroundImage: `url(${noiseDataUrl})`,
            backgroundRepeat: 'repeat',
            opacity: backgroundNoise / 100,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
    </>
  );
}
