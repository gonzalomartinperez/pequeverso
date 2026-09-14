import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the static export served by scripts/serve-static.mjs (same
 * trailing-slash and 404 semantics as production) unless E2E_BASE_URL points elsewhere.
 *
 * Project sets are selected with PW_SET:
 *   pr       chromium at 390 / 768 / 1440 + reduced-motion (pull-request gate, default)
 *   nightly  chromium + webkit at 1440 / 1280 / 1024 / 768 / 430 / 390 / 360
 *   visual   screenshot baselines at 390 / 1440 (chromium, reduced motion; WebKit text antialiasing drifts)
 *   prod     chromium-1440 smoke against a deployed origin (E2E_BASE_URL required)
 */
const set = (process.env.PW_SET ?? "pr") as "pr" | "nightly" | "visual" | "prod";
const port = Number(process.env.PORT || 3100);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const widths = [1440, 1280, 1024, 768, 430, 390, 360] as const;

function viewport(width: number) {
  return { width, height: width >= 1024 ? 900 : width >= 768 ? 1024 : 844 };
}

const desktopChrome = devices["Desktop Chrome"];
const desktopSafari = devices["Desktop Safari"];
const specs = {
  functional: /(smoke|a11y|offer-mode|widget|commerce|consent|motion|navigation|tracking|lcp)\.spec\.ts/,
  visual: /visual\.spec\.ts/,
  prod: /smoke\.spec\.ts/,
};

const projectSets = {
  pr: [
    {
      name: "chromium-1440",
      use: { ...desktopChrome, viewport: viewport(1440) },
      testMatch: specs.functional,
    },
    { name: "chromium-768", use: { ...desktopChrome, viewport: viewport(768) }, testMatch: specs.functional },
    {
      name: "chromium-390",
      use: { ...devices["Pixel 7"], viewport: viewport(390) },
      testMatch: specs.functional,
    },
    {
      name: "reduced-motion",
      use: { ...desktopChrome, viewport: viewport(1280), reducedMotion: "reduce" as const },
      testMatch: /(motion|a11y|smoke)\.spec\.ts/,
    },
  ],
  nightly: [
    ...widths.map((width) => ({
      name: `chromium-${width}`,
      use: { ...desktopChrome, viewport: viewport(width) },
      testMatch: specs.functional,
    })),
    ...widths.map((width) => ({
      name: `webkit-${width}`,
      use: { ...desktopSafari, viewport: viewport(width) },
      testMatch: specs.functional,
    })),
  ],
  visual: [390, 1440].map((width) => ({
    name: `visual-chromium-${width}`,
    use: { ...desktopChrome, viewport: viewport(width), reducedMotion: "reduce" as const },
    testMatch: specs.visual,
  })),
  prod: [
    {
      name: "prod-chromium-1440",
      use: { ...desktopChrome, viewport: viewport(1440) },
      testMatch: specs.prod,
    },
  ],
};

if (set === "prod" && !process.env.E2E_BASE_URL) {
  throw new Error("PW_SET=prod requires E2E_BASE_URL");
}

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 5_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
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
        command: "node scripts/serve-static.mjs",
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        env: { PORT: String(port) },
        timeout: 30_000,
      },
  projects: projectSets[set],
});
