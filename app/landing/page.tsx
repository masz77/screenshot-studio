import { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Screenshot Studio - Free Screenshot Editor Online",
  description:
    "Free screenshot editor and mockup tool — beautify screenshots with 100+ gradient backgrounds, browser frames, 3D effects, animations, and video export. Import tweets and generate code snippets as images. A better free alternative to Pika Style and Shots.so. No signup, no watermarks.",
  keywords: [
    "screenshot editor online free",
    "free screenshot editor",
    "online screenshot editor",
    "screenshot beautifier",
    "free image editor online",
    "beautify screenshots",
    "screenshot background editor",
    "screenshot to social media",
    "pika style alternative",
    "shots.so alternative",
    "screenshot mockup maker",
    "browser window mockup",
    "screenshot wrapper online",
    "image presentation tool free",
    "tweet to screenshot",
    "code snippet to image",
  ],
  openGraph: {
    title: "Screenshot Studio - Free Screenshot Editor Online",
    description:
      "Free screenshot editor online — beautify screenshots with 100+ backgrounds, 3D effects, animations, and video export. No signup required.",
    url: "/landing",
  },
  alternates: {
    canonical: "/landing",
  },
};

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
  {
    videoId: "29S4pv64Tbg",
    startTime: 222,
  },
];

export default function LandingPageRoute() {
  return (
    <LandingPage
      heroTitle="Beautiful images."
      heroSubtitle="Zero effort."
      heroDescription="The free browser editor that makes your screenshots, tweets, and code snippets look professional."
      ctaLabel="Open Editor"
      ctaHref="/"
      howItWorks={howItWorks}
      videoTestimonials={videoTestimonials}
      videoTestimonialsTitle="Creators Love Screenshot Studio"
      brandName="Screenshot Studio"
    />
  );
}
