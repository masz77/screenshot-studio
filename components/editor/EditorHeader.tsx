'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewTwitterIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import {
  Download04Icon,
  Copy01Icon,
  AspectRatioIcon,
  VideoReplayIcon,
  Add01Icon,
  Video01Icon,
  Delete02Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
} from 'hugeicons-react';
import { useEditorStore, useImageStore } from '@/lib/store';
import { useExport } from '@/hooks/useExport';
import { aspectRatios } from '@/lib/constants/aspect-ratios';
import { AspectRatioPicker } from '@/components/aspect-ratio/aspect-ratio-picker';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { ExportDialog } from '@/components/canvas/dialogs/ExportDialog';
import { CopyProgressDialog } from '@/components/canvas/dialogs/CopyProgressDialog';
import { ExportSlideshowDialog } from '@/lib/export-slideshow-dialog';
import { cn } from '@/lib/utils';
import { GitHubStarButton } from '@/components/ui/github-star-button';

export function EditorHeader() {
  const { screenshot } = useEditorStore();
  const { selectedAspectRatio, showTimeline, toggleTimeline, slides, uploadedImageUrl, clearImage, timeline, animationClips } = useImageStore();
  const [aspectRatioOpen, setAspectRatioOpen] = React.useState(false);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportSlideshowOpen, setExportSlideshowOpen] = React.useState(false);

  const currentAspectRatio = aspectRatios.find((ar) => ar.id === selectedAspectRatio);
  const hasImage = !!screenshot.src;

  // Undo/redo state
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  React.useEffect(() => {
    const updateTemporalState = () => {
      const { pastStates, futureStates } = useImageStore.temporal.getState();
      setCanUndo(pastStates.length > 0);
      setCanRedo(futureStates.length > 0);
    };
    updateTemporalState();
    const unsubscribe = useImageStore.temporal.subscribe(updateTemporalState);
    return unsubscribe;
  }, []);

  const handleUndo = React.useCallback(() => {
    const { undo, pastStates } = useImageStore.temporal.getState();
    if (pastStates.length > 0) undo();
  }, []);

  const handleRedo = React.useCallback(() => {
    const { redo, futureStates } = useImageStore.temporal.getState();
    if (futureStates.length > 0) redo();
  }, []);

  const showVideoExport = slides.length > 0 || timeline.tracks.length > 0 || animationClips.length > 0;

  const {
    copyImage,
    isExporting,
    isCopying,
    progress,
    copyProgress,
    settings: exportSettings,
    exportImage,
    updateScale,
    updateFormat,
    updateQualityPreset,
  } = useExport(selectedAspectRatio);

  return (
    <>
      <header className="h-14 bg-card border-b border-border/40 flex items-center justify-between px-4 shrink-0">
        {/* Left - Logo + Undo/Redo */}
        <div className="flex items-center gap-3">
          <Link href="/landing" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Screenshot Studio"
              width={48}
              height={48}
              className="h-12 w-12"
            />
          </Link>

          {hasImage && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'text-muted-foreground transition-all duration-150',
                  canUndo
                    ? 'hover:bg-accent hover:text-foreground active:scale-95'
                    : 'opacity-40 cursor-not-allowed'
                )}
                title="Undo (Cmd+Z)"
              >
                <ArrowTurnBackwardIcon size={16} />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'text-muted-foreground transition-all duration-150',
                  canRedo
                    ? 'hover:bg-accent hover:text-foreground active:scale-95'
                    : 'opacity-40 cursor-not-allowed'
                )}
                title="Redo (Cmd+Shift+Z)"
              >
                <ArrowTurnForwardIcon size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Center - Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setExportDialogOpen(true)}
            disabled={!hasImage}
            variant="outline"
            className="h-9 justify-center gap-2 rounded-lg font-medium px-4"
          >
            <Download04Icon size={16} />
            <span>Save</span>
          </Button>

          <Button
            onClick={() => copyImage()}
            disabled={!hasImage || isExporting || isCopying}
            variant="outline"
            className="h-9 justify-center gap-2 rounded-lg font-medium px-4"
          >
            <Copy01Icon size={16} />
            <span>Copy</span>
          </Button>

          <Popover open={aspectRatioOpen} onOpenChange={setAspectRatioOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 justify-center gap-2 rounded-lg font-medium px-4 bg-muted/50"
              >
                <AspectRatioIcon size={16} />
                <span>{currentAspectRatio ? `${currentAspectRatio.width}:${currentAspectRatio.height}` : 'auto'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[420px]" align="center" sideOffset={8} collisionPadding={16}>
              <AspectRatioPicker onSelect={() => setAspectRatioOpen(false)} />
            </PopoverContent>
          </Popover>

          <Button
            onClick={toggleTimeline}
            disabled={!hasImage}
            variant="outline"
            className={`h-9 justify-center gap-2 rounded-lg font-medium px-4 ${showTimeline ? 'bg-primary/15 border-primary/40 text-primary' : ''}`}
          >
            <VideoReplayIcon size={16} />
            <span>Animate</span>
          </Button>
        </div>

        {/* Right - Slide controls + Social Links */}
        <div className="flex items-center gap-2">
          {slides.length > 0 && (
            <label className="cursor-pointer inline-flex">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    useImageStore.getState().addImages(Array.from(e.target.files));
                  }
                }}
              />
              <span className="h-8 inline-flex items-center justify-center gap-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm transition-all font-medium border border-border px-3">
                <Add01Icon size={14} />
                <span>Add Slide</span>
              </span>
            </label>
          )}

          {showVideoExport && (
            <Button
              onClick={() => setExportSlideshowOpen(true)}
              size="sm"
              className="h-8 justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all font-medium px-3"
            >
              <Video01Icon size={14} />
              <span>Export Video</span>
            </Button>
          )}

          {hasImage && (
            <Button
              onClick={clearImage}
              variant="ghost"
              size="sm"
              className="h-8 justify-center gap-2 px-3 text-muted-foreground hover:text-destructive"
            >
              <Delete02Icon size={14} />
              <span>Remove</span>
            </Button>
          )}

          <div className="flex items-center gap-1.5 ml-1">
            <GitHubStarButton compact />
            <a
              href="https://x.com/code_kartik"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <NewTwitterIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <CopyProgressDialog open={isCopying} progress={copyProgress} />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={() => exportImage().then(() => {})}
        scale={exportSettings.scale}
        format={exportSettings.format}
        qualityPreset={exportSettings.qualityPreset}
        isExporting={isExporting}
        progress={progress}
        onScaleChange={updateScale}
        onFormatChange={updateFormat}
        onQualityPresetChange={updateQualityPreset}
      />

      <ExportSlideshowDialog
        open={exportSlideshowOpen}
        onOpenChange={setExportSlideshowOpen}
      />
    </>
  );
}
