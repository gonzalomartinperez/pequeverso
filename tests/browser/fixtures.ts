import { test as base, type Page } from "@playwright/test";

/**
 * Shared `test` for every spec: CI builds carry a fake Meta Pixel id (the pixel loads only after
 * "Aceptar", ADR-0011), so Meta hosts are aborted at the context level. A spec that needs a stub answers
 * with `page.route`, which takes precedence over the context route.
 */
export const test = base.extend<{ blockMetaHosts: boolean }>({
  blockMetaHosts: [
    async ({ context }, use) => {
      await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) =>
        route.abort(),
      );
      await use(true);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";

/**
 * A first user interaction the scene gate counts (`wheel` or `scroll`, scene-gate.ts). Mobile WebKit
 * does not implement `mouse.wheel`, so touch projects scroll the page instead.
 */
export async function nudgePage(page: Page, deltaY = 120) {
  const touch = test.info().project.use.isMobile === true;
  if (touch) await page.evaluate((dy) => window.scrollBy(0, dy), deltaY);
  else await page.mouse.wheel(0, deltaY);
}
