import { expect, test } from "@playwright/test";

/**
 * ADR-0017 (D-03): the WebGL scene chunks are requested only on a fine pointer at least 1024 px
 * wide after the first interaction. The scene closure is recognised by its content (three's
 * `WebGLRenderer`), not by a hashed chunk name.
 */
const PAGES = ["/", "/grafismo-fonetico/"] as const;

function trackSceneChunks(page: import("@playwright/test").Page): () => string[] {
  const scene: string[] = [];
  page.on("response", async (response) => {
    const url = response.url();
    if (!/\/_next\/static\/chunks\/.*\.js/.test(url)) return;
    const body = await response.text().catch(() => "");
    if (body.includes("WebGLRenderer")) scene.push(url);
  });
  return () => scene;
}

for (const path of PAGES) {
  test(`${path}: no scene chunk without a fine pointer at 1024 px, and none before interaction`, async ({
    page,
    isMobile,
    viewport,
  }) => {
    const scene = trackSceneChunks(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2_500);
    const stage = page.locator('#hero [data-slot="scene-stage"]');
    expect(scene(), "no scene chunk before any interaction").toEqual([]);
    await expect(stage.locator("canvas")).toHaveCount(0);

    // Only the product hero hosts the scene; the home page has static bands only.
    const eligible = path !== "/" && !isMobile && (viewport?.width ?? 0) >= 1024;
    await page.mouse.wheel(0, 120);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(3_500);
    if (!eligible) {
      expect(scene(), "phones and narrow windows never request the scene").toEqual([]);
      await expect(stage.locator("canvas")).toHaveCount(0);
    } else {
      await expect.poll(() => scene().length, { timeout: 10_000 }).toBeGreaterThan(0);
    }
  });
}
