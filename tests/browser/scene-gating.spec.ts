import { expect, type Page, test } from "@playwright/test";

import { nudgePage } from "./fixtures";

/**
 * ADR-0017 (D-03): the WebGL scene chunks are requested only on a fine pointer at least 1024 px
 * wide after the first interaction. The scene closure is recognised by its content (three's
 * `WebGLRenderer`), not by a hashed chunk name. An unreadable chunk body counts as a suspect so a
 * failed read can never make the assertions pass vacuously.
 */
const PAGES = ["/", "/grafismo-fonetico/"] as const;
const SCENE_MEDIA = "(pointer: fine) and (min-width: 1024px)";

function trackSceneChunks(page: Page) {
  const scene: string[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", (response) => {
    const url = response.url();
    if (!/\/_next\/static\/chunks\/.*\.js/.test(url)) return;
    pending.push(
      response.text().then(
        (body) => {
          if (body.includes("WebGLRenderer")) scene.push(url);
        },
        () => {
          scene.push(`${url} (unreadable body)`);
        },
      ),
    );
  });
  return async () => {
    await Promise.all(pending);
    return [...scene];
  };
}

for (const path of PAGES) {
  test(`${path}: no scene chunk before interaction, nor without a fine pointer at 1024 px`, async ({
    page,
  }) => {
    const scene = trackSceneChunks(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2_500);
    const stage = page.locator('#hero [data-slot="scene-stage"]');
    expect(await scene(), "no scene chunk before any interaction").toEqual([]);
    await expect(stage.locator("canvas")).toHaveCount(0);

    // Only the product hero hosts the scene; the home page has static bands only.
    const eligible =
      path !== "/" &&
      (await page.evaluate(
        (query) =>
          matchMedia(query).matches && !matchMedia("(prefers-reduced-motion: reduce)").matches,
        SCENE_MEDIA,
      ));
    await nudgePage(page);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(3_500);
    if (eligible) {
      await expect.poll(async () => (await scene()).length, { timeout: 10_000 }).toBeGreaterThan(0);
    } else {
      expect(await scene(), "never requested here").toEqual([]);
      await expect(stage.locator("canvas")).toHaveCount(0);
    }
  });
}
