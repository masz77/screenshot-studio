'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Image01Icon,
  Camera01Icon,
  CommandIcon,
  Globe02Icon,
  Loading03Icon,
} from 'hugeicons-react';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/constants';
import { useEditorStore, useImageStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBackgroundCSS } from '@/lib/constants/backgrounds';

const TRANSITION_DURATION = 400; // ms

function extractImageUrl(style: React.CSSProperties): string | null {
  const bg = style.backgroundImage;
  if (!bg || typeof bg !== 'string') return null;
  const match = bg.match(/url\(([^)]+)\)/);
  if (!match) return null;
  return match[1].replace(/['"]/g, '');
}

function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

export function CleanUploadState() {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = React.useState('');
  const [isCapturing, setIsCapturing] = React.useState(false);

  const { setScreenshot } = useEditorStore();
  const { addImages, setImage, backgroundConfig } = useImageStore();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Crossfade state
  const backgroundStyle = React.useMemo(
    () => getBackgroundCSS(backgroundConfig),
    [backgroundConfig]
  );
  const [activeLayer, setActiveLayer] = React.useState<'a' | 'b'>('a');
  const [layerAStyle, setLayerAStyle] = React.useState<React.CSSProperties>(backgroundStyle);
  const [layerBStyle, setLayerBStyle] = React.useState<React.CSSProperties>(backgroundStyle);
  const [showTransition, setShowTransition] = React.useState(false);
  const prevConfigRef = React.useRef(backgroundConfig);
  const isFirstRender = React.useRef(true);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
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

    if (!changed) {
      if (activeLayer === 'a') setLayerAStyle(backgroundStyle);
      else setLayerBStyle(backgroundStyle);
      return;
    }

    prevConfigRef.current = backgroundConfig;
    let cancelled = false;

    const applyNewBackground = (style: React.CSSProperties) => {
      if (cancelled) return;
      if (activeLayer === 'a') {
        setLayerBStyle(style);
        setShowTransition(true);
        requestAnimationFrame(() => { if (!cancelled) setActiveLayer('b'); });
      } else {
        setLayerAStyle(style);
        setShowTransition(true);
        requestAnimationFrame(() => { if (!cancelled) setActiveLayer('a'); });
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowTransition(false), TRANSITION_DURATION + 50);
    };

    if (backgroundConfig.type === 'image') {
      const url = extractImageUrl(backgroundStyle);
      if (url) {
        preloadImage(url)
          .then((loadedUrl) => {
            applyNewBackground({ ...backgroundStyle, backgroundImage: `url(${loadedUrl})` });
          })
          .catch(() => applyNewBackground(backgroundStyle));
        return () => { cancelled = true; if (timeoutRef.current) clearTimeout(timeoutRef.current); };
      }
    }

    applyNewBackground(backgroundStyle);
    return () => { cancelled = true; if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [backgroundConfig, backgroundStyle, activeLayer]);

  const validateFile = React.useCallback((file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `File type not supported. Please use: PNG, JPG, WEBP`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `File size too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  }, []);

  const handleFile = React.useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      const imageUrl = URL.createObjectURL(file);
      setScreenshot({ src: imageUrl });
    },
    [validateFile, setScreenshot]
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      addImages(acceptedFiles);
      handleFile(acceptedFiles[0]);
    },
    [addImages, handleFile]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneActive,
    open,
  } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_IMAGE_SIZE,
    multiple: true,
    noClick: true,
    onDragEnter: () => { setIsDragActive(true); setError(null); },
    onDragLeave: () => setIsDragActive(false),
    onDropRejected: (rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e) => e.code === 'file-too-large')) {
          setError(`File size too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
          setError('File type not supported. Please use: PNG, JPG, WEBP');
        } else {
          setError('Failed to upload file. Please try again.');
        }
      }
    },
  });

  // Auto-focus the container so paste events work immediately
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      const clipboardData = 'clipboardData' in e ? e.clipboardData : null;
      const items = clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            addImages([file]);
            handleFile(file);
          }
          break;
        }
      }
    },
    [addImages, handleFile]
  );

  // Listen on both document and the container for paste events
  React.useEffect(() => {
    const handler = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [handlePaste]);

  const handleCaptureScreenshot = async () => {
    if (!screenshotUrl.trim()) {
      setError('Please enter a URL');
      return;
    }
    let finalUrl = screenshotUrl.trim();
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`;
    }
    setIsCapturing(true);
    setError(null);
    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, deviceType: 'desktop' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to capture screenshot');
      let base64Data = data.screenshot.trim();
      if (base64Data.includes(',')) base64Data = base64Data.split(',')[1];
      base64Data = base64Data.replace(/\s/g, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);
      const file = new File([blob], 'screenshot.png', { type: 'image/png' });
      setScreenshot({ src: blobUrl });
      setImage(file);
      setScreenshotUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  };

  const active = isDragActive || dropzoneActive;

  return (
    <div
      ref={containerRef}
      {...getRootProps()}
      tabIndex={0}
      onPaste={handlePaste}
      className="relative w-full h-full flex items-center justify-center outline-none overflow-hidden"
    >
      {/* Background Layer A */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...layerAStyle,
          transition: showTransition ? `opacity ${TRANSITION_DURATION}ms ease-in-out` : undefined,
          opacity: activeLayer === 'a' ? (layerAStyle.opacity ?? 1) : 0,
          zIndex: 0,
        }}
      />
      {/* Background Layer B */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...layerBStyle,
          transition: showTransition ? `opacity ${TRANSITION_DURATION}ms ease-in-out` : undefined,
          opacity: activeLayer === 'b' ? (layerBStyle.opacity ?? 1) : 0,
          zIndex: 0,
        }}
      />
      <input {...getInputProps()} />

      {/* Upload Card */}
      <div
        className={cn(
          'relative z-10 rounded-lg p-6 md:p-8',
          'flex flex-col items-center justify-center text-center',
          'bg-popover/90 backdrop-blur-xl',
          'border border-border/30',
          'cursor-pointer transition-all duration-300 ease-out',
          'hover:scale-[1.01] hover:border-border/50',
          'w-[85%] max-w-[400px]',
          active && 'scale-[1.02] border-primary/40',
          'shadow-2xl'
        )}
        onClick={open}
      >
        {/* Icon */}
        <div className="mb-4 p-4 rounded-lg bg-muted/40 border border-border/30">
          <Image01Icon size={40} className="text-muted-foreground" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground mb-1.5">
          {active ? 'Drop the image here...' : 'Add Your Image'}
        </h2>

        {/* Subtitle */}
        {!active && (
          <p className="text-sm text-muted-foreground mb-4">
            Drag & drop, click to browse, or paste
          </p>
        )}

        {/* Paste Hint */}
        {!active && (
          <div className="flex flex-col gap-3 items-center">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <kbd className="bg-muted/60 border border-border/40 px-2 py-1 rounded-lg font-medium text-foreground/80 text-xs">
                <span className="flex items-center gap-1">
                  <CommandIcon size={12} />V
                </span>
              </kbd>
              <span>to Paste</span>
            </div>

            <span className="sm:hidden text-sm font-medium text-muted-foreground">
              Tap to browse
            </span>

            <div className="flex items-center gap-3 w-full max-w-[160px]">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-xs text-muted-foreground/70">or</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            {/* Screenshot URL Input - shown directly */}
            <div className="hidden lg:block w-full max-w-[260px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Globe02Icon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type="url"
                    placeholder="Enter URL to capture..."
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCaptureScreenshot()}
                    disabled={isCapturing}
                    className="pl-8 h-8 bg-muted/30 border-border/30 text-foreground placeholder:text-muted-foreground/50 text-xs"
                  />
                </div>
                <Button
                  onClick={handleCaptureScreenshot}
                  disabled={isCapturing || !screenshotUrl.trim()}
                  size="sm"
                  className="h-8 bg-foreground text-background hover:bg-foreground/90 px-3 transition-all duration-200"
                >
                  {isCapturing ? <Loading03Icon size={14} className="animate-spin" /> : <Camera01Icon size={14} />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
      </div>
    </div>
  );
}
