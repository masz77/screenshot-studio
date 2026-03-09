'use client';

import * as React from 'react';
import { PresetGallery } from '@/components/presets/PresetGallery';
import {
  SlidersHorizontalIcon,
  ColorsIcon,
  MagicWand01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  RefreshIcon,
  LayersLogoIcon,
} from 'hugeicons-react';
import {
  EditSection,
  FramesSection,
  ShadowSection,
  BackgroundSection,
  DepthSection,
  TweetImportSection,
  CodeSnippetSection,
  ImageOverlaySection,
  AnnotateSection,
  TextSection,
  SettingsSection,
} from './sections';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/lib/store';

type LeftTabType = 'edit' | 'background' | 'depth';

const leftTabs: { id: LeftTabType; icon: React.ReactNode; label: string }[] = [
  { id: 'edit', icon: <SlidersHorizontalIcon size={18} />, label: 'Design' },
  { id: 'background', icon: <ColorsIcon size={18} />, label: 'BG' },
  { id: 'depth', icon: <LayersLogoIcon size={18} />, label: 'Layers' },
];

export function LeftEditPanel() {
  const { uploadedImageUrl, resetCanvasSettings } = useImageStore();
  const [activeTab, setActiveTab] = React.useState<LeftTabType>('edit');
  const activeIndex = leftTabs.findIndex((t) => t.id === activeTab);

  const [templatesOpen, setTemplatesOpen] = React.useState(false);
  const [contentKey, setContentKey] = React.useState<LeftTabType>(activeTab);
  const [transitioning, setTransitioning] = React.useState(false);

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

  React.useEffect(() => {
    if (!templatesOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTemplatesOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [templatesOpen]);

  return (
    <div className="w-[240px] h-full bg-card flex flex-col overflow-hidden border-r border-border/40 relative shrink-0">
      {/* Templates + Reset */}
      <div className="px-2.5 pt-2.5 shrink-0 space-y-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setTemplatesOpen(true)}
            className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/80 dark:bg-muted/50 border border-border/20 hover:bg-accent transition-colors duration-150 group"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
              <MagicWand01Icon size={14} />
            </div>
            <span className="text-xs font-medium text-foreground">Templates</span>
            <ArrowRight01Icon
              size={14}
              className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors duration-150"
            />
          </button>
          {uploadedImageUrl && (
            <button
              onClick={resetCanvasSettings}
              className="flex items-center justify-center w-9 rounded-lg bg-muted/80 dark:bg-muted/50 border border-border/20 hover:bg-accent transition-colors duration-150 text-muted-foreground hover:text-foreground"
              title="Reset to defaults"
            >
              <RefreshIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-2.5 py-2.5 border-b border-border/30 shrink-0">
        <div className="relative flex p-0.5 bg-muted/80 dark:bg-muted/50 rounded-lg border border-border/20">
          <div
            className="absolute top-0.5 bottom-0.5 bg-background dark:bg-accent rounded-md transition-all duration-250 ease-out"
            style={{
              left: `calc(${activeIndex * (100 / leftTabs.length)}% + 2px)`,
              width: `calc(${100 / leftTabs.length}% - 4px)`,
            }}
          />
          {leftTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-md transition-colors duration-150',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div
          className="p-3 transition-all duration-150 ease-out"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(4px)' : 'translateY(0)',
          }}
        >
          {contentKey === 'edit' && (
            <div className="space-y-1">
              <TweetImportSection />
              <CodeSnippetSection />
              <ImageOverlaySection />
              <AnnotateSection />
              <TextSection />
              <EditSection />
              <FramesSection />
              <ShadowSection />
              <SettingsSection />
            </div>
          )}

          {contentKey === 'background' && (
            <div className="space-y-1">
              <BackgroundSection />
            </div>
          )}

          {contentKey === 'depth' && <DepthSection />}
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
        <div className="flex items-center justify-between px-3 py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <MagicWand01Icon size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Templates</h2>
          </div>
          <button
            onClick={() => setTemplatesOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted transition-colors duration-150 text-muted-foreground hover:text-foreground"
          >
            <Cancel01Icon size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-3">
            <PresetGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
