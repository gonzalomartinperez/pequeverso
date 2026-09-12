import { expect, test } from "@playwright/test";

/** Crawls every internal link reachable from the home page and asserts none 404s. */
test("complete internal navigation: no dead links", async ({ page, request }) => {
  const seen = new Set<string>();
  const queue = ["/"];
  const broken: string[] = [];
  while (queue.length && seen.size < 60) {
    const path = queue.shift() as string;
    if (seen.has(path)) continue;
    seen.add(path);
    const response = await page.goto(path);
    if (!response || response.status() >= 400) {
      broken.push(`${path} → ${response?.status()}`);
      continue;
    }
    const links = await page
      .locator("a[href]")
      .evaluateAll((els) =>
        els
          .map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? "")
          .filter((h) => h.startsWith("/") && !h.startsWith("//")),
      );
    for (const link of links) {
      const clean = link.split("#")[0]?.split("?")[0] ?? "";
      if (clean && !seen.has(clean)) queue.push(clean);
    }
  }
  for (const path of [
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.webmanifest",
    "/build-info.json",
    "/favicon.ico",
    "/icon.svg",
  ]) {
    const res = await request.get(path);
    if (res.status() !== 200) broken.push(`${path} → ${res.status()}`);
  }
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThanOrEqual(9);
});

test("sitemap lists only indexable routes and pages carry a self canonical", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://pequeverso.com/grafismo-fonetico/");
  expect(sitemap).not.toContain("/imprime-y-juega/");
  expect(sitemap).not.toContain("/gracias/");
  for (const route of ["/", "/grafismo-fonetico/", "/soporte/"]) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://pequeverso.com${route}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://pequeverso.com${route}`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  }
});

test("media requests resolve and the LCP hero image has explicit dimensions", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/media/") && res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  await page.goto("/grafismo-fonetico/");
  const hero = page.locator("img[fetchpriority='high']").first();
  await expect(hero).toHaveAttribute("width", /\d+/);
  await expect(hero).toHaveAttribute("height", /\d+/);
  await expect(hero).toHaveAttribute("srcset", /w480|w768/);
  expect(failed).toEqual([]);
});
