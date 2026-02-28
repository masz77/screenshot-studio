'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { SectionWrapper } from './SectionWrapper';
import { TiltJoystick } from '@/components/ui/tilt-joystick';

export function EditSection() {
  const {
    borderRadius,
    imageScale,
    perspective3D,
    setBorderRadius,
    setImageScale,
    setPerspective3D,
  } = useImageStore();

  const isTiltEnabled = perspective3D.rotateX !== 0 || perspective3D.rotateY !== 0;

  const toggleTilt = () => {
    if (isTiltEnabled) {
      setPerspective3D({ rotateX: 0, rotateY: 0, perspective: 1000 });
    } else {
      setPerspective3D({ rotateX: 8, rotateY: -12, perspective: 1000 });
    }
  };

  const handleTiltChange = (value: { x: number; y: number }) => {
    setPerspective3D({
      rotateX: value.y,
      rotateY: value.x,
      perspective: perspective3D.perspective || 1000,
    });
  };

  return (
    <SectionWrapper title="Edit" defaultOpen={true}>
      <div className="flex gap-4">
        {/* Sliders Container */}
        <div className="flex-1 space-y-3">
          {/* Round Control */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12 shrink-0">Round</span>
            <div className="flex-1">
              <Slider
                value={[borderRadius]}
                onValueChange={(value) => setBorderRadius(value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">{borderRadius}</span>
          </div>

          {/* Scale Control */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12 shrink-0">Scale</span>
            <div className="flex-1">
              <Slider
                value={[imageScale / 100]}
                onValueChange={(value) => setImageScale(Math.round(value[0] * 100))}
                min={0.1}
                max={2}
                step={0.01}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">{(imageScale / 100).toFixed(1)}</span>
          </div>
        </div>

        {/* Tilt Container - Separate div beside sliders */}
        <div className="shrink-0 flex items-center justify-center">
          <TiltJoystick
            value={{ x: perspective3D.rotateY, y: perspective3D.rotateX }}
            onChange={handleTiltChange}
            onToggle={toggleTilt}
            maxTilt={30}
            size={52}
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
