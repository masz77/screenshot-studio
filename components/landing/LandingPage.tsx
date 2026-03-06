import Image from "next/image";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "./Footer";
import { FAQ } from "./FAQ";
import { VideoTestimonials } from "./VideoTestimonials";
import { FinalCTA } from "./FinalCTA";
import { StructuredData } from "./StructuredData";
import { ValueProposition } from "./ValueProposition";
import { BackedBy } from "./BackedBy";
import { MasonryGrid } from "./MasonryGrid";

interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

interface VideoTestimonial {
  videoId: string;
  startTime?: number;
  endTime?: number;
  title?: string;
  author?: string;
}

interface LandingPageProps {
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription: string;
  ctaLabel?: string;
  ctaHref?: string;
  features?: { title: string; description: string; icon?: string }[];
  featuresTitle?: string;
  howItWorks?: HowItWorksStep[];
  brandName?: string;
  videoTestimonials?: VideoTestimonial[];
  videoTestimonialsTitle?: string;
  valueProposition?: {
    eyebrow?: string;
    headline?: string;
  };
  marqueeText?: string;
}

export function LandingPage({
  heroTitle,
  heroSubtitle,
  heroDescription,
  ctaLabel = "Start Creating",
  ctaHref = "/",
  howItWorks,
  brandName = "Screenshot Studio",
  videoTestimonials,
  videoTestimonialsTitle,
  valueProposition,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StructuredData />

      <Navigation ctaLabel="Open Editor" ctaHref={ctaHref} />

      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDescription}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
      />

      {/* Hero Screenshot */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Image
            src="/og.png"
            alt="Screenshot Studio editor preview"
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl border border-border/50"
            priority
          />
        </div>
      </section>

      <BackedBy />

      <ValueProposition
        eyebrow={valueProposition?.eyebrow}
        headline={valueProposition?.headline}
      />

      <MasonryGrid />

      {howItWorks && howItWorks.length > 0 && (
        <HowItWorks steps={howItWorks} title="How It Works" />
      )}

      {videoTestimonials && videoTestimonials.length > 0 && (
        <VideoTestimonials
          testimonials={videoTestimonials}
          title={videoTestimonialsTitle}
        />
      )}

      <FAQ />

      <FinalCTA
        title="Ready to create?"
        description="Join thousands of creators making beautiful images."
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
      />

      <Footer brandName={brandName} />
    </div>
  );
}
