'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return [h, s, v];
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse current color to HSV
  const rgb = hexToRgb(color) || [125, 212, 173]; // default to #7dd4ad
  const [hue, saturation, value] = rgbToHsv(rgb[0], rgb[1], rgb[2]);

  const [h, setH] = React.useState(hue);
  const [s, setS] = React.useState(saturation);
  const [v, setV] = React.useState(value);
  const [alpha, setAlpha] = React.useState(1);

  const saturationRef = React.useRef<HTMLDivElement>(null);
  const hueRef = React.useRef<HTMLDivElement>(null);
  const alphaRef = React.useRef<HTMLDivElement>(null);

  // Update internal state when color prop changes
  React.useEffect(() => {
    const rgb = hexToRgb(color);
    if (rgb) {
      const [newH, newS, newV] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      setH(newH);
      setS(newS);
      setV(newV);
    }
  }, [color]);

  // Update color when HSV changes
  const updateColor = React.useCallback((newH: number, newS: number, newV: number, newAlpha: number) => {
    const [r, g, b] = hsvToRgb(newH, newS, newV);
    if (newAlpha < 1) {
      onChange(`rgba(${r}, ${g}, ${b}, ${newAlpha.toFixed(2)})`);
    } else {
      onChange(rgbToHex(r, g, b));
    }
  }, [onChange]);

  // Handle saturation/brightness picker drag
  const handleSaturationMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (e: MouseEvent) => {
      if (!saturationRef.current) return;
      const rect = saturationRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setS(x);
      setV(1 - y);
      updateColor(h, x, 1 - y, alpha);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    handleMove(e.nativeEvent as unknown as MouseEvent);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Handle hue slider drag
  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (e: MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newH = x * 360;
      setH(newH);
      updateColor(newH, s, v, alpha);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    handleMove(e.nativeEvent as unknown as MouseEvent);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Handle alpha slider drag
  const handleAlphaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (e: MouseEvent) => {
      if (!alphaRef.current) return;
      const rect = alphaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setAlpha(x);
      updateColor(h, s, v, x);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    handleMove(e.nativeEvent as unknown as MouseEvent);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const currentRgb = hsvToRgb(h, s, v);
  const currentHex = rgbToHex(currentRgb[0], currentRgb[1], currentRgb[2]);
  const hueColor = rgbToHex(...hsvToRgb(h, 1, 1));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/40 bg-muted/30 hover:bg-accent hover:border-border/60 transition-all',
            className
          )}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/20"
              style={{ backgroundColor: currentHex }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{currentHex}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 border-2 border-primary/20"
        align="start"
        side="bottom"
      >
        <div className="space-y-3">
          {/* Saturation/Brightness picker */}
          <div
            ref={saturationRef}
            className="w-52 h-44 rounded-lg cursor-crosshair relative overflow-hidden"
            style={{
              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${hueColor})`,
            }}
            onMouseDown={handleSaturationMouseDown}
          >
            {/* Picker handle */}
            <div
              className="absolute w-6 h-6 rounded-full border-[3px] border-white shadow-lg pointer-events-none"
              style={{
                left: `${s * 100}%`,
                top: `${(1 - v) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: currentHex,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Hue slider */}
          <div
            ref={hueRef}
            className="w-52 h-4 rounded-full cursor-pointer relative overflow-hidden"
            style={{
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className="absolute w-5 h-5 rounded-full border-[3px] border-white shadow-lg pointer-events-none"
              style={{
                left: `${(h / 360) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: hueColor,
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
          </div>

          {/* Alpha slider */}
          <div
            ref={alphaRef}
            className="w-52 h-4 rounded-full cursor-pointer relative overflow-hidden"
            style={{
              background: `linear-gradient(to right, transparent, ${currentHex}), repeating-conic-gradient(#808080 0% 25%, #fff 0% 50%) 50% / 8px 8px`,
            }}
            onMouseDown={handleAlphaMouseDown}
          >
            <div
              className="absolute w-5 h-5 rounded-full border-[3px] border-white shadow-lg pointer-events-none"
              style={{
                left: `${alpha * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: `rgba(${currentRgb[0]}, ${currentRgb[1]}, ${currentRgb[2]}, ${alpha})`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
