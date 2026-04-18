"use client";

import * as React from "react";
import { LeftEditPanel } from "./LeftEditPanel";
import { RightSettingsPanel } from "./RightSettingsPanel";
import { UnifiedRightPanel } from "./unified-right-panel";
import { EditorContent } from "./EditorContent";
import { EditorCanvas } from "@/components/canvas/EditorCanvas";
import { EditorStoreSync } from "@/components/canvas/EditorStoreSync";
import { EditorHeader } from "./EditorHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings02Icon } from "hugeicons-react";
import { useAutosaveDraft } from "@/hooks/useAutosaveDraft";
import { MobileBanner } from "./MobileBanner";
import { TimelineEditor } from "@/components/timeline";
import { useImageStore } from "@/lib/store";
import { trackEditorOpen } from "@/lib/analytics";
import { VideoReplayIcon, NewTwitterIcon } from "hugeicons-react";
import { cn } from "@/lib/utils";
import { GitHubStarButton } from "@/components/ui/github-star-button";

function EditorMain() {
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const { uploadedImageUrl, slides, showTimeline, toggleTimeline } = useImageStore();

  // enable autosave
  useAutosaveDraft();

  const hasContent = !!uploadedImageUrl || slides.length > 0;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    trackEditorOpen();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EditorStoreSync />

      {/* Mobile Banner */}
      <MobileBanner />

      {/* Global Header */}
      <EditorHeader />

      {/* Mobile Settings Button */}
      {isMobile && (
        <div className="bg-background border-b border-border flex items-center justify-end px-4 py-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSheetOpen(true)}
            className="h-9 w-9"
          >
            <Settings02Icon size={20} />
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Desktop */}
        {!isMobile && <LeftEditPanel />}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
          <div className="flex-1 flex items-center justify-center overflow-y-auto overflow-x-hidden relative">
            <EditorContent>
              <EditorCanvas />
            </EditorContent>

            {/* Floating Animate Button - bottom center of canvas */}
            {hasContent && !showTimeline && !isMobile && (
              <button
                onClick={toggleTimeline}
                className={cn(
                  'absolute bottom-4 left-1/2 -translate-x-1/2 z-20',
                  'flex items-center gap-2 px-5 py-2.5 rounded-full',
                  'bg-card/90 backdrop-blur-md border border-border/50',
                  'text-muted-foreground hover:text-foreground',
                  'shadow-lg hover:shadow-xl',
                  'transition-all duration-200 ease-out',
                  'hover:bg-card hover:border-border',
                  'group'
                )}
              >
                <VideoReplayIcon size={16} className="text-primary group-hover:text-primary" />
                <span className="text-sm font-medium">Animate</span>
              </button>
            )}
          </div>

          {/* Timeline Editor - shown when content exists and timeline is enabled */}
          {hasContent && showTimeline && !isMobile && <TimelineEditor />}
        </div>

        {/* Right Panel - Desktop */}
        {!isMobile && <RightSettingsPanel />}

        {/* Mobile Sheet - uses full UnifiedRightPanel with all tabs */}
        {isMobile && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent
              side="left"
              className="w-[460px] p-0 sm:max-w-[460px]"
            >
              <UnifiedRightPanel />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Footer spacer — half navbar height to prevent bottom content clipping */}
      {!isMobile && (
        <div className="h-7 bg-card border-t border-border/40 shrink-0 flex items-center justify-end px-3 gap-1.5">
          <GitHubStarButton compact />
          <a
            href="https://x.com/code_kartik"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-5 w-5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="@code_kartik on X"
          >
            <NewTwitterIcon className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export function EditorLayout() {
  return <EditorMain />;
}
