'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { getR2ImageUrl } from '@/lib/r2';
import { isOverlayPath } from '@/lib/r2-overlays';
import { ArrowRight01Icon, LayersLogoIcon, Image01Icon } from 'hugeicons-react';

function getThumbSrc(overlay: { src: string; isCustom?: boolean }) {
  const isR2 =
    isOverlayPath(overlay.src) ||
    (typeof overlay.src === 'string' && overlay.src.startsWith('overlays/'));
  return isR2 && !overlay.isCustom
    ? getR2ImageUrl({ src: overlay.src })
    : overlay.src;
}

export function ImageOverlaySection() {
  const { imageOverlays, textOverlays, annotations, blurRegions, setActiveRightPanelTab, addImageOverlay } =
    useImageStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddImage = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      addImageOverlay({
        src: url,
        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
        size: 250,
        rotation: 0,
        opacity: 1,
        flipX: false,
        flipY: false,
        isVisible: true,
        isCustom: true,
      });
    });
    e.target.value = '';
  }, [addImageOverlay]);

  const totalLayers =
    imageOverlays.length + textOverlays.length + annotations.length + blurRegions.length;

  // Show up to 4 thumbnails from image overlays for the stacked preview
  const previewOverlays = imageOverlays.slice(-4);

  return (
    <SectionWrapper title="Overlays" defaultOpen={true}>
      <div className="space-y-2">
        {/* Add Image button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleAddImage}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-dashed border-border/40 hover:bg-accent/60 hover:border-primary/30 transition-all duration-150 group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <Image01Icon size={16} />
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Add Image to Canvas
          </span>
        </button>

        {/* Depth panel link */}
        <button
          onClick={() => setActiveRightPanelTab('depth')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/40 border border-border/30 hover:bg-accent/60 hover:border-border/50 transition-all duration-150 group"
        >
        {/* Stacked thumbnail preview or icon */}
        <div className="relative w-10 h-10 shrink-0">
          {previewOverlays.length > 0 ? (
            previewOverlays.map((overlay, i) => (
              <div
                key={overlay.id}
                className="absolute w-7 h-7 rounded-md bg-muted border border-border/40 overflow-hidden shadow-sm"
                style={{
                  top: `${(previewOverlays.length - 1 - i) * 3}px`,
                  left: `${i * 3}px`,
                  zIndex: i,
                }}
              >
                <img
                  src={getThumbSrc(overlay)}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain"
                />
              </div>
            ))
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/30 flex items-center justify-center">
              <LayersLogoIcon size={18} className="text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Label + count */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-foreground">
            {totalLayers > 0 ? `${totalLayers} layer${totalLayers !== 1 ? 's' : ''}` : 'No layers'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalLayers > 0 ? 'Manage depth & assets' : 'Add stickers, overlays & more'}
          </p>
        </div>

        <ArrowRight01Icon
          size={16}
          className="text-muted-foreground group-hover:text-foreground shrink-0 transition-colors"
        />
      </button>
      </div>
    </SectionWrapper>
  );
}
