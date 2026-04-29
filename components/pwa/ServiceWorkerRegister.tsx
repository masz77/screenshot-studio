"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const { Workbox } = await import("workbox-window");
        if (cancelled) return;

        const wb = new Workbox("/sw.js", { scope: "/" });

        // Silent auto-update: when a new SW is waiting, take over immediately
        wb.addEventListener("waiting", () => {
          wb.messageSkipWaiting();
        });

        await wb.register();
      } catch {
        // Swallow — SW failure should never break the app
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
