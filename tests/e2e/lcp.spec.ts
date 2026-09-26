import { expect, test } from "./fixtures";

const routes = ["/", "/grafismo-fonetico/"];
/** File name of a hero-class rendition (product hero, cutout hero, or a real page). */
const HERO_RENDITION = /-(hero|hero-alt|cutout-[a-z-]+|page-\d+)-w\d+-/;

/** Largest Contentful Paint element as reported by the browser after the page settles. */
async function lcpElement(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      new Promise<{ tag: string; lcp: boolean; heroText: boolean } | null>((resolve) => {
        let last: Element | null = null;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const element = (entry as PerformanceEntry & { element?: Element }).element;
            if (element) last = element;
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(
            last
              ? {
                  tag: last.tagName.toLowerCase(),
                  lcp: last.hasAttribute("data-lcp"),
                  heroText: last.closest("#hero") !== null && last.tagName !== "IMG",
                }
              : null,
          );
        }, 1500);
      }),
  );
}

for (const route of routes) {
  test(`${route}: LCP element is hero text or the preloaded hero image`, async ({ page }) => {
    await page.goto(route);
    const element = await lcpElement(page);
    expect(element).not.toBeNull();
    // Narrow viewports paint the lead paragraph before the worksheet stack; both are hero text.
    expect(element?.heroText || (element?.tag === "img" && element.lcp)).toBe(true);
  });

  test(`${route}: the image preload targets the hero worksheet, never the isotipo`, async ({ page }) => {
    await page.goto(route);
    const hero = page.locator("main img[data-lcp]").first();
    const candidates = await hero.evaluate((img) => [
      img.getAttribute("srcset"),
      ...[...(img.closest("picture")?.querySelectorAll("source") ?? [])].map((s) => s.getAttribute("srcset")),
    ]);
    const sizes = await hero.getAttribute("sizes");
    const preloads = await page
      .locator(`link[rel="preload"][as="image"][imagesizes="${sizes}"]`)
      .evaluateAll((links) =>
        links.map((link) => ({
          srcset: link.getAttribute("imagesrcset") ?? "",
          priority: link.getAttribute("fetchpriority"),
        })),
      );
    // Link prefetches may add another route's hero preload; exactly one must match this page's hero.
    const own = preloads.filter((link) => candidates.includes(link.srcset));
    expect(own).toHaveLength(1);
    expect(own[0]?.srcset).toMatch(HERO_RENDITION);
    expect(own[0]?.priority).toBe("high");
    expect(await hero.evaluate((img) => (img instanceof HTMLImageElement ? img.currentSrc : ""))).toMatch(
      HERO_RENDITION,
    );
    const allPreloads = await page
      .locator('link[rel="preload"]')
      .evaluateAll((links) =>
        links.map((link) => `${link.getAttribute("href") ?? ""} ${link.getAttribute("imagesrcset") ?? ""}`),
      );
    expect(allPreloads.join(" ")).not.toContain("isotipo");
  });

  test(`${route}: both self-hosted web fonts are preloaded`, async ({ page }) => {
    await page.goto(route);
    const fonts = page.locator('link[rel="preload"][as="font"]');
    await expect(fonts).toHaveCount(2);
    for (const link of await fonts.all()) {
      await expect(link).toHaveAttribute("href", /^\/fonts\/.+\.woff2$/);
      await expect(link).toHaveAttribute("crossorigin", "");
    }
  });
}
