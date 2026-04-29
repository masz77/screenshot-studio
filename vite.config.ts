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
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,ico}"],
        globIgnores: ["**/server/**", "**/_vinext/**", "**/sw.js", "**/workbox-*.js"],
        maximumFileSizeToCacheInBytes: 20_000_000,
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
