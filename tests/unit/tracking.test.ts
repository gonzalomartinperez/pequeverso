import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createMetaAdapter } from "../../src/features/tracking/adapters/meta.ts";
import { createMetaCapiAdapter, META_CAPI_ENDPOINT } from "../../src/features/tracking/adapters/meta-capi.ts";
import type { TrackedEvent, TrackingAdapter } from "../../src/features/tracking/adapters/types.ts";
import {
  CONSENT_VERSION,
  type ConsentState,
  DEFAULT_CHOICE,
  readConsent,
  serializeConsentCookie,
  writeConsent,
} from "../../src/features/tracking/consent.ts";
import {
  _resetForTests,
  FORBIDDEN_EVENTS,
  flush,
  track,
  trackCheckoutIntent,
} from "../../src/features/tracking/track.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type RelayedEvent = { name: string; eventId: string; fbp?: string; fbc?: string };
type CapiRequest = { url: string; init: RequestInit; body: { events: RelayedEvent[] } };
type FakeAdapter = TrackingAdapter & { ready: boolean; sent: TrackedEvent[]; consents: ConsentState[] };

/** Node has no browser globals: the code under test gets minimal fakes (typed as the real ones). */
function setGlobal(target: object, name: string, value: object): void {
  Object.defineProperty(target, name, { value, configurable: true, writable: true });
}

/** `track()` without the compile-time exclusion of Hotmart-owned events, to exercise the runtime guard. */
const trackUnchecked = track as (name: string) => string;

function setNodeEnv(value: "development" | "production"): void {
  Object.assign(process.env, { NODE_ENV: value });
}

function installWindow(): void {
  const storage = new Map<string, string>();
  const win = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, String(value)),
      removeItem: (key: string) => void storage.delete(key),
    },
  });
  setGlobal(globalThis, "window", win);
  setGlobal(globalThis, "document", { cookie: "" });
}

function fakeAdapter(overrides: Partial<FakeAdapter> = {}): FakeAdapter {
  const adapter: FakeAdapter = {
    id: "meta",
    label: "Fake",
    category: "marketing",
    enabled: true,
    ready: true,
    sent: [],
    consents: [],
    scripts: () => [],
    onConsent(state: ConsentState) {
      adapter.consents.push(state);
    },
    send(event: TrackedEvent) {
      if (!adapter.ready) return false;
      adapter.sent.push(event);
      return true;
    },
    ...overrides,
  };
  return adapter;
}

beforeEach(() => {
  installWindow();
  setNodeEnv("development");
  _resetForTests([]);
});

test("forbidden events throw in development and are dropped in production", () => {
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  writeConsent({ analytics: false, marketing: true });
  for (const name of FORBIDDEN_EVENTS) assert.throws(() => trackUnchecked(name), /owned by Hotmart/);
  setNodeEnv("production");
  for (const name of FORBIDDEN_EVENTS) assert.equal(trackUnchecked(name), "");
  assert.equal(window.dataLayer, undefined);
  assert.equal(adapter.sent.length, 0);
});

test("every event gets a UUID id and is mirrored to dataLayer with undefined params dropped", () => {
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  const id = trackCheckoutIntent({ product: "gf", offer: "main", position: "hero", offerMode: undefined });
  assert.match(id, UUID);
  assert.deepEqual(window.dataLayer, [
    { event: "CheckoutIntent", event_id: id, product: "gf", offer: "main", cta_position: "hero" },
  ]);
  assert.deepEqual(adapter.sent, [
    { name: "CheckoutIntent", params: { product: "gf", offer: "main", cta_position: "hero" }, eventId: id },
  ]);
});

test("measurement is on by default: events reach a gated adapter before any decision", () => {
  assert.deepEqual(DEFAULT_CHOICE, { analytics: true, marketing: true });
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  const first = track("PageView");
  const second = track("ViewContent", { content_ids: "gf" });
  assert.deepEqual(
    adapter.sent.map((event) => event.eventId),
    [first, second],
  );
  assert.deepEqual(adapter.sent[1]?.params, { content_ids: "gf" });
});

test("rejecting revokes the adapter, drops its queue and stops every later event", () => {
  const adapter = fakeAdapter({ ready: false });
  _resetForTests([adapter]);
  track("PageView");
  const state = writeConsent({ analytics: false, marketing: false });
  assert.deepEqual(adapter.consents, [state]);
  adapter.ready = true;
  flush();
  track("ViewContent");
  assert.equal(adapter.sent.length, 0);
  writeConsent({ analytics: false, marketing: true });
  assert.equal(adapter.sent.length, 0);
  const id = track("CheckoutIntent");
  assert.deepEqual(
    adapter.sent.map((event) => event.eventId),
    [id],
  );
});

test("events stay queued while the vendor script is not ready and flush once it is", () => {
  const adapter = fakeAdapter({ ready: false });
  _resetForTests([adapter]);
  writeConsent({ analytics: false, marketing: true });
  const id = track("PageView");
  assert.equal(adapter.sent.length, 0);
  adapter.ready = true;
  flush();
  assert.deepEqual(
    adapter.sent.map((event) => event.eventId),
    [id],
  );
  flush();
  assert.equal(adapter.sent.length, 1);
});

test("an adapter in category none ignores a rejection", () => {
  const adapter = fakeAdapter({ category: "none" });
  _resetForTests([adapter]);
  writeConsent({ analytics: false, marketing: false });
  track("PageView");
  assert.equal(adapter.sent.length, 1);
});

test("consent v2 cookie format and re-prompt on version bump", () => {
  assert.equal(CONSENT_VERSION, 2);
  assert.equal(serializeConsentCookie({ analytics: false, marketing: true }), "a0m1.v2");
  assert.equal(serializeConsentCookie({ analytics: true, marketing: false }), "a1m0.v2");
  window.localStorage.setItem("pv_consent", JSON.stringify({ version: 1, marketing: true }));
  assert.equal(readConsent(), null);
  writeConsent({ analytics: true, marketing: true });
  assert.match(document.cookie, /^pv_consent=a1m1\.v2; /);
  assert.equal(readConsent()?.marketing, true);
});

test("meta adapter inits active, revokes on rejection (expiring _fbp/_fbc) and passes eventID", () => {
  const adapter = createMetaAdapter("1234567890123456");
  assert.equal(adapter.enabled, true);
  assert.equal(createMetaAdapter("").enabled, false);
  const [bootstrap, loader] = adapter.scripts();
  assert.ok(bootstrap?.inline && loader);
  assert.ok(bootstrap.inline.includes("fbq('init',\"1234567890123456\")"));
  assert.equal(bootstrap.inline.includes("revoke"), false);
  assert.equal(loader.src, "https://connect.facebook.net/en_US/fbevents.js");

  const calls: unknown[][] = [];
  const cookieWrites: string[] = [];
  setGlobal(globalThis, "document", {
    get cookie() {
      return "";
    },
    set cookie(value: string) {
      cookieWrites.push(value);
    },
  });
  setGlobal(window, "location", { hostname: "www.pequeverso.com" });
  window.fbq = (...args: unknown[]) => void calls.push(args);
  assert.ok(adapter.send({ name: "PageView", params: {}, eventId: "id-1" }));
  assert.ok(adapter.send({ name: "CheckoutIntent", params: { offer: "main" }, eventId: "id-2" }));
  adapter.onConsent({ version: 2, analytics: false, marketing: false, updatedAt: "" });
  adapter.onConsent({ version: 2, analytics: false, marketing: true, updatedAt: "" });
  assert.deepEqual(calls, [
    ["track", "PageView", {}, { eventID: "id-1" }],
    ["trackCustom", "CheckoutIntent", { offer: "main" }, { eventID: "id-2" }],
    ["consent", "revoke"],
    ["consent", "grant"],
  ]);
  assert.deepEqual(cookieWrites, [
    "_fbp=; Max-Age=0; Path=/",
    "_fbp=; Max-Age=0; Path=/; Domain=www.pequeverso.com",
    "_fbp=; Max-Age=0; Path=/; Domain=pequeverso.com",
    "_fbc=; Max-Age=0; Path=/",
    "_fbc=; Max-Age=0; Path=/; Domain=www.pequeverso.com",
    "_fbc=; Max-Age=0; Path=/; Domain=pequeverso.com",
  ]);
  delete window.fbq;
  assert.equal(adapter.send({ name: "PageView", params: {}, eventId: "id-3" }), false);
});

function installCapiPage({ href = "https://pequeverso.com/grafismo-fonetico/", cookie = "" } = {}) {
  setGlobal(window, "location", { href, search: new URL(href).search });
  // biome-ignore lint/suspicious/noDocumentCookie: fake document in the unit-test window
  document.cookie = cookie;
  const requests: CapiRequest[] = [];
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    requests.push({ url: String(url), init: init ?? {}, body: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 202 });
  };
  return { requests, fetchImpl };
}

function firstRequest(requests: readonly CapiRequest[]): CapiRequest {
  const [request] = requests;
  assert.ok(request, "no relay request was sent");
  return request;
}

function firstEvent(requests: readonly CapiRequest[]): RelayedEvent {
  const [event] = firstRequest(requests).body.events;
  assert.ok(event, "the relay request carried no event");
  return event;
}

const tick = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

test("meta-capi adapter relays batched events with the pixel's event ids, _fbp and _fbc", async () => {
  const page = installCapiPage({ cookie: "_fbp=fb.1.1700000000000.123; _fbc=fb.1.1700000000000.click" });
  const pixel = createMetaAdapter("1234567890123456");
  const capi = createMetaCapiAdapter("1234567890123456", {
    fetch: page.fetchImpl,
    flushDelayMs: 5,
    now: () => 42,
  });
  assert.equal(capi.enabled, true);
  assert.equal(createMetaCapiAdapter("").enabled, false);
  assert.deepEqual(capi.scripts(), []);
  assert.equal(capi.label, pixel.label);
  const fbqCalls: unknown[][] = [];
  window.fbq = (...args: unknown[]) => void fbqCalls.push(args);
  _resetForTests([pixel, capi]);
  const first = track("PageView");
  const second = track("ViewContent", { content_ids: "gf", value: 19.9, currency: "USD" });
  assert.equal(page.requests.length, 0);
  await tick(20);
  assert.equal(page.requests.length, 1);
  const [request] = page.requests;
  assert.ok(request);
  assert.equal(request.url, META_CAPI_ENDPOINT);
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.keepalive, true);
  assert.equal(request.init.credentials, "same-origin");
  assert.deepEqual(request.body, {
    events: [
      {
        name: "PageView",
        eventId: first,
        time: 42,
        sourceUrl: window.location.href,
        params: {},
        fbp: "fb.1.1700000000000.123",
        fbc: "fb.1.1700000000000.click",
      },
      {
        name: "ViewContent",
        eventId: second,
        time: 42,
        sourceUrl: window.location.href,
        params: { content_ids: "gf", value: 19.9, currency: "USD" },
        fbp: "fb.1.1700000000000.123",
        fbc: "fb.1.1700000000000.click",
      },
    ],
  });
  assert.deepEqual(
    fbqCalls.map((call) => (call[3] as { eventID?: string } | undefined)?.eventID),
    [first, second],
  );
  delete window.fbq;
});

test("meta-capi adapter derives fbc from ?fbclid when the cookie is missing and omits absent ids", async () => {
  const page = installCapiPage({
    href: "https://pequeverso.com/?fbclid=IwAR2abc_def-ghi",
    cookie: "_fbp=fb.1.1.x",
  });
  const capi = createMetaCapiAdapter("1234567890123456", {
    fetch: page.fetchImpl,
    flushDelayMs: 5,
    now: () => 1700,
  });
  _resetForTests([capi]);
  track("PageView");
  await tick(20);
  assert.equal(firstEvent(page.requests).fbp, "fb.1.1.x");
  assert.equal(firstEvent(page.requests).fbc, "fb.1.1700.IwAR2abc_def-ghi");

  const bare = installCapiPage();
  const capi2 = createMetaCapiAdapter("1234567890123456", {
    fetch: bare.fetchImpl,
    flushDelayMs: 5,
    fbpWaitMs: 0,
  });
  _resetForTests([capi2]);
  track("PageView");
  await tick(20);
  assert.equal("fbp" in firstEvent(bare.requests), false);
  assert.equal("fbc" in firstEvent(bare.requests), false);
});

test("meta-capi adapter sends nothing after Rechazar: buffered events dropped, later events never relayed", async () => {
  const page = installCapiPage();
  const capi = createMetaCapiAdapter("1234567890123456", {
    fetch: page.fetchImpl,
    flushDelayMs: 5,
    fbpWaitMs: 0,
  });
  _resetForTests([capi]);
  track("PageView");
  writeConsent({ analytics: false, marketing: false });
  await tick(20);
  assert.equal(page.requests.length, 0);
  track("CheckoutIntent", { product: "gf", offer: "main", cta_position: "hero" });
  await tick(20);
  assert.equal(page.requests.length, 0);
  writeConsent({ analytics: false, marketing: true });
  const id = track("PageView");
  await tick(20);
  assert.deepEqual(
    page.requests.map((r) => r.body.events.map((e) => e.eventId)),
    [[id]],
  );
});

test("meta-capi adapter flushes on pagehide with sendBeacon when available", async () => {
  const page = installCapiPage();
  const beacons: Array<{ url: string; type: string }> = [];
  navigator.sendBeacon = (url, blob) => {
    beacons.push({ url: String(url), type: blob instanceof Blob ? blob.type : "" });
    return true;
  };
  try {
    const capi = createMetaCapiAdapter("1234567890123456", { fetch: page.fetchImpl, flushDelayMs: 1000 });
    _resetForTests([capi]);
    track("PageView");
    window.dispatchEvent(new Event("pagehide"));
    assert.deepEqual(beacons, [{ url: META_CAPI_ENDPOINT, type: "application/json" }]);
    await tick(20);
    assert.equal(page.requests.length, 0);
  } finally {
    Reflect.deleteProperty(navigator, "sendBeacon");
  }
});

test("meta-capi adapter waits briefly for fbevents.js to write _fbp, then relays with it", async () => {
  const page = installCapiPage();
  const capi = createMetaCapiAdapter("1234567890123456", {
    fetch: page.fetchImpl,
    flushDelayMs: 5,
    fbpWaitMs: 200,
  });
  _resetForTests([capi]);
  const id = track("PageView");
  await tick(30);
  assert.equal(page.requests.length, 0, "held back while _fbp is missing");
  // biome-ignore lint/suspicious/noDocumentCookie: fake document in the unit-test window
  document.cookie = "_fbp=fb.1.1.late";
  await tick(30);
  assert.equal(page.requests.length, 1);
  assert.deepEqual(
    firstRequest(page.requests).body.events.map((e) => [e.eventId, e.fbp]),
    [[id, "fb.1.1.late"]],
  );

  const never = installCapiPage();
  const capi2 = createMetaCapiAdapter("1234567890123456", {
    fetch: never.fetchImpl,
    flushDelayMs: 5,
    fbpWaitMs: 40,
  });
  _resetForTests([capi2]);
  track("PageView");
  await tick(100);
  assert.equal(never.requests.length, 1, "sent without fbp once the wait expires");
  assert.equal("fbp" in firstEvent(never.requests), false);
});
