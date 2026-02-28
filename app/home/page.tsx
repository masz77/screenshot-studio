import type { Metadata } from "next";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Free Screenshot Editor Online - Screenshot Studio",
  description:
    "Free screenshot editor online — add backgrounds, shadows, 3D effects, and animations to your screenshots. Export as PNG, JPG, or video. No signup needed.",
  keywords: [
    "screenshot editor online free",
    "free screenshot editor",
    "online image editor",
    "screenshot beautifier online",
  ],
  alternates: {
    canonical: "/home",
  },
  openGraph: {
    title: "Free Screenshot Editor Online - Screenshot Studio",
    description:
      "Free screenshot editor online — add backgrounds, shadows, 3D effects, and animations. Export as PNG, JPG, or video.",
    url: "/home",
  },
};

/**
 * Editor Page - Public Access
 *
 * This page is now publicly accessible without authentication.
 */
export default async function EditorPage() {
  return (
    <ErrorBoundary>
      <EditorLayout />
    </ErrorBoundary>
  );
}
