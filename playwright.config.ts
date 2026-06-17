import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression config for MITAN landing page.
 *
 * Run locally:
 *   bun run test:visual              # run all snapshot tests
 *   bun run test:visual:update       # refresh baseline PNGs (review the diff before committing)
 *
 * Baselines live in tests/visual/__screenshots__/ and are committed.
 * The dev server is auto-started by Playwright on http://localhost:5173.
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    // Force a fixed scale & color scheme so screenshots are deterministic.
    deviceScaleFactor: 1,
    colorScheme: "light",
  },
  // Pixel diff tolerance — fonts and antialiasing drift slightly across machines.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
