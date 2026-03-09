'use client';

import * as React from 'react';
import { PresetGallery } from '@/components/presets/PresetGallery';
import {
  Settings02Icon,
  SlidersHorizontalIcon,
  ColorsIcon,
  MagicWand01Icon,
  RotateSquareIcon,
  VideoReplayIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  RefreshIcon,
  LayersLogoIcon,
} from 'hugeicons-react';
import {
  SettingsSection,
  EditSection,
  FramesSection,
  ShadowSection,
  BackgroundSection,
  TextSection,
  TransformsGallery,
  AnnotateSection,
  ImageOverlaySection,
  DepthSection,
  TweetImportSection,
  CodeSnippetSection,
} from './sections';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/lib/store';
import { AnimationPresetGallery } from '@/components/timeline/AnimationPresetGallery';


type TabType = 'settings' | 'edit' | 'background' | 'transforms' | 'animate' | 'depth';

const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
  { id: 'edit', icon: <SlidersHorizontalIcon size={20} />, label: 'Design' },
  { id: 'depth', icon: <LayersLogoIcon size={20} />, label: 'Layers' },
  { id: 'background', icon: <ColorsIcon size={20} />, label: 'BG' },
  { id: 'settings', icon: <Settings02Icon size={20} />, label: 'Adjust' },
  { id: 'transforms', icon: <RotateSquareIcon size={20} />, label: '3D' },
  { id: 'animate', icon: <VideoReplayIcon size={20} />, label: 'Motion' },
];

export function UnifiedRightPanel() {
  const { activeRightPanelTab, setActiveRightPanelTab, uploadedImageUrl, resetCanvasSettings } = useImageStore();
  const activeTab = activeRightPanelTab;
  const setActiveTab = setActiveRightPanelTab;
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const [templatesOpen, setTemplatesOpen] = React.useState(false);
  const [contentKey, setContentKey] = React.useState(activeTab);
  const [transitioning, setTransitioning] = React.useState(false);

  // Handle tab content fade transition
  React.useEffect(() => {
    if (activeTab !== contentKey) {
      setTransitioning(true);
      const timeout = setTimeout(() => {
        setContentKey(activeTab);
        setTransitioning(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [activeTab, contentKey]);

  // Close templates overlay on Escape
  React.useEffect(() => {
    if (!templatesOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTemplatesOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [templatesOpen]);

  return (
    <div className="w-full h-full bg-card flex flex-col overflow-hidden md:w-[460px] border-r border-border/40 relative">
      {/* Templates + Reset */}
      <div className="px-3 pt-3 shrink-0 space-y-2">
        <div className="flex gap-2">
          {/* Templates */}
          <button
            onClick={() => setTemplatesOpen(true)}
            className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-muted/80 dark:bg-muted/50 border border-border/20 hover:bg-accent transition-colors duration-150 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <MagicWand01Icon size={18} />
            </div>
            <span className="text-sm font-medium text-foreground">Templates</span>
            <ArrowRight01Icon
              size={16}
              className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors duration-150"
            />
          </button>
          {uploadedImageUrl && (
            <button
              onClick={resetCanvasSettings}
              className="flex items-center justify-center w-11 rounded-xl bg-muted/80 dark:bg-muted/50 border border-border/20 hover:bg-accent transition-colors duration-150 text-muted-foreground hover:text-foreground"
              title="Reset to defaults"
            >
              <RefreshIcon size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-3 py-3 border-b border-border/30 shrink-0">
        <div className="relative flex p-1 bg-muted/80 dark:bg-muted/50 rounded-xl border border-border/20">
          {/* Sliding background indicator */}
          <div
            className="absolute top-1 bottom-1 bg-background dark:bg-accent rounded-lg transition-all duration-250 ease-out"
            style={{
              left: `calc(${activeIndex * (100 / tabs.length)}% + 4px)`,
              width: `calc(${100 / tabs.length}% - 8px)`,
            }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative z-10 flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-colors duration-150',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content with fade transition */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div
          className="p-5 transition-all duration-150 ease-out"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(4px)' : 'translateY(0)',
          }}
        >
          {contentKey === 'settings' && (
            <div className="space-y-2">
              <SettingsSection />
            </div>
          )}

          {contentKey === 'edit' && (
            <div className="space-y-2">
              <TweetImportSection />
              <CodeSnippetSection />
              <ImageOverlaySection />
              <AnnotateSection />
              <TextSection />
              <EditSection />
              <FramesSection />
              <ShadowSection />
            </div>
          )}

          {contentKey === 'depth' && <DepthSection />}

          {contentKey === 'background' && (
            <div className="space-y-2">
              <BackgroundSection />
            </div>
          )}

          {contentKey === 'transforms' && <TransformsGallery />}

          {contentKey === 'animate' && <AnimationPresetGallery />}
        </div>
      </div>

      {/* Templates Overlay */}
      <div
        className={cn(
          'absolute inset-0 z-50 bg-card flex flex-col transition-all duration-300 ease-out',
          templatesOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 pointer-events-none'
        )}
      >
        {/* Overlay Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <MagicWand01Icon size={20} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Templates</h2>
          </div>
          <button
            onClick={() => setTemplatesOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors duration-150 text-muted-foreground hover:text-foreground"
          >
            <Cancel01Icon size={18} />
          </button>
        </div>

        {/* Overlay Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-5">
            <PresetGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
