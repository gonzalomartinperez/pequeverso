import { expect, test } from "@playwright/test";

const routes = ["/", "/grafismo-fonetico/"];

/** Largest Contentful Paint element as reported by the browser after the page settles. */
async function lcpElement(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      new Promise<{ tag: string; lcp: boolean } | null>((resolve) => {
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
          resolve(last ? { tag: last.tagName.toLowerCase(), lcp: last.hasAttribute("data-lcp") } : null);
        }, 1500);
      }),
  );
}

for (const route of routes) {
  test(`${route}: LCP element is the heading or the preloaded hero image`, async ({ page }) => {
    await page.goto(route);
    const element = await lcpElement(page);
    expect(element).not.toBeNull();
    expect(element?.tag === "h1" || (element?.tag === "img" && element.lcp)).toBe(true);
  });

  test(`${route}: the image preload targets the hero rendition, never the isotipo`, async ({ page }) => {
    await page.goto(route);
    const hero = page.locator("main img[data-lcp]").first();
    const candidates = await hero.evaluate((img) => [
      img.getAttribute("srcset"),
      ...[...(img.closest("picture")?.querySelectorAll("source") ?? [])].map((s) => s.getAttribute("srcset")),
    ]);
    const sizes = await hero.getAttribute("sizes");
    const preloads = page.locator(`link[rel="preload"][as="image"][imagesizes="${sizes}"]`);
    await expect(preloads).toHaveCount(1);
    const srcset = (await preloads.first().getAttribute("imagesrcset")) ?? "";
    expect(candidates).toContain(srcset);
    expect(srcset).toMatch(/-hero-w\d+-/);
    await expect(preloads.first()).toHaveAttribute("fetchpriority", "high");
    expect(await hero.evaluate((img) => img.currentSrc)).toMatch(/-hero-w\d+-/);
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
