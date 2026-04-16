import { defineConfig } from "vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [vinext()],
  // Canvas external for react-konva/Three.js (replaces webpack externals)
  resolve: {
    alias: {
      canvas: "canvas",
    },
  },
  ssr: {
    noExternal: [],
    external: ["canvas", "sharp"],
  },
});
