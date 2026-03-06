'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { BlurRegion } from '@/lib/store';

interface HTMLBlurRegionLayerProps {
  blurRegions: BlurRegion[];
  selectedBlurId: string | null;
  setSelectedBlurId: (id: string | null) => void;
  updateBlurRegion: (id: string, updates: Partial<BlurRegion>) => void;
  removeBlurRegion: (id: string) => void;
}

function DraggableBlurRegion({
  region,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: {
  region: BlurRegion;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BlurRegion>) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
    posX: number;
    posY: number;
    handle: string;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: region.position.x,
        posY: region.position.y,
      };
      onSelect();
    },
    [isResizing, region.position.x, region.position.y, onSelect]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        width: region.size.width,
        height: region.size.height,
        posX: region.position.x,
        posY: region.position.y,
        handle,
      };
      onSelect();
    },
    [region.size.width, region.size.height, region.position.x, region.position.y, onSelect]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      onUpdate({
        position: {
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        },
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdate]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;

      const dx = e.clientX - start.mouseX;
      const dy = e.clientY - start.mouseY;

      let newW = start.width;
      let newH = start.height;
      let newX = start.posX;
      let newY = start.posY;

      if (start.handle.includes('r')) newW = Math.max(30, start.width + dx);
      if (start.handle.includes('l')) {
        newW = Math.max(30, start.width - dx);
        newX = start.posX + dx;
      }
      if (start.handle.includes('b')) newH = Math.max(30, start.height + dy);
      if (start.handle.includes('t')) {
        newH = Math.max(30, start.height - dy);
        newY = start.posY + dy;
      }

      onUpdate({
        position: { x: newX, y: newY },
        size: { width: newW, height: newH },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onUpdate]);

  useEffect(() => {
    if (!isSelected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onRemove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, onRemove]);

  if (!region.isVisible) return null;

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${region.position.x}px`,
        top: `${region.position.y}px`,
        width: `${region.size.width}px`,
        height: `${region.size.height}px`,
        backdropFilter: `blur(${region.blurAmount}px)`,
        WebkitBackdropFilter: `blur(${region.blurAmount}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        outline: isSelected ? '2px solid hsl(var(--primary) / 0.6)' : '1px dashed hsl(var(--primary) / 0.3)',
        outlineOffset: '0px',
        borderRadius: '4px',
        zIndex: 210,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Resize handles */}
      {isSelected && (
        <>
          {(['tl', 'tr', 'bl', 'br'] as const).map((handle) => {
            const isTop = handle.includes('t');
            const isLeft = handle.includes('l');

            let cursor = 'default';
            if (handle === 'tl' || handle === 'br') cursor = 'nwse-resize';
            else if (handle === 'tr' || handle === 'bl') cursor = 'nesw-resize';

            return (
              <div
                key={handle}
                onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'white',
                  border: '2px solid hsl(var(--primary))',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  top: isTop ? '-5px' : undefined,
                  bottom: !isTop ? '-5px' : undefined,
                  left: isLeft ? '-5px' : undefined,
                  right: !isLeft ? '-5px' : undefined,
                  cursor,
                  zIndex: 20,
                  pointerEvents: 'auto',
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export function HTMLBlurRegionLayer({
  blurRegions,
  selectedBlurId,
  setSelectedBlurId,
  updateBlurRegion,
  removeBlurRegion,
}: HTMLBlurRegionLayerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 210,
      }}
    >
      {blurRegions.map((region) => (
        <DraggableBlurRegion
          key={region.id}
          region={region}
          isSelected={selectedBlurId === region.id}
          onSelect={() => setSelectedBlurId(region.id)}
          onUpdate={(updates) => updateBlurRegion(region.id, updates)}
          onRemove={() => {
            removeBlurRegion(region.id);
            setSelectedBlurId(null);
          }}
        />
      ))}
    </div>
  );
}
