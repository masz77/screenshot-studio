'use client';

import * as React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { TextOverlayControls } from '@/components/text-overlay/text-overlay-controls';

export function TextSection() {
  return (
    <SectionWrapper title="Add Text" sectionId="text" defaultOpen={true}>
      <TextOverlayControls />
    </SectionWrapper>
  );
}
