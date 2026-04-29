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
import { VideoReplayIcon } from "hugeicons-react";
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
          <span className="text-[11px] text-muted-foreground/70">Original</span>
          <GitHubStarButton compact />
          <span className="mx-1 h-3 w-px bg-border/60" />
          <span className="text-[11px] text-muted-foreground/70">
            This fork by Samuel Bui
          </span>
          <a
            href="https://github.com/masz77/screenshot-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-5 w-5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="masz77/screenshot-studio on GitHub"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/samuel-bui"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-5 w-5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Samuel Bui on LinkedIn"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="https://www.upwork.com/freelancers/~0139dabec3cdc15cc7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-5 w-5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Samuel Bui on Upwork"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.543-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
            </svg>
          </a>
          <a
            href="https://wa.me/84918475522"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-5 w-5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Message Samuel Bui on WhatsApp"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.713.307 1.27.491 1.704.629.716.227 1.367.195 1.882.118.574-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

export function EditorLayout() {
  return <EditorMain />;
}
