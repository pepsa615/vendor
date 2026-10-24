import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    visualizer({
      filename: "dist/bundle-report.html",
      gzipSize: true,
      template: "treemap",
    }),
  ],
  build: { chunkSizeWarningLimit: 500, sourcemap: true },
  server: { port: 5173 },
});
