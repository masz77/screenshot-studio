"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { trackCTAClick } from "@/lib/analytics";

interface HeroProps {
  title: string;
  subtitle?: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function Hero({
  title,
  subtitle,
  description,
  ctaLabel = "Start Creating",
  ctaHref = "/",
}: HeroProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const videoEmbedUrl = "https://www.youtube.com/embed/SKvVPLj5ZFo";
  const videoThumbnailUrl =
    "https://img.youtube.com/vi/SKvVPLj5ZFo/maxresdefault.jpg";

  return (
    <main className="pt-24 pb-16 px-6" role="banner">
      <div className="max-w-3xl mx-auto text-center">
        {/* Tagline */}
        <p className="text-sm text-muted-foreground mb-6">
          The free browser-based screenshot editor
        </p>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1]">
          {title}
          {subtitle && (
            <>
              <br />
              <span className="text-primary">{subtitle}</span>
            </>
          )}
        </h1>

        {/* Description */}
        <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed">
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            onClick={() => trackCTAClick("hero", ctaLabel)}
          >
            <Button
              size="lg"
              className="text-base px-8 py-5 font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            >
              {ctaLabel}
            </Button>
          </Link>
          <button
            onClick={() => {
              trackCTAClick("hero", "Watch demo");
              setIsVideoOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-accent"
            aria-label="Watch demo video"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
            </svg>
            Watch Demo
          </button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>Free forever</span>
          <span className="hidden sm:inline text-border">·</span>
          <span>No signup required</span>
          <span className="hidden sm:inline text-border">·</span>
          <span>Export in HD</span>
        </div>
      </div>

      {/* Video Dialog */}
      <HeroVideoDialog
        videoSrc={videoEmbedUrl}
        thumbnailSrc={videoThumbnailUrl}
        thumbnailAlt="Screenshot Studio editor demo"
        open={isVideoOpen}
        onOpenChange={setIsVideoOpen}
        showThumbnail={false}
        animationStyle="from-center"
      />
    </main>
  );
}
