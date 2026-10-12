import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";
import base from "../../../../playwright.assistant.config.ts";

const checkout = resolve(import.meta.dirname, "../../../..");
const servers = Array.isArray(base.webServer) ? base.webServer : base.webServer ? [base.webServer] : [];

/** Sequential photography of several states, not a replacement for the 45 s browser gates. */
export default defineConfig({
  ...base,
  testDir: import.meta.dirname,
  testMatch: /capture.spec.ts/,
  outputDir: "test-results-assistant/gallery-traces",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  webServer: servers.map((server) => ({ ...server, cwd: checkout })),
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
