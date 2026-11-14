import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Prior opt-in tracking against a build with NEXT_PUBLIC_META_PIXEL_ID (CI sets
 * 1234567890123456 and E2E_EXPECT_CONSENT=1): nothing third-party loads before a choice
 * (`third_party_requests_before_consent == 0`), "Aceptar" loads the pixel after idle and
 * "Rechazar" keeps it out or revokes it. Meta hosts are stubbed so nothing leaves the machine; the fake fbevents.js records every fbq call in
 * window.__fbqCalls and writes the _fbp cookie the real one would. The same-origin Conversions
 * API relay (/api/meta/events/) is intercepted so the browser/server pair can be compared.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1234567890123456";
const FORBIDDEN = ["InitiateCheckout", "Purchase", "PlaceAnOrder", "begin_checkout"];
const PIXEL_SCRIPT = 'script[src*="connect.facebook.net"]';
const RELAY = "**/api/meta/events/";
const META_HOST = /^https?:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//;
const PUBLIC_ROUTES = [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/grafismo-fonetico/gracias/",
  "/soporte/",
  "/privacidad/",
  "/terminos/",
  "/cookies/",
  "/aviso-legal/",
  "/arrepentimiento/",
  "/compras-y-reembolsos/",
];
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
  return page.evaluate(
    () => (window as unknown as { dataLayer?: DataLayerEvent[] }).dataLayer ?? [],
  );
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

/** Every request to a Meta host the page attempts (also when the context aborts it). */
function watchMetaRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (META_HOST.test(request.url())) urls.push(request.url());
  });
  return urls;
}

function stored(marketing: boolean, version = 3): string {
  return JSON.stringify({ version, analytics: marketing, marketing, updatedAt: "" });
}

/** Starts the visit with a stored choice, as a returning visitor would have. */
async function storeChoice(page: Page, marketing: boolean, version = 3): Promise<void> {
  await page.addInitScript(
    // Seeds the first visit only: a later choice in the same context must not be overwritten.
    (value) => {
      if (localStorage.getItem("pv_consent") === null) localStorage.setItem("pv_consent", value);
    },
    stored(marketing, version),
  );
}

async function reopenBanner(page: Page) {
  await page.getByRole("button", { name: "Configurar cookies" }).click();
  const banner = page.getByTestId("consent-banner");
  await expect(banner).toBeVisible();
  return banner;
}

async function trackedNames(page: Page): Promise<string[]> {
  return ((await fbqCalls(page)) ?? [])
    .filter((call) => call[0] === "track" || call[0] === "trackCustom")
    .map((call) => String(call[1]));
}

test.beforeEach(async ({ page }) => {
  test.skip(!process.env.E2E_EXPECT_CONSENT, "requires a build with NEXT_PUBLIC_META_PIXEL_ID");
  await page.route("https://connect.facebook.net/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_FBEVENTS }),
  );
});

for (const route of PUBLIC_ROUTES) {
  test(`third_party_requests_before_consent == 0 on ${route}`, async ({ page }) => {
    const meta = watchMetaRequests(page);
    await page.goto(route);
    await page.waitForLoadState("load");
    // Past the point where an idle-gated pixel loader would have run (idle or its 2 s timeout).
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.requestIdleCallback(() => resolve(), { timeout: 2500 });
        }),
    );
    await page.waitForTimeout(500);
    expect(meta).toEqual([]);
    await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
    expect(await page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe(
      "undefined",
    );
    expect(await thirdPartyCookies(page)).toEqual([]);
  });
}

test("first visit: banner after first paint with three equal actions, nothing stored, no events", async ({
  page,
}) => {
  const relayed = await captureRelay(page);
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  // The banner opens after two frames plus idle (up to 2.5 s), so allow for it.
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await expect(banner).toContainText("Tu privacidad, tu elección");
  const sizes = await Promise.all(
    ["Aceptar", "Rechazar", "Configurar"].map(async (name) =>
      banner.getByRole("button", { name }).boundingBox(),
    ),
  );
  for (const box of sizes) {
    expect(box?.height).toBeGreaterThanOrEqual(24);
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBe(sizes[0]?.height);
  }
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toBeNull();
  await page.waitForTimeout(500);
  expect(await fbqCalls(page)).toBeUndefined();
  expect(relayed).toEqual([]);
});

test("Aceptar stores the grant and loads fbevents.js after idle", async ({ page }) => {
  const meta = watchMetaRequests(page);
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  // The banner opens after two frames plus idle (up to 2.5 s), so allow for it.
  await expect(banner).toBeVisible({ timeout: 15_000 });
  expect(meta).toEqual([]);
  await banner.getByRole("button", { name: "Aceptar" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "grant"]);
  expect(meta.length).toBeGreaterThan(0);
  const calls = (await fbqCalls(page)) ?? [];
  const init = calls.findIndex((call) => call[0] === "init");
  expect(calls[init]).toEqual(["init", PIXEL_ID]);
  // Meta's automatic events are switched off before init (no event id, never deduplicated).
  expect(calls.findIndex((call) => call[0] === "set" && call[1] === "autoConfig")).toBeLessThan(
    init,
  );
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain(
    '"marketing":true',
  );
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect.poll(() => trackedNames(page)).toContain("CheckoutIntent");
});

test("Rechazar keeps third-party requests at zero, stores the choice and sends nothing", async ({
  page,
}) => {
  const meta = watchMetaRequests(page);
  const relayed = await captureRelay(page);
  await page.goto("/grafismo-fonetico/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect
    .poll(async () => (await dataLayer(page)).some((e) => e.event === "CheckoutIntent"))
    .toBe(true);
  await page.reload();
  await page.waitForTimeout(1000);
  expect(meta).toEqual([]);
  expect(relayed).toEqual([]);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain(
    '"marketing":false',
  );
  expect(await thirdPartyCookies(page)).toEqual([]);
});

test("a stored grant loads the pixel after idle and tracks PageView and ViewContent with event ids", async ({
  page,
}) => {
  await storeChoice(page, true);
  await page.goto("/grafismo-fonetico/");
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await expect.poll(async () => (await trackedNames(page)).length).toBeGreaterThanOrEqual(2);
  const tracked = ((await fbqCalls(page)) ?? []).filter((call) => call[0] === "track");
  expect(tracked.map((call) => call[1])).toEqual(
    expect.arrayContaining(["PageView", "ViewContent"]),
  );
  for (const call of tracked)
    expect(call[3]).toEqual({ eventID: expect.stringMatching(/^[0-9a-f-]{36}$/) });
});

test("withdrawing a stored grant revokes the pixel: consent revoke, no later events", async ({
  page,
}) => {
  await storeChoice(page, true);
  await page.goto("/grafismo-fonetico/");
  await expect.poll(() => trackedNames(page)).toContain("ViewContent");
  const banner = await reopenBanner(page);
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "revoke"]);
  const before = (await trackedNames(page)).length;
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect
    .poll(async () => (await dataLayer(page)).some((e) => e.event === "CheckoutIntent"))
    .toBe(true);
  await page.waitForTimeout(300);
  expect((await trackedNames(page)).length).toBe(before);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain(
    '"marketing":false',
  );
  expect(await thirdPartyCookies(page)).toEqual([]);
});

test("a stored rejection loads nothing on the next visit: no script, no fbq, no banner", async ({
  page,
}) => {
  const meta = watchMetaRequests(page);
  await storeChoice(page, false);
  await page.goto("/grafismo-fonetico/");
  await expect
    .poll(async () => (await dataLayer(page)).some((e) => e.event === "ViewContent"))
    .toBe(true);
  await page.waitForTimeout(300);
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  expect(meta).toEqual([]);
  expect(await page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe(
    "undefined",
  );
  expect(await thirdPartyCookies(page)).toEqual([]);
});

test("Configurar starts with marketing unchecked; checking it and saving loads the pixel", async ({
  page,
}) => {
  const meta = watchMetaRequests(page);
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Configurar" }).click();
  const marketing = banner.getByRole("checkbox", { name: /Marketing \(Meta Pixel\)/ });
  await expect(marketing).not.toBeChecked();
  await expect(banner.getByRole("checkbox", { name: /Necesarias/ })).toBeDisabled();
  expect(meta).toEqual([]);
  await marketing.check();
  await banner.getByRole("button", { name: "Guardar selección" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(1);
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "grant"]);
  expect(await page.evaluate(() => localStorage.getItem("pv_consent"))).toContain(
    '"marketing":true',
  );
});

test("a checkout CTA click never emits a Hotmart-owned event", async ({ page }) => {
  await storeChoice(page, true);
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

test("a choice stored under an earlier version (even a grant) re-prompts and loads nothing", async ({
  page,
}) => {
  const meta = watchMetaRequests(page);
  await storeChoice(page, true, 2);
  await page.goto("/grafismo-fonetico/");
  await expect(page.getByTestId("consent-banner")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator(PIXEL_SCRIPT)).toHaveCount(0);
  expect(meta).toEqual([]);
});

test("the Conversions API relay receives the same event ids as the pixel, with _fbp", async ({
  page,
}) => {
  await storeChoice(page, true);
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

test("withdrawing consent stops the relay too: no POST after the rejection", async ({ page }) => {
  await storeChoice(page, true);
  const relayed = await captureRelay(page);
  await page.goto("/grafismo-fonetico/");
  await expect.poll(() => relayed.map((e) => e.name)).toContain("ViewContent");
  const banner = await reopenBanner(page);
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect.poll(async () => fbqCalls(page)).toContainEqual(["consent", "revoke"]);
  const before = relayed.length;
  await preventNavigation(page, "a[data-checkout]");
  await page.locator('a[data-checkout][data-position="hero"]').click();
  await expect
    .poll(async () => (await dataLayer(page)).some((e) => e.event === "CheckoutIntent"))
    .toBe(true);
  await page.waitForTimeout(1000);
  expect(relayed.length).toBe(before);
  await page.goto("/");
  await expect
    .poll(async () => (await dataLayer(page)).some((e) => e.event === "PageView"))
    .toBe(true);
  await page.waitForTimeout(1000);
  expect(relayed.length).toBe(before);
});
