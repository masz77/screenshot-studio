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
      <div className="max-w-lg w-full text-center space-y-6">
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
            Open Editor
          </Link>
          <Link
            href="/landing"
            className="px-6 py-3 rounded-full border border-border text-foreground hover:bg-muted transition-colors"
          >
            Homepage
          </Link>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Popular pages you might be looking for:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/free-screenshot-editor"
              className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              Free Screenshot Editor
            </Link>
            <Link
              href="/features/screenshot-beautifier"
              className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              Screenshot Beautifier
            </Link>
            <Link
              href="/features/animation-maker"
              className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              Animation Maker
            </Link>
            <Link
              href="/features/3d-effects"
              className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              3D Effects
            </Link>
            <Link
              href="/features"
              className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              All Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
