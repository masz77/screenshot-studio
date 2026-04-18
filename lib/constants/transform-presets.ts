// lib/constants/transform-presets.ts

export interface TransformPreset {
  name: string;
  values: {
    perspective: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    translateX: number;
    translateY: number;
    scale: number;
  };
}

// Perspective in px (2400px ≈ 150em at 16px base)
export const TRANSFORM_PRESETS: TransformPreset[] = [
  { name: 'Default',         values: { perspective: 2400, rotateX: 0,  rotateY: 0,   rotateZ: 0,  translateX: 0,  translateY: 0,  scale: 1    } },
  { name: 'Tilted',          values: { perspective: 2400, rotateX: 0,  rotateY: 0,   rotateZ: -8, translateX: 0,  translateY: 0,  scale: 0.95 } },
  { name: 'Dramatic Left',   values: { perspective: 2400, rotateX: 10, rotateY: -20, rotateZ: 8,  translateX: -4, translateY: -2, scale: 0.95 } },
  { name: 'Dramatic Right',  values: { perspective: 2400, rotateX: 10, rotateY: 20,  rotateZ: -8, translateX: 4,  translateY: -2, scale: 0.95 } },
  { name: 'Top Down',        values: { perspective: 2400, rotateX: 40, rotateY: 0,   rotateZ: 0,  translateX: 0,  translateY: -5, scale: 0.95 } },
];
