import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

/**
 * The state gallery (`/_design`) exists only in the verification build (`npm run
 * test:browser:design-gallery`). Against the publishable export these tests are skipped; the
 * absence is proven by tools/check-design-gallery-disabled.ts and `assistant-disabled`-style specs.
 * The full visual and axe matrix over the gallery is M5 work.
 */
test.skip(
  !process.env.DESIGN_GALLERY_E2E,
  "needs the gallery build (npm run build:design-gallery)",
);

test("renders every block, is noindex and stays out of the sitemap", async ({ page, request }) => {
  await page.route("**/hotmart-checkout-elements.js", (route) => route.abort());
  await page.goto("/_design/");
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
  for (const block of ["buttons", "badges", "notices", "skeleton", "banners", "sticky", "widget"])
    await expect(page.locator(`[data-gallery-block=${block}]`)).toHaveCount(1);
  await expect(page.locator("[data-gallery-row^=button-]")).toHaveCount(12);
  await expect(page.locator("#hotmart-sales-funnel")).toHaveCount(1);
  await expect(page.getByTestId("widget-fallback")).toBeVisible();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("_design");
});

test("has no WCAG 2.2 AA violations", async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/hotmart-checkout-elements.js", (route) => route.abort());
  await page.goto("/_design/");
  await expect(page.getByTestId("widget-fallback")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
