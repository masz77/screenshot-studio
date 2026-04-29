/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope;

// Precache build artifacts (app shell + small static assets)
precacheAndRoute(self.__WB_MANIFEST);

// 1) NetworkOnly passthrough for API + analytics + framework internals
registerRoute(
  ({ url }) =>
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/svc/") ||
    url.pathname.startsWith("/_vinext/"),
  new NetworkOnly()
);

// 2) Same-origin static asset folders — CacheFirst, lazy-cached on first use
const STATIC_ASSET_PREFIXES = [
  "/assets/",
  "/fonts/",
  "/mac/",
  "/mesh/",
  "/paper/",
  "/pattern/",
  "/radiant/",
  "/raycast/",
  "/overlay/",
  "/overlay-shadow/",
  "/demo/",
];
registerRoute(
  ({ url, sameOrigin }) =>
    sameOrigin && STATIC_ASSET_PREFIXES.some((p) => url.pathname.startsWith(p)),
  new CacheFirst({
    cacheName: "static-assets-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
  "GET"
);

// 3) FFmpeg WASM from unpkg — cache aggressively (large, rarely changes)
registerRoute(
  ({ url }) =>
    url.origin === "https://unpkg.com" && url.pathname.startsWith("/@ffmpeg/"),
  new CacheFirst({
    cacheName: "ffmpeg-wasm-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  }),
  "GET"
);

// 4) Google Fonts CSS + font files
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 365,
        purgeOnQuotaError: true,
      }),
    ],
  }),
  "GET"
);

// 5) HTML navigations — NetworkFirst with offline fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "html-pages-v1",
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// Fallback for navigations that fail entirely (offline + no cached HTML)
setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    const cache = await caches.open("html-pages-v1");
    const offlinePage = await cache.match("/offline");
    if (offlinePage) return offlinePage;
  }
  return Response.error();
});

// Lifecycle: take over immediately on install/activate
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      try {
        const cache = await caches.open("html-pages-v1");
        const offlineResponse = await fetch("/offline", { cache: "reload" });
        if (offlineResponse.ok) {
          await cache.put("/offline", offlineResponse);
        }
      } catch {
        // Cache warming is best-effort; SW activation must not fail
      }
    })()
  );
});
