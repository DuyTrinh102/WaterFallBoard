import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1920, height: 1080 },
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
    hasTouch: true,
  },
  webServer: { command: "npm run build && npm run serve", url: "http://127.0.0.1:4173", reuseExistingServer: true, timeout: 120_000 },
});
