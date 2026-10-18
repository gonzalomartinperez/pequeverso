import type { Page } from "@playwright/test";
import { collectLayoutFaults } from "../helpers/responsive-layout.ts";
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
  "/aviso-legal/",
  "/arrepentimiento/",
  "/esta-no-existe/",
];
const HEADER_CTA =
  "header a[data-checkout], header a[data-position], header a[data-decision-link], header [data-slot='cta-button']";

function height(width: number) {
  return width >= 1024 ? 900 : width >= 768 ? 1024 : 844;
}

async function layoutFaults(page: Page) {
  return page.evaluate(collectLayoutFaults);
}

for (const route of routes) {
  test(`responsive contract: ${route}`, async ({ page }) => {
    test.setTimeout(90_000); // six widths of the heaviest landing under a parallel run
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
  // The banner mounts after hydration: wait for it when the build expects it, or the check races.
  if (process.env.E2E_EXPECT_CONSENT) await expect(banner).toBeVisible();
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

test("primary CTA labels (checkout and product links) stay on one line from 320 px up", async ({ page }) => {
  // 360 covers the home's narrow-phone pills; the landing keeps its original widths (funnel pages
  // are out of scope for the hub change).
  for (const [route, width] of [
    ...[320, 390, 768, 1024].map((w) => ["/grafismo-fonetico/", w] as const),
    ...[320, 360, 390, 768, 1024].map((w) => ["/", w] as const),
  ]) {
    await page.setViewportSize({ width, height: height(width) });
    await page.goto(route, { waitUntil: "load" });
    if (route === "/") await expect(page.locator("main [data-door-action] > span")).toHaveCount(2);
    const wrapped = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLAnchorElement>(
          // Every product link on the home (kit and course) and the landing's checkouts.
          'main a[data-checkout]:not([data-position="sticky"]), main a[data-position]:not([data-position="sticky"])',
        ),
      ]
        .flatMap((link) => {
          // A rich selection card also contains names and descriptions that may wrap.
          // Its visual CTA has one explicit text label; every other link keeps the original check.
          const action = link.querySelector<HTMLSpanElement>("[data-door-action] > span");
          return action ? [action] : [...link.querySelectorAll<HTMLSpanElement>("span")];
        })
        .filter(
          (span) =>
            span.offsetParent !== null &&
            !span.classList.contains("sr-only") &&
            !span.querySelector("span") &&
            span.textContent?.trim(),
        )
        // A label inside a flex button is blockified (one client rect even when it wraps), so
        // compare its height with one line of its own line-height.
        .filter((span) => {
          const style = getComputedStyle(span);
          const line = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
          return span.getBoundingClientRect().height > line * 1.5;
        })
        .map((span) => span.textContent?.trim()),
    );
    expect(wrapped, `${route} @${width}`).toEqual([]);
  }
});

test("mobile sticky bar is invisible, not just off-screen, while the hero CTA is in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/grafismo-fonetico/", { waitUntil: "load" });
  const bar = page.getByTestId("sticky-cta");
  await expect(bar).toHaveCSS("visibility", "hidden");
  await page.locator("#metodo").scrollIntoViewIfNeeded();
  await expect(bar).toHaveAttribute("data-visible", "");
  await expect(bar).toHaveCSS("visibility", "visible");
});
