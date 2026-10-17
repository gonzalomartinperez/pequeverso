import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Screenshot baselines (PW_SET=visual: chromium at 390 / 1440, reduced motion). Baselines are
 * generated on Linux by the nightly workflow (`update_snapshots`) and committed under
 * tests/e2e/__screenshots__. Reduced motion freezes every CSS animation, so only video is masked.
 */
const MASKED = "video";

/** Materialize deferred Home sections and lazy media before comparing complete rendered content. */
async function prepareHomeCapture(page: Page) {
  // A full-page screenshot must paint bands that the browser normally defers off-screen.
  // This affects capture preparation only; production keeps its rendering optimization.
  await page.addStyleTag({ content: ".defer-render { content-visibility: visible !important; }" });
  await page.evaluate(async () => {
    const renderedFrame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    // Each band is visited as a visitor scrolls it; the current document height bounds the walk.
    for (let top = 0; top < document.documentElement.scrollHeight; top += window.innerHeight) {
      window.scrollTo({ top, behavior: "instant" });
      await renderedFrame();
    }
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((image) => {
          const box = image.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            getComputedStyle(image).visibility === "visible" &&
            !image.closest("[inert]")
          );
        })
        .map((image) => image.decode()),
    );
    window.scrollTo({ top: 0, behavior: "instant" });
    await renderedFrame();
  });
}

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
    if (name === "home") await prepareHomeCapture(page);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [page.locator(MASKED)],
      // The redesigned landing is ~15 000 px tall at 1440: a full-page capture needs more than 5 s.
      timeout: 20_000,
    });
  });
}

test("footer matches its baseline", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await prepareHomeCapture(page);
  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => {
      const before = await footer.boundingBox();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      return JSON.stringify(before) === JSON.stringify(await footer.boundingBox());
    })
    .toBe(true);
  // The floating header and the mobile buy bar are fixed/sticky: wherever the capture scrolls,
  // they overlap the footer. Hide them for this element capture (a mask would move with them).
  await page.addStyleTag({
    content: '[data-slot="header"], [data-slot="sticky-cta"] { visibility: hidden !important; }',
  });
  await expect(footer).toHaveScreenshot("footer.png");
});
