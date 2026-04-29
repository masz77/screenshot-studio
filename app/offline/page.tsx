import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description: "You're offline. Reconnect to keep editing.",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-foreground">
          You're offline
        </h1>
        <p className="text-base text-muted-foreground">
          Looks like you've lost your connection. Reconnect, then try again.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          Try again
        </a>
      </div>
    </main>
  );
}
