import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Opt-out tracking against a build with NEXT_PUBLIC_META_PIXEL_ID (CI sets 1234567890123456
 * and E2E_EXPECT_CONSENT=1): the pixel runs by default and "Rechazar" revokes it. Meta hosts
 * are stubbed so nothing leaves the machine; the fake fbevents.js records every fbq call in
 * window.__fbqCalls and writes the _fbp cookie the real one would. The same-origin Conversions
 * API relay (/api/meta/events/) is intercepted so the browser/server pair can be compared.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1234567890123456";
const FORBIDDEN = ["InitiateCheckout", "Purchase", "PlaceAnOrder", "begin_checkout"];
const PIXEL_SCRIPT = 'script[src*="connect.facebook.net"]';
const RELAY = "**/api/meta/events/";
const FAKE_FBEVENTS = [
  "window.__fbqCalls=[];",
  "document.cookie='_fbp=fb.1.1.test; Path=/';",
  "(function(){var q=(window.fbq&&window.fbq.queue)||[];",
  "var f=function(){window.__fbqCalls.push(Array.prototype.slice.call(arguments))};",
  "for(var i=0;i<q.length;i++)f.apply(null,q[i]);window.fbq=f;window._fbq=f;})();",
].join("");

type DataLayerEvent = { event: string; event_id?: string };
type FbqCall = unknown[];
type RelayEvent = {
  name: string;
  eventId: string;
  time: number;
  sourceUrl: string;
  fbp?: string;
  fbc?: string;
};

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

/** Intercepts relay POSTs (fetch and sendBeacon) and collects their events; answers 202. */
async function captureRelay(page: Page): Promise<RelayEvent[]> {
  const relayed: RelayEvent[] = [];
  await page.route(RELAY, (route) => {
    const request = route.request();
    if (request.method() === "POST")
      relayed.push(...(request.postDataJSON() as { events: RelayEvent[] }).events);
    route.fulfill({ status: 202, headers: { "cache-control": "no-store" } });
  });
  return relayed;
}

function pixelEventIds(calls: FbqCall[]): Map<string, string> {
  const ids = new Map<string, string>();
  for (const call of calls) {
    if (call[0] !== "track" && call[0] !== "trackCustom") continue;
    ids.set(String(call[1]), String((call[3] as { eventID: string }).eventID));
  }
  return ids;
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
});

const REJECTED = JSON.stringify({ version: 2, analytics: false, marketing: false, updatedAt: "" });

async function trackedNames(page: Page): Promise<string[]> {
  return ((await fbqCalls(page)) ?? [])
    .filter((call) => call[0] === "track" || call[0] === "trackCustom")
    .map((call) => String(call[1]));
}

test("the pixel runs by default: init, PageView and ViewContent with event ids, banner offered", async ({
  page,
}) => {
  await page.goto("/grafismo-fonetico/");
  await expect(page.getByTestId("consent-banner")).toBeVisible();
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await expect.poll(async () => (await trackedNames(page)).length).toBeGreaterThanOrEqual(2);

  const calls = (await fbqCalls(page)) ?? [];
  expect(calls[0]).toEqual(["init", PIXEL_ID]);
  expect(calls).not.toContainEqual(["consent", "revoke"]);
  const tracked = calls.filter((call) => call[0] === "track");
  expect(tracked.map((call) => call[1])).toEqual(expect.arrayContaining(["PageView", "ViewContent"]));
  for (const call of tracked) expect(call[3]).toEqual({ eventID: expect.stringMatching(/^[0-9a-f-]{36}$/) });

  const events = await dataLayer(page);
  expect(events.map((e) => e.event)).toEqual(expect.arrayContaining(["PageView", "ViewContent"]));
  expect(events.every((e) => typeof e.event_id === "string" && e.event_id.length === 36)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toBeNull();
});

test("Aceptar keeps the pixel active and stores the choice", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Aceptar" }).click();
  await expect(banner).toHaveCount(0);
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "grant"]);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain('"marketing":true');
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect.poll(() => trackedNames(page)).toContain("CheckoutIntent");
});

test("Rechazar revokes the pixel: consent revoke, no later events, choice stored", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  await expect.poll(() => trackedNames(page)).toContain("ViewContent");
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "revoke"]);
  const before = (await trackedNames(page)).length;
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect.poll(async () => (await dataLayer(page)).some((e) => e.event === "CheckoutIntent")).toBe(true);
  await page.waitForTimeout(300);
  expect((await trackedNames(page)).length).toBe(before);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain('"marketing":false');
  expect(await thirdPartyCookies(page)).toEqual([]);
});

test("a stored rejection loads nothing on the next visit: no script, no fbq, no banner", async ({ page }) => {
  await page.addInitScript((stored) => localStorage.setItem("pv_consent", stored), REJECTED);
  await page.goto("/grafismo-fonetico/");
  await expect.poll(async () => (await dataLayer(page)).some((e) => e.event === "ViewContent")).toBe(true);
  await page.waitForTimeout(300);
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  expect(await page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe("undefined");
  expect(await thirdPartyCookies(page)).toEqual([]);
});

test("Configurar shows marketing active by default; unchecking it revokes the pixel", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Configurar" }).click();
  const marketing = banner.getByRole("checkbox", { name: /Marketing \(Meta Pixel\)/ });
  await expect(marketing).toBeChecked();
  await expect(banner.getByRole("checkbox", { name: /Necesarias/ })).toBeDisabled();
  await marketing.uncheck();
  await banner.getByRole("button", { name: "Guardar selección" }).click();
  await expect(banner).toHaveCount(0);
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "revoke"]);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain('"marketing":false');
});

test("a checkout CTA click never emits a Hotmart-owned event", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect
    .poll(async () => (await dataLayer(page)).filter((e) => e.event === "CheckoutIntent"))
    .toHaveLength(1);
  await expect.poll(() => trackedNames(page)).toContain("CheckoutIntent");
  const names = (await dataLayer(page)).map((e) => e.event);
  const sent = await trackedNames(page);
  for (const forbidden of FORBIDDEN) {
    expect(names).not.toContain(forbidden);
    expect(sent).not.toContain(forbidden);
  }
});

test("a choice stored under a previous version re-prompts and falls back to the default policy", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("pv_consent", JSON.stringify({ version: 1, marketing: false, updatedAt: "" }));
    // biome-ignore lint/suspicious/noDocumentCookie: legacy cookie written the way v1 wrote it
    document.cookie = "pv_consent=none.v1; Path=/";
  });
  await page.goto("/grafismo-fonetico/");
  await expect(page.getByTestId("consent-banner")).toBeVisible();
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await expect.poll(() => trackedNames(page)).toContain("ViewContent");
});

test("the Conversions API relay receives the same event ids as the pixel, with _fbp", async ({ page }) => {
  const relayed = await captureRelay(page);
  await page.goto("/grafismo-fonetico/");
  await expect
    .poll(() => relayed.map((e) => e.name))
    .toEqual(expect.arrayContaining(["PageView", "ViewContent"]));
  const pixel = pixelEventIds((await fbqCalls(page)) ?? []);
  for (const name of ["PageView", "ViewContent"]) {
    const server = relayed.find((e) => e.name === name);
    expect(server?.eventId, name).toBe(pixel.get(name));
    expect(server?.fbp, name).toBe("fb.1.1.test");
    expect(server?.sourceUrl, name).toContain("/grafismo-fonetico/");
    expect(typeof server?.time).toBe("number");
  }
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect.poll(() => relayed.map((e) => e.name)).toContain("CheckoutIntent");
  const intent = relayed.find((e) => e.name === "CheckoutIntent");
  expect(intent?.eventId).toBe(pixelEventIds((await fbqCalls(page)) ?? []).get("CheckoutIntent"));
  for (const forbidden of FORBIDDEN) expect(relayed.map((e) => e.name)).not.toContain(forbidden);
});

test("Rechazar stops the relay too: no POST after the rejection", async ({ page }) => {
  const relayed = await captureRelay(page);
  await page.goto("/grafismo-fonetico/");
  await expect.poll(() => relayed.map((e) => e.name)).toContain("ViewContent");
  await page.getByTestId("consent-banner").getByRole("button", { name: "Rechazar" }).click();
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "revoke"]);
  const before = relayed.length;
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect.poll(async () => (await dataLayer(page)).some((e) => e.event === "CheckoutIntent")).toBe(true);
  await page.waitForTimeout(1000);
  expect(relayed.length).toBe(before);
  await page.goto("/");
  await expect.poll(async () => (await dataLayer(page)).some((e) => e.event === "PageView")).toBe(true);
  await page.waitForTimeout(1000);
  expect(relayed.length).toBe(before);
});
