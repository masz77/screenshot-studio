import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "app",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2,ico}", "icons/*.png", "logo.svg"],
        globIgnores: [
          "**/server/**",
          "**/_vinext/**",
          "**/sw.js",
          "**/workbox-*.js",
          // Large asset folders — runtime-cached via SW routes instead
          "mac/**",
          "mesh/**",
          "paper/**",
          "pattern/**",
          "radiant/**",
          "raycast/**",
          "overlay/**",
          "overlay-shadow/**",
          "demo/**",
          "fonts/**",
          "assets/**",
        ],
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  // Canvas external for react-konva/Three.js (replaces webpack externals)
  resolve: {
    alias: {
      canvas: "canvas",
    },
  },
  ssr: {
    noExternal: [],
    external: ["canvas"],
  },
});
