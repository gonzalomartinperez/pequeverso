import { expect, type Page, test } from "@playwright/test";

/**
 * Consent-gated tracking against a build with NEXT_PUBLIC_META_PIXEL_ID (CI sets
 * 1234567890123456 and E2E_EXPECT_CONSENT=1). Third-party hosts are stubbed so nothing
 * leaves the machine; the fake fbevents.js records every fbq call in window.__fbqCalls.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1234567890123456";
const FORBIDDEN = ["InitiateCheckout", "Purchase", "PlaceAnOrder", "begin_checkout"];
const PIXEL_SCRIPT = 'script[src*="connect.facebook.net"]';
const FAKE_FBEVENTS = [
  "window.__fbqCalls=[];",
  "(function(){var q=(window.fbq&&window.fbq.queue)||[];",
  "var f=function(){window.__fbqCalls.push(Array.prototype.slice.call(arguments))};",
  "for(var i=0;i<q.length;i++)f.apply(null,q[i]);window.fbq=f;window._fbq=f;})();",
].join("");

type DataLayerEvent = { event: string; event_id?: string };
type FbqCall = unknown[];

async function dataLayer(page: Page): Promise<DataLayerEvent[]> {
  return page.evaluate(() => (window as unknown as { dataLayer?: DataLayerEvent[] }).dataLayer ?? []);
}

async function fbqCalls(page: Page): Promise<FbqCall[] | undefined> {
  return page.evaluate(() => (window as unknown as { __fbqCalls?: FbqCall[] }).__fbqCalls);
}

async function thirdPartyCookies(page: Page): Promise<string[]> {
  const cookies = await page.context().cookies();
  return cookies.filter((cookie) => cookie.name !== "pv_consent").map((cookie) => cookie.name);
}

async function preventNavigation(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(sel))
      a.addEventListener("click", (e) => e.preventDefault());
  }, selector);
}

test.beforeEach(async ({ page }) => {
  test.skip(!process.env.E2E_EXPECT_CONSENT, "requires a build with NEXT_PUBLIC_META_PIXEL_ID");
  await page.route("https://connect.facebook.net/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_FBEVENTS }),
  );
  await page.route("https://**.facebook.com/**", (route) => route.abort());
});

test("nothing loads before consent: no pixel script, no fbq, no third-party cookies", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  await expect.poll(async () => (await dataLayer(page)).some((e) => e.event === "ViewContent")).toBe(true);
  await expect(page.getByTestId("consent-banner")).toBeVisible();
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  expect(await page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe("undefined");
  expect(await thirdPartyCookies(page)).toEqual([]);
});

test("Aceptar injects the pixel and replays PageView and ViewContent with event ids", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Aceptar" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await expect.poll(async () => (await fbqCalls(page))?.length ?? 0).toBeGreaterThanOrEqual(3);

  const calls = (await fbqCalls(page)) ?? [];
  expect(calls[0]).toEqual(["init", PIXEL_ID]);
  expect(calls).toContainEqual(["consent", "grant"]);
  const tracked = calls.filter((call) => call[0] === "track");
  expect(tracked.map((call) => call[1])).toEqual(expect.arrayContaining(["PageView", "ViewContent"]));
  for (const call of tracked) expect(call[3]).toEqual({ eventID: expect.stringMatching(/^[0-9a-f-]{36}$/) });

  const events = await dataLayer(page);
  const names = events.map((e) => e.event);
  expect(names).toEqual(expect.arrayContaining(["PageView", "ViewContent"]));
  expect(events.every((e) => typeof e.event_id === "string" && e.event_id.length === 36)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain('"version":2');
});

test("Rechazar keeps the page clean: no script, no fbq calls, no third-party cookies", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  expect(await fbqCalls(page)).toBeUndefined();
  expect(await thirdPartyCookies(page)).toEqual([]);
  expect((await dataLayer(page)).map((e) => e.event)).toContain("CheckoutIntent");
});

test("Configurar exposes one checkbox per gated category naming the tool", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Configurar" }).click();
  const marketing = banner.getByRole("checkbox", { name: /Marketing \(Meta Pixel\)/ });
  await expect(marketing).not.toBeChecked();
  await expect(banner.getByRole("checkbox", { name: /Necesarias/ })).toBeDisabled();
  await marketing.check();
  await banner.getByRole("button", { name: "Guardar selección" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain('"marketing":true');
});

test("a checkout CTA click never emits a Hotmart-owned event", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  await page.getByTestId("consent-banner").getByRole("button", { name: "Aceptar" }).click();
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect
    .poll(async () => (await dataLayer(page)).filter((e) => e.event === "CheckoutIntent"))
    .toHaveLength(1);
  const names = (await dataLayer(page)).map((e) => e.event);
  const sent = ((await fbqCalls(page)) ?? []).map((call) => String(call[1]));
  for (const forbidden of FORBIDDEN) {
    expect(names).not.toContain(forbidden);
    expect(sent).not.toContain(forbidden);
  }
  expect(sent).toContain("CheckoutIntent");
});

test("a consent stored under a previous version re-prompts and loads nothing", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("pv_consent", JSON.stringify({ version: 1, marketing: true, updatedAt: "" }));
    // biome-ignore lint/suspicious/noDocumentCookie: legacy cookie written the way v1 wrote it
    document.cookie = "pv_consent=marketing.v1; Path=/";
  });
  await page.goto("/grafismo-fonetico/");
  await expect(page.getByTestId("consent-banner")).toBeVisible();
  await expect.poll(async () => (await dataLayer(page)).some((e) => e.event === "ViewContent")).toBe(true);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  expect(await fbqCalls(page)).toBeUndefined();
});
