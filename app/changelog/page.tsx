import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Changelog - Screenshot Studio | Latest Updates & New Features",
  description:
    "See what's new in Screenshot Studio. Latest updates including animation timeline, video export, 3D effects, and more.",
  keywords: [
    "screenshot studio changelog",
    "screenshot studio updates",
    "screenshot editor new features",
    "image editor release notes",
    "animation maker updates",
  ],
  openGraph: {
    title: "Changelog - Screenshot Studio",
    description:
      "See what's new in Screenshot Studio. Latest updates including animation timeline, video export, and more.",
    url: "/changelog",
  },
  alternates: {
    canonical: "/changelog",
  },
};

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  description: string;
  changes: {
    type: "added" | "improved" | "fixed";
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    date: "February 23, 2026",
    version: "2.1.0",
    title: "Overlay Resize, Custom Presets & Arc Controls",
    description:
      "Resize overlays directly on the canvas, save your own presets, and fine-tune Arc frame borders with new width and opacity sliders.",
    changes: [
      {
        type: "added",
        text: "On-canvas resize handles for arrow and sticker overlays — drag any corner to resize (20–800px)",
      },
      {
        type: "added",
        text: "Custom presets — save your current canvas configuration and reuse it later, persisted in local storage",
      },
      {
        type: "added",
        text: "Arc frame width slider (1–20px) and opacity slider (0–100%) in Frames section and Border Controls",
      },
      {
        type: "improved",
        text: "Arc frame borders now use dynamic width and opacity instead of hardcoded values across all render paths",
      },
      {
        type: "fixed",
        text: "Arc frame opacity and width changes now reflect immediately on the canvas",
      },
    ],
  },
  {
    date: "February 20, 2026",
    version: "2.0.0",
    title: "Animation & Video Export",
    description:
      "Bring your screenshots to life with keyframe animations and export as MP4, WebM, or GIF.",
    changes: [
      {
        type: "added",
        text: "Timeline editor with interactive playhead, ruler, and animation tracks",
      },
      {
        type: "added",
        text: "20+ animation presets across 5 categories: Reveal, Flip, Perspective, Orbit, and Depth",
      },
      {
        type: "added",
        text: "Keyframe animation system with 8 easing functions (linear, ease-in, ease-out, cubic, expo)",
      },
      {
        type: "added",
        text: "Real-time animation preview with play, pause, loop, and scrub controls",
      },
      {
        type: "added",
        text: "Video export in MP4, WebM, and GIF formats with quality presets (High/Medium/Low)",
      },
      {
        type: "added",
        text: "Hardware-accelerated encoding via WebCodecs API with FFmpeg WASM fallback",
      },
      {
        type: "added",
        text: "Multi-threaded FFmpeg encoding using SharedArrayBuffer for faster exports",
      },
      {
        type: "added",
        text: "Export progress dialog with real-time frame count and status tracking",
      },
      {
        type: "added",
        text: "Animation preset gallery with category browsing in the right panel",
      },
      {
        type: "added",
        text: "Multi-clip support with overlap handling on the timeline",
      },
      {
        type: "improved",
        text: "Editor right panel now includes dedicated Animate tab",
      },
      {
        type: "improved",
        text: "Analytics tracking added to editor, timeline controls, CTA, and hero sections",
      },
    ],
  },
  {
    date: "February 14, 2026",
    version: "1.0.0",
    title: "Complete Revamp",
    description:
      "A ground-up rebuild of Screenshot Studio with a modern stack, new UI, and powerful new features.",
    changes: [
      {
        type: "added",
        text: "New editor layout with unified right panel (Settings, Edit, BG, 3D, Animate, Presets tabs)",
      },
      {
        type: "added",
        text: "3D perspective transforms with real-time preview",
      },
      {
        type: "added",
        text: "50+ gradient and solid color backgrounds with blur and noise effects",
      },
      {
        type: "added",
        text: "Device frames: macOS, Windows, Arc-style, and Polaroid borders",
      },
      {
        type: "added",
        text: "Text overlays with 25+ fonts, custom colors, shadows, and positioning",
      },
      {
        type: "added",
        text: "Image overlays with rotation, flip, opacity, and drag positioning",
      },
      {
        type: "added",
        text: "Website screenshot capture via Screen-Shot.xyz (desktop and mobile viewports)",
      },
      {
        type: "added",
        text: "High-res export up to 5x scale in PNG and JPG formats",
      },
      {
        type: "added",
        text: "Undo/redo with unlimited history via Zundo",
      },
      {
        type: "added",
        text: "Design presets for one-click styling",
      },
      {
        type: "added",
        text: "Aspect ratio presets for Instagram, YouTube, Twitter, LinkedIn, and Open Graph",
      },
      {
        type: "added",
        text: "Error boundaries and lazy loading for gradient components",
      },
      {
        type: "improved",
        text: "Migrated to Next.js 16 with React 19 and React Compiler",
      },
      {
        type: "improved",
        text: "Upgraded to Tailwind CSS 4 with new theming system",
      },
      {
        type: "improved",
        text: "State management rebuilt with Zustand + temporal middleware",
      },
      {
        type: "improved",
        text: "Landing page redesigned with new hero, features, testimonials, and FAQ sections",
      },
      {
        type: "improved",
        text: "SEO-optimized feature pages for screenshot beautifier, social media graphics, animations, and 3D effects",
      },
    ],
  },
];

const typeConfig = {
  added: {
    label: "Added",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  improved: {
    label: "Improved",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  fixed: {
    label: "Fixed",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation ctaLabel="Open Editor" ctaHref="/home" />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Changelog</h1>
            <p className="text-lg text-muted-foreground">
              New features, improvements, and fixes for Screenshot Studio.
            </p>
          </div>
        </section>

        {/* Changelog entries */}
        <section className="pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border hidden md:block" />

              <div className="space-y-16">
                {changelog.map((entry) => (
                  <article key={entry.version} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-2 w-[15px] h-[15px] rounded-full bg-primary border-2 border-background hidden md:block" />

                    <div className="md:pl-10">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-sm font-mono text-muted-foreground">
                          {entry.date}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-border bg-muted/50">
                          v{entry.version}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold mb-2">{entry.title}</h2>
                      <p className="text-muted-foreground mb-6">
                        {entry.description}
                      </p>

                      {/* Changes */}
                      <ul className="space-y-3">
                        {entry.changes.map((change, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span
                              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 ${typeConfig[change.type].className}`}
                            >
                              {typeConfig[change.type].label}
                            </span>
                            <span className="text-sm text-foreground/80">
                              {change.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Try It Out</h2>
            <p className="text-muted-foreground mb-6">
              All features are free. No signup required.
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Open Editor
            </Link>
          </div>
        </section>
      </main>

      <Footer brandName="Screenshot Studio" />
    </div>
  );
}
