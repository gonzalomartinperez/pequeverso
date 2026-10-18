import type { Page } from "@playwright/test";
import { CONSENT_KEY, CONSENT_VERSION } from "../../src/features/tracking/adapters/consent";
import { expect, test } from "./fixtures";

/**
 * Screenshot baselines (PW_SET=visual: chromium at 390 / 1440, reduced motion). Baselines are
 * generated on Linux by the nightly workflow (`update_snapshots`) and committed under
 * tests/browser/__screenshots__. Reduced motion freezes every CSS animation, so only video is masked.
 */
const MASKED = "video";

// Visual references describe the page after an explicit rejection. Consent behavior has its
// own suite; optional integration configuration must not open a dialog over these components.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, version }) =>
      window.localStorage.setItem(
        key,
        JSON.stringify({ version, analytics: false, marketing: false, updatedAt: new Date().toISOString() }),
      ),
    { key: CONSENT_KEY, version: CONSENT_VERSION },
  );
});

/** Materialize deferred Home sections and lazy media before comparing complete rendered content. */
async function prepareHomeCapture(page: Page) {
  // A full-page screenshot must paint bands that the browser normally defers off-screen.
  // This affects capture preparation only; production keeps its rendering optimization.
  await page.addStyleTag({ content: ".defer-render { content-visibility: visible !important; }" });
  await page.evaluate(async () => {
    const renderedFrame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    // Trace-only progress uses geometry and image state, never URLs or page content.
    const progress = (phase: string, images: HTMLImageElement[] = []) =>
      console.debug("pv-visual-capture", {
        phase,
        top: window.scrollY,
        height: document.documentElement.scrollHeight,
        viewport: window.innerHeight,
        visibility: document.visibilityState,
        images: images.map((image, index) => ({
          index,
          loading: image.loading,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
        })),
      });
    // Each band is visited as a visitor scrolls it; the current document height bounds the walk.
    for (let top = 0; top < document.documentElement.scrollHeight; top += window.innerHeight) {
      progress("walk");
      window.scrollTo({ top, behavior: "instant" });
      await renderedFrame();
    }
    progress("fonts");
    await document.fonts.ready;
    const images = [...document.images].filter((image) => {
      const box = image.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        getComputedStyle(image).visibility === "visible" &&
        !image.closest("[inert]")
      );
    });
    progress("images-before-materialization", images);
    // A lazy image above the final scroll position can still be awaiting intersection.
    // Full-page capture already materializes deferred bands; request those same rendered images
    // eagerly here so decode cannot wait for another visit. Production loading stays unchanged.
    for (const image of images) image.loading = "eager";
    await Promise.all(
      images.map(async (image, index) => {
        try {
          await image.decode();
        } catch {
          throw new Error(`Full-page capture image ${index} failed to decode`);
        }
      }),
    );
    progress("images-decoded", images);
    window.scrollTo({ top: 0, behavior: "instant" });
    progress("final-frame");
    await renderedFrame();
    progress("complete");
  });
  // IntersectionObserver delivery can follow the two rendering frames. Wait for the real
  // controller to finish returning to the hero before capturing; never hide the mobile bar.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByTestId("hub-sticky")).toHaveAttribute("data-mode", "hidden");
  await expect(page.getByTestId("hub-sticky")).not.toBeVisible();
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
  const viewport = page.viewportSize();
  const bounds = await footer.boundingBox();
  if (!viewport || !bounds) throw new Error("Missing footer capture dimensions");
  // Element screenshots otherwise resize the viewport implicitly when the footer is taller.
  // Include the CSS scroll-padding in that preparation, so scrollIntoView can fit the whole footer.
  const scrollPadding = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return (
      (Number.parseFloat(style.scrollPaddingTop) || 0) + (Number.parseFloat(style.scrollPaddingBottom) || 0)
    );
  });
  const captureViewport = {
    ...viewport,
    height: Math.max(viewport.height, Math.ceil(bounds.height + scrollPadding)),
  };
  await page.setViewportSize(captureViewport);
  test.info().annotations.push({
    type: "footer-capture-dimensions",
    description: JSON.stringify({
      original: viewport,
      capture: captureViewport,
      footerHeight: bounds.height,
      scrollPadding,
    }),
  });
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
