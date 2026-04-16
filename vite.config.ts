import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
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
