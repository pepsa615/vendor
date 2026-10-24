import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    maxWorkers: 1,
    pool: "vmThreads",
    coverage: {
      reporter: ["text", "json-summary"],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
