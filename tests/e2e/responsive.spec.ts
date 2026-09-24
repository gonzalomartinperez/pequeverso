import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Responsive contract (docs/design-system.md): every route from 320 to 1920 px has no horizontal
 * overflow, complete landmarks, no clipped control text and no stretched images; at ≤ 768 px the
 * header CTA is inside the first viewport; on a short landscape phone no fixed layer covers a
 * checkout CTA. Deferred sections grow as they render, so the CTA is re-centred on every poll.
 */
test.beforeEach(() => {
  test.skip(
    !test.info().project.name.endsWith("-1440"),
    "sweeps its own widths; runs in the 1440 project of each engine",
  );
});

const widths = [320, 390, 768, 1024, 1440, 1920] as const;
const routes = [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/imprime-y-juega/?downsell=1",
  "/grafismo-fonetico/gracias/",
  "/soporte/",
  "/privacidad/",
  "/terminos/",
  "/esta-no-existe/",
];
const HEADER_CTA =
  "header a[data-checkout], header a[data-position], header a[data-decision-link], header [data-slot='cta-button']";

function height(width: number) {
  return width >= 1024 ? 900 : width >= 768 ? 1024 : 844;
}

async function layoutFaults(page: Page) {
  return page.evaluate(() => {
    const faults: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth) {
      const culprit = [...document.querySelectorAll<HTMLElement>("body *")].find(
        (el) =>
          el.getBoundingClientRect().right > doc.clientWidth + 0.5 && !el.closest("[aria-hidden='true']"),
      );
      const where = culprit
        ? `${culprit.tagName.toLowerCase()}.${String(culprit.className).slice(0, 60)}`
        : "?";
      faults.push(`page scrolls horizontally by ${doc.scrollWidth - doc.clientWidth}px (${where})`);
    }
    const label = (el: Element) =>
      `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`;
    for (const el of document.querySelectorAll<HTMLElement>("a, button")) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (style.display === "inline" || rect.width <= 2 || el.offsetParent === null) continue;
      if (el.scrollWidth > el.clientWidth + 1)
        faults.push(`${label(el)} clips its text (${el.scrollWidth} > ${el.clientWidth})`);
    }
    for (const img of document.querySelectorAll<HTMLImageElement>("img")) {
      const rect = img.getBoundingClientRect();
      if (!img.complete || !img.naturalWidth || rect.width < 2 || rect.height < 2) continue;
      if (getComputedStyle(img).objectFit !== "fill") continue;
      const natural = img.naturalWidth / img.naturalHeight;
      const drift = Math.abs(rect.width / rect.height - natural) / natural;
      if (drift > 0.02)
        faults.push(`img ${img.currentSrc.split("/").pop()} is stretched (${(drift * 100).toFixed(1)}%)`);
    }
    return faults;
  });
}

for (const route of routes) {
  test(`responsive contract: ${route}`, async ({ page }) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: height(width) });
      await page.goto(route, { waitUntil: "load" });
      await expect(page.getByRole("banner"), `${route} @${width}`).toBeVisible();
      await expect(page.getByRole("contentinfo"), `${route} @${width}`).toBeVisible();
      expect(await layoutFaults(page), `${route} @${width}`).toEqual([]);
      const cta = page.locator(HEADER_CTA).first();
      if (width <= 768 && (await cta.count()) > 0) {
        const box = await cta.boundingBox();
        expect(box, `${route} @${width}: header CTA`).not.toBeNull();
        if (box) {
          expect(box.x, `${route} @${width}: header CTA left edge`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${route} @${width}: header CTA right edge`).toBeLessThanOrEqual(width);
          expect(box.y + box.height, `${route} @${width}: header CTA below the fold`).toBeLessThanOrEqual(
            height(width),
          );
          expect(box.height, `${route} @${width}: header CTA target`).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
}

test("short landscape phone: no fixed layer covers a checkout CTA", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  if (await banner.isVisible()) await banner.getByRole("button", { name: "Rechazar" }).click();
  const ctas = page.locator('main a[data-checkout]:not([data-position="sticky"])');
  const count = await ctas.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const cta = ctas.nth(index);
    if (!(await cta.isVisible())) continue;
    await expect
      .poll(
        () =>
          cta.evaluate((el) => {
            el.scrollIntoView({ block: "center", behavior: "instant" });
            const rect = el.getBoundingClientRect();
            const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            return hit !== null && el.contains(hit);
          }),
        { message: `checkout CTA #${index} is covered`, timeout: 3_000 },
      )
      .toBe(true);
  }
});
