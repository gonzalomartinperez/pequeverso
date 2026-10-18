import { test as base } from "@playwright/test";

/**
 * Shared `test` for every spec: CI builds carry a fake Meta Pixel id and the pixel runs by
 * default, so Meta hosts are aborted at the context level. A spec that needs a stub answers
 * with `page.route`, which takes precedence over the context route.
 */
export const test = base.extend<{ blockMetaHosts: boolean }>({
  blockMetaHosts: [
    async ({ context }, use) => {
      await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) => route.abort());
      await use(true);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
