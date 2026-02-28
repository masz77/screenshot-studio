import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found - Screenshot Studio",
  description: "The page you're looking for doesn't exist. Head back to Screenshot Studio to create stunning visuals.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-7xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <Link
            href="/home"
            className="px-6 py-3 rounded-full border border-border text-foreground hover:bg-muted transition-colors"
          >
            Open Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
