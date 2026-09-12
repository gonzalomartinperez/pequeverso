import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the static export served by scripts/serve-static.mjs (same
 * trailing-slash and 404 semantics as production). PR projects cover three widths
 * plus reduced motion; nightly projects cover the full seven-width matrix in Chromium
 * and WebKit. Widths: 1440, 1280, 1024, 768, 430, 390, 360.
 */
const port = Number(process.env.PORT || 3100);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const widths = [1440, 1280, 1024, 768, 430, 390, 360] as const;

function viewport(width: number) {
  return { width, height: width >= 1024 ? 900 : width >= 768 ? 1024 : 844 };
}

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `node scripts/serve-static.mjs`,
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        env: { PORT: String(port) },
        timeout: 30_000,
      },
  projects: [
    { name: "chromium-1440", use: { ...devices["Desktop Chrome"], viewport: viewport(1440) } },
    { name: "chromium-768", use: { ...devices["Desktop Chrome"], viewport: viewport(768), isMobile: false } },
    { name: "chromium-390", use: { ...devices["Pixel 7"], viewport: viewport(390) } },
    {
      name: "reduced-motion",
      use: { ...devices["Desktop Chrome"], viewport: viewport(1280), reducedMotion: "reduce" },
      testMatch: /(motion|a11y|smoke)\.spec\.ts/,
    },
    ...widths.map((width) => ({
      name: `nightly-chromium-${width}`,
      use: { ...devices["Desktop Chrome"], viewport: viewport(width) },
    })),
    ...widths.map((width) => ({
      name: `nightly-webkit-${width}`,
      use: { ...devices["Desktop Safari"], viewport: viewport(width) },
    })),
    {
      name: "nightly-chromium",
      use: { ...devices["Desktop Chrome"], viewport: viewport(1440) },
      testMatch: /visual\.spec\.ts/,
    },
    {
      name: "nightly-webkit",
      use: { ...devices["Desktop Safari"], viewport: viewport(1440) },
      testMatch: /visual\.spec\.ts/,
    },
  ],
});
