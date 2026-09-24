import { expect, test } from "./fixtures";

const CHECKOUT_ORIGIN = "https://pay.hotmart.com/";

type DataLayerEvent = { event: string; cta_position?: string; event_id?: string };

async function dataLayer(page: import("@playwright/test").Page, name: string): Promise<DataLayerEvent[]> {
  return page.evaluate(
    (eventName) =>
      ((window as unknown as { dataLayer?: DataLayerEvent[] }).dataLayer ?? []).filter(
        (e) => e.event === eventName,
      ),
    name,
  );
}

async function preventNavigation(page: import("@playwright/test").Page, selector: string) {
  await page.evaluate((sel) => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(sel))
      a.addEventListener("click", (e) => e.preventDefault());
  }, selector);
}

test("every principal CTA points to the configured checkout with allowlisted params only", async ({
  page,
}) => {
  await page.goto(
    "/grafismo-fonetico/?utm_source=tiktok&utm_medium=social&a=aff1&off=EVIL&ref=EVIL&fbclid=abc",
  );
  // Params are appended after hydration; wait for the first link before reading them all.
  await expect(page.locator("a[data-checkout]").first()).toHaveAttribute("href", /utm_source=tiktok/);
  const links = await page.locator("a[data-checkout]").evaluateAll((els) =>
    els.map((el) => ({
      href: (el as HTMLAnchorElement).href,
      target: el.getAttribute("target"),
      rel: el.getAttribute("rel"),
    })),
  );
  expect(links.length).toBeGreaterThanOrEqual(4);
  for (const { href, target, rel } of links) {
    expect(href.startsWith(CHECKOUT_ORIGIN)).toBe(true);
    expect(target).toBe("_blank");
    expect(rel).toContain("noopener");
    const url = new URL(href);
    expect(url.searchParams.get("checkoutMode")).toBe("10");
    expect(url.searchParams.get("utm_source")).toBe("tiktok");
    expect(url.searchParams.get("a")).toBe("aff1");
    expect(url.searchParams.get("fbclid")).toBe("abc");
    expect(url.searchParams.has("off")).toBe(false);
    expect(url.searchParams.has("ref")).toBe(false);
    expect(url.searchParams.get("sck")).toMatch(/^pv-gf-/);
  }
});

test("each CTA click fires exactly one CheckoutIntent with a unique event id", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  // Click tracking attaches on hydration; a pre-hydration click still reaches Hotmart untracked.
  await page.waitForLoadState("networkidle");
  await preventNavigation(page, "a[data-checkout]");
  const positions = await page
    .locator("a[data-checkout]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-position")));
  expect(positions).toEqual(expect.arrayContaining(["header", "hero", "oferta", "final", "sticky"]));
  const hero = page.locator('a[data-checkout][data-position="hero"]');
  await hero.click();
  await hero.click();
  await expect.poll(async () => (await dataLayer(page, "CheckoutIntent")).length).toBe(2);
  const events = await dataLayer(page, "CheckoutIntent");
  expect(new Set(events.map((e) => e.event_id)).size).toBe(2);
  expect(events[0]?.cta_position).toBe("hero");
});

test("hub links keep acquisition params and emit product interest", async ({ page }) => {
  await page.goto("/?utm_source=ig&utm_campaign=sept&foo=bar");
  const hero = page.locator('a[data-position="hero"]');
  await expect(hero).toHaveAttribute("href", /\/grafismo-fonetico\/\?utm_source=ig&utm_campaign=sept/);
  await expect(hero).not.toHaveAttribute("href", /foo=bar/);
  await preventNavigation(page, "a[data-position]");
  await page.locator('a[data-position="hero"]').click();
  expect(await dataLayer(page, "PequeversoProductInterest")).toHaveLength(1);
});

test("no pixel script is injected without configuration", async ({ page }) => {
  test.skip(!!process.env.E2E_EXPECT_CONSENT, "build was configured with a pixel id");
  await page.goto("/grafismo-fonetico/");
  await expect(page.locator('script[src*="connect.facebook.net"]')).toHaveCount(0);
});

test("landing records ViewContent once on mount", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  await expect.poll(async () => (await dataLayer(page, "ViewContent")).length, { timeout: 10_000 }).toBe(1);
  await page.waitForTimeout(500);
  expect(await dataLayer(page, "ViewContent")).toHaveLength(1);
});
