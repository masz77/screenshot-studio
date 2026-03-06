'use client';

import { useState } from 'react';
import { useImageStore } from '@/lib/store';
import { Delete02Icon, ViewIcon, ViewOffSlashIcon, Add01Icon } from 'hugeicons-react';
import { fontFamilies, getAvailableFontWeights, getFontCSS } from '@/lib/constants/fonts';
import { cn } from '@/lib/utils';

const QUICK_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
];

const WEIGHT_LABELS: Record<string, string> = {
  '100': 'Thin',
  '200': 'Extra Light',
  '300': 'Light',
  'normal': 'Regular',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'Semibold',
  'bold': 'Bold',
  '700': 'Bold',
  '800': 'Extra Bold',
  '900': 'Black',
};

export const TextOverlayControls = () => {
  const {
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    clearTextOverlays,
  } = useImageStore();

  const [newText, setNewText] = useState('');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const selectedOverlay = textOverlays.find((o) => o.id === selectedOverlayId);

  const handleAddText = () => {
    if (!newText.trim()) return;
    const availableWeights = getAvailableFontWeights('system');
    addTextOverlay({
      text: newText.trim(),
      position: { x: 50, y: 50 },
      fontSize: 24,
      fontWeight: availableWeights[0] || 'normal',
      fontFamily: 'system',
      color: '#ffffff',
      opacity: 1,
      isVisible: true,
      orientation: 'horizontal',
      textShadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.5)',
        blur: 4,
        offsetX: 2,
        offsetY: 2,
      },
    });
    setNewText('');
  };

  return (
    <div className="space-y-3">

      {/* ── Add text input ── */}
      <div className="flex gap-1.5">
        <input
          placeholder="Add text..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
          className="flex-1 h-8 px-2.5 text-[12px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleAddText}
          disabled={!newText.trim()}
          className="h-8 px-2.5 rounded-md bg-primary text-primary-foreground text-[11px] font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <Add01Icon size={14} />
        </button>
      </div>

      {/* ── Overlay list ── */}
      {textOverlays.length > 0 && (
        <div className="space-y-1">
          {textOverlays.map((overlay) => {
            const isSelected = selectedOverlayId === overlay.id;
            return (
              <div
                key={overlay.id}
                onClick={() => setSelectedOverlayId(isSelected ? null : overlay.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all text-[11px] group',
                  isSelected
                    ? 'bg-accent border border-primary/30'
                    : 'hover:bg-muted/50 border border-transparent'
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTextOverlay(overlay.id, { isVisible: !overlay.isVisible });
                  }}
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {overlay.isVisible
                    ? <ViewIcon size={12} />
                    : <ViewOffSlashIcon size={12} />}
                </button>
                <span
                  className={cn(
                    'flex-1 truncate',
                    overlay.isVisible ? 'text-foreground' : 'text-muted-foreground line-through'
                  )}
                >
                  {overlay.text}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTextOverlay(overlay.id);
                    if (selectedOverlayId === overlay.id) setSelectedOverlayId(null);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Delete02Icon size={12} />
                </button>
              </div>
            );
          })}

          {textOverlays.length > 1 && (
            <button
              onClick={clearTextOverlays}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors px-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Selected overlay controls ── */}
      {selectedOverlay && (
        <div className="space-y-3 pt-1 border-t border-border/40">

          {/* Inline text edit */}
          <input
            value={selectedOverlay.text}
            onChange={(e) => updateTextOverlay(selectedOverlay.id, { text: e.target.value })}
            className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Color swatches */}
          <div className="flex items-center gap-1">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateTextOverlay(selectedOverlay.id, { color })}
                className={cn(
                  'w-[18px] h-[18px] rounded-full transition-all',
                  selectedOverlay.color === color
                    ? 'ring-1.5 ring-foreground ring-offset-1 ring-offset-background scale-110'
                    : 'hover:scale-110'
                )}
                style={{
                  backgroundColor: color,
                  border: color === '#ffffff' ? '1px solid hsl(var(--border))' : undefined,
                }}
              />
            ))}
            <div className="w-px h-4 bg-border/40 mx-0.5" />
            <input
              type="color"
              value={selectedOverlay.color}
              onChange={(e) => updateTextOverlay(selectedOverlay.id, { color: e.target.value })}
              className="w-[18px] h-[18px] rounded-full cursor-pointer border border-border/50 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
            />
          </div>

          {/* Font family */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Font</span>
            <select
              value={selectedOverlay.fontFamily}
              onChange={(e) => {
                const fontFamily = e.target.value;
                const weights = getAvailableFontWeights(fontFamily);
                const newWeight = weights.includes(selectedOverlay.fontWeight)
                  ? selectedOverlay.fontWeight
                  : weights[0] || 'normal';
                updateTextOverlay(selectedOverlay.id, { fontFamily, fontWeight: newWeight });
              }}
              className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {fontFamilies.map((font) => (
                <option key={font.id} value={font.id} style={{ fontFamily: getFontCSS(font.id) }}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Weight + Size row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</span>
              <select
                value={selectedOverlay.fontWeight}
                onChange={(e) => updateTextOverlay(selectedOverlay.id, { fontWeight: e.target.value })}
                className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {getAvailableFontWeights(selectedOverlay.fontFamily).map((w) => (
                  <option key={w} value={w}>{WEIGHT_LABELS[w] ?? w}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Size</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="8"
                  max="150"
                  step="1"
                  value={selectedOverlay.fontSize}
                  onChange={(e) => updateTextOverlay(selectedOverlay.id, { fontSize: Number(e.target.value) })}
                  className="flex-1 h-1 accent-primary"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{selectedOverlay.fontSize}</span>
              </div>
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacity</span>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedOverlay.opacity}
                onChange={(e) => updateTextOverlay(selectedOverlay.id, { opacity: Number(e.target.value) })}
                className="flex-1 h-1 accent-primary"
              />
              <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{Math.round(selectedOverlay.opacity * 100)}%</span>
            </div>
          </div>

          {/* Orientation toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50">
            {(['horizontal', 'vertical'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => updateTextOverlay(selectedOverlay.id, { orientation: dir })}
                className={cn(
                  'flex-1 h-7 rounded text-[11px] font-medium transition-all capitalize',
                  selectedOverlay.orientation === dir
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Text shadow toggle + controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Shadow</span>
              <button
                onClick={() => updateTextOverlay(selectedOverlay.id, {
                  textShadow: { ...selectedOverlay.textShadow, enabled: !selectedOverlay.textShadow.enabled },
                })}
                className={cn(
                  'w-7 h-4 rounded-full transition-colors relative',
                  selectedOverlay.textShadow.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm',
                    selectedOverlay.textShadow.enabled ? 'left-3.5' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            {selectedOverlay.textShadow.enabled && (
              <div className="space-y-2 pl-0.5">
                {/* Shadow blur */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-10">Blur</span>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={selectedOverlay.textShadow.blur}
                    onChange={(e) => updateTextOverlay(selectedOverlay.id, {
                      textShadow: { ...selectedOverlay.textShadow, blur: Number(e.target.value) },
                    })}
                    className="flex-1 h-1 accent-primary"
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums w-4 text-right">{selectedOverlay.textShadow.blur}</span>
                </div>
                {/* Shadow offset X */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-10">X</span>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={selectedOverlay.textShadow.offsetX}
                    onChange={(e) => updateTextOverlay(selectedOverlay.id, {
                      textShadow: { ...selectedOverlay.textShadow, offsetX: Number(e.target.value) },
                    })}
                    className="flex-1 h-1 accent-primary"
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums w-4 text-right">{selectedOverlay.textShadow.offsetX}</span>
                </div>
                {/* Shadow offset Y */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-10">Y</span>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={selectedOverlay.textShadow.offsetY}
                    onChange={(e) => updateTextOverlay(selectedOverlay.id, {
                      textShadow: { ...selectedOverlay.textShadow, offsetY: Number(e.target.value) },
                    })}
                    className="flex-1 h-1 accent-primary"
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums w-4 text-right">{selectedOverlay.textShadow.offsetY}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
