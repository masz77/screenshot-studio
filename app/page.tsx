import { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Screenshot Studio - Free Screenshot Editor Online | Create Stunning Graphics",
  description:
    "Free screenshot editor online — beautify screenshots with 100+ backgrounds, 3D effects, animations, and video export. No signup, no watermarks. Open and start editing instantly.",
  keywords: [
    "screenshot editor online free",
    "free screenshot editor",
    "online screenshot editor",
    "screenshot beautifier",
    "free image editor online",
    "beautify screenshots",
    "screenshot background editor",
    "screenshot to social media",
  ],
  openGraph: {
    title: "Screenshot Studio - Free Screenshot Editor Online",
    description:
      "Free screenshot editor online — beautify screenshots with 100+ backgrounds, 3D effects, animations, and video export. No signup required.",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
};

// Features - benefit-focused, concise
const features = [
  {
    title: "Drop. Style. Done.",
    description:
      "Upload any image, add backgrounds and shadows, adjust until perfect. No learning curve.",
    icon: "upload",
  },
  {
    title: "50+ Backgrounds Built In",
    description:
      "Gradients, textures, and patterns ready to use. Or upload your own.",
    icon: "layers",
  },
  {
    title: "Export Up to 5x Resolution",
    description:
      "PNG with transparency or JPG. High-res output for any platform.",
    icon: "export",
  },
];

// How It Works - 3 steps
const howItWorks = [
  {
    step: 1,
    title: "Drop Your Image",
    description: "Drag any screenshot or photo",
  },
  {
    step: 2,
    title: "Style It",
    description: "Add backgrounds, shadows, text",
  },
  {
    step: 3,
    title: "Export",
    description: "Download in seconds",
  },
];

// Video testimonials
const videoTestimonials = [
  {
    videoId: "NAS4BEP2KtA",
    startTime: 3562,
    endTime: 3768,
  },
];

export default function Home() {
  return (
    <LandingPage
      // Clean, memorable headline
      heroTitle="Beautiful images."
      heroSubtitle="Zero effort."
      // One line that says it all
      heroDescription="The free browser editor that makes your screenshots look professional."
      // Clear CTA
      ctaLabel="Start Creating"
      ctaHref="/home"
      features={features}
      featuresTitle="Simple by Design"
      howItWorks={howItWorks}
      videoTestimonials={videoTestimonials}
      videoTestimonialsTitle="Creators Love Screenshot Studio"
      brandName="Screenshot Studio"
    />
  );
}
