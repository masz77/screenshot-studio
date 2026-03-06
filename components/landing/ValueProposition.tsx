"use client";

import { Component, type ReactNode } from "react";
import { Player } from "@remotion/player";
import {
  FeatureDragDropDemo,
  Feature3DFramesDemo,
  FeatureAnimateExportDemo,
} from "@/remotion";

// Silent error boundary for Remotion players
class PlayerErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full aspect-[3/2] rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground text-sm">
          Preview unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

interface ValuePropositionProps {
  eyebrow?: string;
  headline?: string;
}

const features = [
  {
    title: "Lightning Fast Editing",
    description:
      "Create stunning images in seconds, not hours. Our intuitive editor eliminates the learning curve.",
    bullets: [
      "Drag and drop any screenshot",
      "100+ gradient and texture backgrounds",
      "Customizable shadows, borders, and padding",
    ],
    Demo: FeatureDragDropDemo,
    durationInFrames: 360,
    width: 800,
    height: 500,
  },
  {
    title: "3D Transforms & Frames",
    description:
      "Add depth and dimension with 30+ perspective presets. Browser frames, Polaroid borders, and dramatic angles.",
    bullets: [
      "macOS, Windows, and Arc browser frames",
      "30+ 3D perspective presets",
      "Polaroid and custom border styles",
    ],
    Demo: Feature3DFramesDemo,
    durationInFrames: 360,
    width: 800,
    height: 500,
  },
  {
    title: "Animate & Export",
    description:
      "Create cinematic slideshows with 20+ animation presets. Export as high-res images or animated videos.",
    bullets: [
      "20+ animation presets (zoom, pan, Ken Burns)",
      "Export up to 5x resolution",
      "PNG with transparency or JPG",
    ],
    Demo: FeatureAnimateExportDemo,
    durationInFrames: 360,
    width: 800,
    height: 500,
  },
];

export function ValueProposition({
  eyebrow = "Why Screenshot Studio?",
}: ValuePropositionProps) {
  return (
    <section className="py-16 sm:py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-4">
            {eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            Everything you need to make images look great
          </h2>
        </div>

        {/* Alternating feature sections */}
        <div className="space-y-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "md:[direction:rtl]" : ""
              }`}
            >
              {/* Text side */}
              <div className={index % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <svg
                        className="w-4 h-4 text-primary mt-0.5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Demo side */}
              <div
                className={`relative ${
                  index % 2 === 1 ? "md:[direction:ltr]" : ""
                }`}
              >
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <PlayerErrorBoundary>
                    <Player
                      component={feature.Demo}
                      durationInFrames={feature.durationInFrames}
                      fps={60}
                      compositionWidth={feature.width}
                      compositionHeight={feature.height}
                      autoPlay
                      loop
                      controls={false}
                      acknowledgeRemotionLicense
                      style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: `${feature.width}/${feature.height}`,
                      }}
                    />
                  </PlayerErrorBoundary>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
