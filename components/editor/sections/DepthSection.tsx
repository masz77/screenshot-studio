'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import type { ImageOverlay } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { getR2ImageUrl } from '@/lib/r2';
import { getOverlayUrl } from '@/lib/r2-overlays';
import { isOverlayPath } from '@/lib/r2-overlays';
import {
  Delete02Icon,
  ViewIcon,
  ViewOffSlashIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Upload04Icon,
  RotateRight01Icon,
  RotateLeft01Icon,
  RefreshIcon,
  Image01Icon,
  TextIcon,
  PencilEdit02Icon,
  BlurIcon,
  LayersLogoIcon,
  LayerBringForwardIcon,
  LayerSendBackwardIcon,
} from 'hugeicons-react';

// ── Local overlay assets ─────────────────────────────────────────────────────

const LOCAL_OBJECTS = [
  '/overlay/Sphere-Black_J0R1G4FTa.webp',
  '/overlay/Cube Black.png',
  '/overlay/Cube-Blue_5neS6XLEm.webp',
  '/overlay/Cone-Black_MA6nEafnH.webp',
  '/overlay/Cylinder-Black.webp',
  '/overlay/Cuboid-Black.webp',
  '/overlay/Hemisphere-Black.webp',
  '/overlay/Icosahedron-Black.webp',
  '/overlay/Pill-Black.webp',
  '/overlay/Torus-Black.webp',
  '/overlay/Torus-Knot-Black.webp',
  '/overlay/Circle1-Blue_FcSXRpwI5.webp',
  '/overlay/Circle2-Blue_dbyn-_NY_6.webp',
  '/overlay/Circle3-Blue_QVRHMAzwt.webp',
  '/overlay/Circle4-Blue_XuA_U_Gsl.webp',
  '/overlay/Circle5-Blue_UO9IKLT23.webp',
  '/overlay/Circle6-Blue_qRAqS7z5q.webp',
  '/overlay/Circle7-Blue_ldTpkiWch.webp',
  '/overlay/Circle8-Blue_Gu4BG_oiD.webp',
  '/overlay/Circle9-Blue_xUeQSO_R4.webp',
  '/overlay/Circle10-Blue_2-PyL3V8e.webp',
  '/overlay/Circle11-Blue_Z6rqYW4kb.webp',
  '/overlay/Circle12-Blue_xVHP9isTC.webp',
  '/overlay/Circle13-Blue_WifYa5D9W.webp',
  '/overlay/Circle14-Blue_Q6rPGEiJM.webp',
];

// ── Layer type helpers ───────────────────────────────────────────────────────

type LayerType = 'image-overlay' | 'text-overlay' | 'annotation' | 'blur';

interface LayerItem {
  id: string;
  type: LayerType;
  label: string;
  isVisible: boolean;
  thumbnailSrc?: string;
  layerPosition?: 'front' | 'back';
}

// ── Component ────────────────────────────────────────────────────────────────

export function DepthSection() {
  const {
    imageOverlays,
    textOverlays,
    annotations,
    blurRegions,
    addImageOverlay,
    updateImageOverlay,
    removeImageOverlay,
    reorderImageOverlay,
    updateTextOverlay,
    removeAnnotation,
    updateAnnotation,
    removeBlurRegion,
  } = useImageStore();

  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Build unified layer list (bottom to top: image overlays order, then text, then annotations, then blur)
  const layers = React.useMemo<LayerItem[]>(() => {
    const items: LayerItem[] = [];

    // Image overlays (array order = z-order, first = bottom)
    imageOverlays.forEach((overlay, i) => {
      const isR2 = isOverlayPath(overlay.src) || (typeof overlay.src === 'string' && overlay.src.startsWith('overlays/'));
      const thumbSrc = isR2 && !overlay.isCustom ? getR2ImageUrl({ src: overlay.src }) : overlay.src;
      // Derive a readable label from the filename
      const nameFromPath = overlay.src.startsWith('/')
        ? overlay.src.split('/').pop()?.replace(/\.\w+$/, '').replace(/[-_][A-Za-z0-9]{6,}$/, '').replace(/[-_]/g, ' ').trim() ?? `Asset ${i + 1}`
        : null;
      items.push({
        id: overlay.id,
        type: 'image-overlay',
        label: nameFromPath || (overlay.isCustom ? `Upload ${i + 1}` : `Overlay ${i + 1}`),
        isVisible: overlay.isVisible,
        thumbnailSrc: thumbSrc,
        layerPosition: overlay.layer || 'front',
      });
    });

    // Text overlays
    textOverlays.forEach((text, i) => {
      items.push({
        id: text.id,
        type: 'text-overlay',
        label: text.text?.slice(0, 16) || `Text ${i + 1}`,
        isVisible: text.isVisible,
      });
    });

    // Annotations
    annotations.forEach((ann, i) => {
      items.push({
        id: ann.id,
        type: 'annotation',
        label: `${ann.type.charAt(0).toUpperCase() + ann.type.slice(1)} ${i + 1}`,
        isVisible: ann.isVisible,
      });
    });

    // Blur regions
    blurRegions.forEach((blur, i) => {
      items.push({
        id: blur.id,
        type: 'blur',
        label: `Blur ${i + 1}`,
        isVisible: blur.isVisible,
      });
    });

    return items;
  }, [imageOverlays, textOverlays, annotations, blurRegions]);

  // Handle file upload for custom overlay
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    addImageOverlay({
      src: blobUrl,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
      size: 150,
      rotation: 0,
      opacity: 1,
      flipX: false,
      flipY: false,
      isVisible: true,
      isCustom: true,
    });

    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  // Handle adding an asset from the gallery
  const handleAddAsset = (assetPath: string) => {
    const isLocal = assetPath.startsWith('/');
    addImageOverlay({
      src: isLocal ? assetPath : assetPath,
      position: { x: 250 + Math.random() * 60, y: 250 + Math.random() * 60 },
      size: 150,
      rotation: 0,
      opacity: 1,
      flipX: false,
      flipY: false,
      isVisible: true,
      isCustom: isLocal,
    });
  };

  // Toggle visibility for any layer type
  const handleToggleVisibility = (layer: LayerItem) => {
    switch (layer.type) {
      case 'image-overlay':
        updateImageOverlay(layer.id, { isVisible: !layer.isVisible });
        break;
      case 'text-overlay':
        updateTextOverlay(layer.id, { isVisible: !layer.isVisible });
        break;
      case 'annotation':
        updateAnnotation(layer.id, { isVisible: !layer.isVisible });
        break;
      case 'blur':
        // BlurRegion doesn't have isVisible toggle in store, skip
        break;
    }
  };

  // Remove any layer type
  const handleRemoveLayer = (layer: LayerItem) => {
    switch (layer.type) {
      case 'image-overlay':
        removeImageOverlay(layer.id);
        break;
      case 'text-overlay':
        // No removeTextOverlay in store, skip
        break;
      case 'annotation':
        removeAnnotation(layer.id);
        break;
      case 'blur':
        removeBlurRegion(layer.id);
        break;
    }
    if (selectedLayerId === layer.id) {
      setSelectedLayerId(null);
    }
  };

  // Get icon for layer type
  const getLayerIcon = (type: LayerType) => {
    switch (type) {
      case 'image-overlay':
        return <Image01Icon size={14} />;
      case 'text-overlay':
        return <TextIcon size={14} />;
      case 'annotation':
        return <PencilEdit02Icon size={14} />;
      case 'blur':
        return <BlurIcon size={14} />;
    }
  };

  // Selected image overlay (for editing controls)
  const selectedOverlay = selectedLayerId
    ? imageOverlays.find((o) => o.id === selectedLayerId) ?? null
    : null;

  const activeAssets = LOCAL_OBJECTS;

  return (
    <div className="space-y-2">
      {/* ── Asset picker ── */}
      <SectionWrapper title="Add Assets" defaultOpen={true}>
        <div className="space-y-3">
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-150"
          >
            <Upload04Icon size={16} />
            <span className="text-xs font-medium">Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Asset grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {activeAssets.map((assetPath) => {
              const isLocal = assetPath.startsWith('/');
              const url = isLocal ? assetPath : getOverlayUrl(assetPath);
              const isSvg = assetPath.endsWith('.svg');
              return (
                <button
                  key={assetPath}
                  onClick={() => handleAddAsset(assetPath)}
                  className="aspect-square rounded-lg border border-border/30 bg-muted/30 hover:bg-accent hover:border-border/60 transition-all duration-150 overflow-hidden p-1.5 group"
                  title="Click to add"
                >
                  <img
                    src={url}
                    alt=""
                    draggable={false}
                    className={cn(
                      'w-full h-full object-contain group-hover:scale-110 transition-transform duration-150',
                      isSvg && 'dark:invert dark:opacity-80'
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </SectionWrapper>

      {/* ── Layer list ── */}
      <SectionWrapper
        title="Layers"
        defaultOpen={true}
        action={
          layers.length > 0 ? (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {layers.length}
            </span>
          ) : undefined
        }
      >
        {layers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <LayersLogoIcon size={28} className="text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              No layers yet. Add assets above or use the Edit tab.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Render in reverse so top of list = top of canvas */}
            {[...layers].reverse().map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              const isImageOverlay = layer.type === 'image-overlay';

              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(isSelected ? null : layer.id)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group',
                    isSelected
                      ? 'bg-primary/10 border border-primary/25'
                      : 'hover:bg-accent/60 border border-transparent'
                  )}
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-8 h-8 rounded-md bg-muted/60 border border-border/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {layer.thumbnailSrc ? (
                      <img
                        src={layer.thumbnailSrc}
                        alt=""
                        draggable={false}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-muted-foreground/60">
                        {getLayerIcon(layer.type)}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {layer.label}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {layer.type.replace('-', ' ')}
                      </p>
                      {isImageOverlay && layer.layerPosition === 'back' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground leading-none">
                          back
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Front/Back toggle (image overlays only) */}
                    {isImageOverlay && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newLayer = layer.layerPosition === 'back' ? 'front' : 'back';
                          updateImageOverlay(layer.id, { layer: newLayer });
                        }}
                        className={cn(
                          'p-1 rounded transition-colors opacity-0 group-hover:opacity-100',
                          layer.layerPosition === 'back'
                            ? 'text-primary hover:bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        title={layer.layerPosition === 'back' ? 'Move to front of image' : 'Move behind image'}
                      >
                        {layer.layerPosition === 'back'
                          ? <LayerBringForwardIcon size={13} />
                          : <LayerSendBackwardIcon size={13} />}
                      </button>
                    )}
                    {/* Reorder (image overlays only) */}
                    {isImageOverlay && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderImageOverlay(layer.id, 'up');
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                          title="Move up (forward)"
                        >
                          <ArrowUp01Icon size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderImageOverlay(layer.id, 'down');
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                          title="Move down (backward)"
                        >
                          <ArrowDown01Icon size={13} />
                        </button>
                      </>
                    )}

                    {/* Visibility */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(layer);
                      }}
                      className={cn(
                        'p-1 rounded transition-colors',
                        layer.isVisible
                          ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          : 'text-muted-foreground/40 hover:text-foreground hover:bg-accent'
                      )}
                      title={layer.isVisible ? 'Hide' : 'Show'}
                    >
                      {layer.isVisible ? <ViewIcon size={14} /> : <ViewOffSlashIcon size={14} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLayer(layer);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <Delete02Icon size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionWrapper>

      {/* ── Selected overlay controls ── */}
      {selectedOverlay && (
        <SectionWrapper title="Properties" defaultOpen={true}>
          <OverlayProperties
            overlay={selectedOverlay}
            onUpdate={(updates) => updateImageOverlay(selectedOverlay.id, updates)}
            onRemove={() => {
              removeImageOverlay(selectedOverlay.id);
              setSelectedLayerId(null);
            }}
          />
        </SectionWrapper>
      )}
    </div>
  );
}

// ── Overlay properties sub-component ─────────────────────────────────────────

function OverlayProperties({
  overlay,
  onUpdate,
  onRemove,
}: {
  overlay: ImageOverlay;
  onUpdate: (updates: Partial<ImageOverlay>) => void;
  onRemove: () => void;
}) {
  const normalizeRotation = (rotation: number): number => {
    let normalized = rotation % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    return normalized;
  };

  return (
    <div className="space-y-3">
      {/* Size */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Size</span>
        <Slider
          value={[overlay.size]}
          onValueChange={(v) => onUpdate({ size: v[0] })}
          min={20}
          max={600}
          step={1}
          valueDisplay={`${overlay.size}px`}
        />
      </div>

      {/* Rotation */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Rotation</span>
        <Slider
          value={[overlay.rotation]}
          onValueChange={(v) => onUpdate({ rotation: v[0] })}
          min={-180}
          max={180}
          step={1}
          valueDisplay={`${overlay.rotation}°`}
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => onUpdate({ rotation: normalizeRotation(overlay.rotation - 90) })}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted/50 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RotateLeft01Icon size={13} /> -90
          </button>
          <button
            onClick={() => onUpdate({ rotation: 0 })}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted/50 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshIcon size={13} /> Reset
          </button>
          <button
            onClick={() => onUpdate({ rotation: normalizeRotation(overlay.rotation + 90) })}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted/50 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RotateRight01Icon size={13} /> +90
          </button>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Opacity</span>
        <Slider
          value={[overlay.opacity]}
          onValueChange={(v) => onUpdate({ opacity: v[0] })}
          min={0}
          max={1}
          step={0.01}
          valueDisplay={`${Math.round(overlay.opacity * 100)}%`}
        />
      </div>

      {/* Flip */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onUpdate({ flipX: !overlay.flipX })}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
            overlay.flipX
              ? 'bg-primary/10 text-primary border-primary/25'
              : 'bg-muted/50 text-muted-foreground border-border/30 hover:text-foreground hover:bg-accent'
          )}
        >
          Flip X
        </button>
        <button
          onClick={() => onUpdate({ flipY: !overlay.flipY })}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
            overlay.flipY
              ? 'bg-primary/10 text-primary border-primary/25'
              : 'bg-muted/50 text-muted-foreground border-border/30 hover:text-foreground hover:bg-accent'
          )}
        >
          Flip Y
        </button>
      </div>

      {/* Layer position: front / back */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Position</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onUpdate({ layer: 'front' })}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
              (overlay.layer || 'front') === 'front'
                ? 'bg-primary/10 text-primary border-primary/25'
                : 'bg-muted/50 text-muted-foreground border-border/30 hover:text-foreground hover:bg-accent'
            )}
          >
            In Front
          </button>
          <button
            onClick={() => onUpdate({ layer: 'back' })}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
              overlay.layer === 'back'
                ? 'bg-primary/10 text-primary border-primary/25'
                : 'bg-muted/50 text-muted-foreground border-border/30 hover:text-foreground hover:bg-accent'
            )}
          >
            Behind Image
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors"
      >
        <Delete02Icon size={14} />
        Remove
      </button>
    </div>
  );
}
