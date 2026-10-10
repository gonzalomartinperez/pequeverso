import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests of the native assistant ENABLED against a real pequeverso-assistant-api in
 * fixture mode (no model calls; targeted tests hold/forward requests or interrupt transport). Both
 * sides run over HTTPS loopback with a throwaway self-signed certificate (accepted only here), so
 * the API issues its production-shaped Secure, HttpOnly `__Host-` cookie and the browser exercises
 * credentialed CORS, CSRF and SSE across two origins exactly as in production. The storefront is
 * the unpublishable verification export in out-assistant-fixture/ (scripts/build-assistant-fixture.ts).
 * ASSISTANT_API_DIR must be a checkout of the API at tests/assistant/api-revision (`uv sync --frozen`).
 */
const apiDir = process.env.ASSISTANT_API_DIR ?? "";
const missingApi = `node -e "console.error('ASSISTANT_API_DIR is required: a checkout of tests/assistant/api-revision with uv sync --frozen'); process.exit(1)"`;

const storePort = 3217;
const apiPort = 8217;
const store = `https://127.0.0.1:${storePort}`;
const tls = join(tmpdir(), "pv-assistant-tls");
const database = join(tmpdir(), `pv-assistant-e2e-${process.pid}.sqlite3`);

const desktop = { width: 1440, height: 900 };

export default defineConfig({
  testDir: "tests/assistant",
  outputDir: "test-results-assistant",
  // Each test opens its own session; the API allows 4 concurrent runs, so 3 workers never hit `busy`.
  // Tests within a project stay in order per worker; projects run side by side.
  fullyParallel: true,
  workers: 3,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report-assistant", open: "never" }]],
  use: {
    baseURL: store,
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"], viewport: desktop } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "chromium-reduced-motion",
      use: { ...devices["Desktop Chrome"], viewport: desktop, reducedMotion: "reduce" },
    },
    // Gecko and WebKit render the landing's WebGL scene in software on CI runners: one worker each.
    { name: "firefox-desktop", workers: 1, use: { ...devices["Desktop Firefox"], viewport: desktop } },
    { name: "webkit-desktop", workers: 1, use: { ...devices["Desktop Safari"], viewport: desktop } },
    { name: "webkit-mobile", workers: 1, use: { ...devices["iPhone 13"] } },
  ],
  webServer: [
    {
      command: apiDir
        ? `uv run --directory "${apiDir}" uvicorn app.main:app --host 127.0.0.1 --port ${apiPort} --ssl-keyfile "${tls}/key.pem" --ssl-certfile "${tls}/cert.pem"`
        : missingApi,
      url: `https://127.0.0.1:${apiPort}/health/ready`,
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ENVIRONMENT: "development",
        ASSISTANT_ENABLED: "true",
        AI_PROVIDER: "fixture",
        ALLOW_PAID_AI: "false",
        OPENAI_API_KEY: "",
        SESSION_COOKIE_SECURE: "true",
        ALLOWED_ORIGINS: JSON.stringify([store]),
        DATABASE_PATH: database,
        FIXTURE_CHUNK_DELAY_MS: "150",
        SESSIONS_PER_CLIENT_PER_HOUR: "100000",
        MESSAGES_PER_CLIENT_PER_HOUR: "100000",
        MESSAGES_PER_SESSION_PER_DAY: "1000",
      },
    },
    {
      command: "node scripts/serve-static.ts",
      url: `${store}/`,
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      env: {
        SERVE_DIR: "out-assistant-fixture",
        PORT: String(storePort),
        SERVE_TLS_CERT: `${tls}/cert.pem`,
        SERVE_TLS_KEY: `${tls}/key.pem`,
      },
    },
  ],
});
