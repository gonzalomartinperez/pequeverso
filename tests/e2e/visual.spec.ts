import { expect, test } from "@playwright/test";

/**
 * Screenshot baselines (PW_SET=visual: chromium at 390 / 1440, reduced motion). Baselines are
 * generated on Linux by the nightly workflow (`update_snapshots`) and committed under
 * tests/e2e/__screenshots__. Reduced motion freezes every CSS animation, so only video is masked.
 */
const MASKED = "video";

const pages = [
  { name: "home", path: "/" },
  { name: "landing", path: "/grafismo-fonetico/" },
  { name: "upsell", path: "/imprime-y-juega/" },
  { name: "downsell", path: "/imprime-y-juega/?downsell=1" },
  { name: "thanks", path: "/grafismo-fonetico/gracias/" },
];

for (const { name, path } of pages) {
  test(`${name} matches its baseline`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [page.locator(MASKED)],
    });
  });
}

test("footer matches its baseline", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("contentinfo")).toHaveScreenshot("footer.png");
});
