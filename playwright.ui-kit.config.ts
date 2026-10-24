import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 60_000,
  expect: { timeout: 20_000 },
  testDir: "./e2e",
  testMatch: "ui-kit.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:5174",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
