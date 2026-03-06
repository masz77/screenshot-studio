"use client";

import * as React from "react";
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

function EditorMain() {
  const isMobile = useIsMobile();
  const [rightPanelOpen, setRightPanelOpen] = React.useState(false);
  const { timeline, uploadedImageUrl, slides, showTimeline } = useImageStore();

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
            onClick={() => setRightPanelOpen(true)}
            className="h-9 w-9"
          >
            <Settings02Icon size={20} />
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Desktop */}
        {!isMobile && <UnifiedRightPanel />}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
          <div className="flex-1 flex items-center justify-center overflow-y-auto overflow-x-hidden">
            <EditorContent>
              <EditorCanvas />
            </EditorContent>
          </div>

          {/* Timeline Editor - shown when content exists and timeline is enabled */}
          {hasContent && showTimeline && !isMobile && <TimelineEditor />}
        </div>

        {/* Left Panel - Mobile Sheet */}
        {isMobile && (
          <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetContent
              side="left"
              className="w-[460px] p-0 sm:max-w-[460px]"
            >
              <UnifiedRightPanel />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}

export function EditorLayout() {
  return <EditorMain />;
}
