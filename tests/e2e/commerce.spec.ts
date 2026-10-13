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

// The hub's hero now chooses a need (doors to #leer / #bebe, docs/specs/home-hub.md); the link to
// the kit's page moved into its chapter (`story`). Same assertions on that link.
test("hub links keep acquisition params and emit product interest", async ({ page }) => {
  await page.goto("/?utm_source=ig&utm_campaign=sept&foo=bar");
  const story = page.locator('a[data-position="story"]');
  await expect(story).toHaveAttribute("href", /\/grafismo-fonetico\/\?utm_source=ig&utm_campaign=sept/);
  await expect(story).not.toHaveAttribute("href", /foo=bar/);
  await preventNavigation(page, "a[data-position]");
  await story.click();
  expect(await dataLayer(page, "PequeversoProductInterest")).toHaveLength(1);
  // The home never links to the checkout and never uses the coral purchase style.
  await expect(page.locator("main a[data-checkout]")).toHaveCount(0);
  await expect(page.locator("main a.bg-primary, header a.bg-primary")).toHaveCount(0);
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

test("home recommends the affiliate course with a visible disclosure and its own click event", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const block = page.locator("[data-affiliate-block]");
  await block.scrollIntoViewIfNeeded();
  await expect(block.getByRole("heading", { level: 2 })).toContainText("primeras comidas");
  const disclosure = block.locator("[data-affiliate-disclosure]");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText("Recomendación con enlace de afiliado");
  await expect(disclosure).toContainText("Hotmart gestiona el pago, la entrega y los reembolsos.");
  await expect(disclosure.getByRole("link")).toHaveAttribute("href", "/aviso-legal/#afiliados");
  await expect(block).toContainText("Garantía de 7 días de Hotmart");
  await expect(block).not.toContainText("US$");

  const link = block.getByRole("link", { name: /Ver la guía en Hotmart/ });
  await expect(link).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /sponsored/);
  await expect(link).toHaveAttribute("rel", /noopener/);
  // The affiliate link is navy (secondary), never the coral purchase CTA.
  await expect(link).toHaveClass(/\bbg-secondary\b/);
  await expect(link).not.toHaveClass(/\bbg-primary\b/);
  for (const img of await block.locator("img").all()) await expect(img).toHaveAttribute("loading", "lazy");

  await preventNavigation(page, "a[data-affiliate]");
  await link.click();
  await expect.poll(async () => (await dataLayer(page, "PequeversoAffiliateClick")).length).toBe(1);
  expect((await dataLayer(page, "PequeversoAffiliateClick"))[0]?.cta_position).toBe("home");
  for (const name of ["CheckoutIntent", "InitiateCheckout", "Purchase"])
    expect(await dataLayer(page, name)).toHaveLength(0);
  // Every link to the course on the home (chapter, close, sticky bar) is the same sponsored redirect.
  for (const other of await page.locator("a[data-affiliate]").all()) {
    await expect(other).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
    await expect(other).toHaveAttribute("rel", /sponsored/);
    await expect(other).toHaveAttribute("target", "_blank");
  }
});
