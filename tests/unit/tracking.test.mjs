import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createMetaAdapter } from "../../src/features/tracking/adapters/meta.ts";
import { createMetaCapiAdapter, META_CAPI_ENDPOINT } from "../../src/features/tracking/adapters/meta-capi.ts";
import {
  CONSENT_VERSION,
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

function installWindow() {
  const storage = new Map();
  const win = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  });
  globalThis.window = win;
  globalThis.document = { cookie: "" };
  return win;
}

function fakeAdapter(overrides = {}) {
  const adapter = {
    id: "meta",
    label: "Fake",
    category: "marketing",
    enabled: true,
    ready: true,
    sent: [],
    consents: [],
    scripts: () => [],
    onConsent(state) {
      adapter.consents.push(state);
    },
    send(event) {
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
  process.env.NODE_ENV = "development";
  _resetForTests([]);
});

test("forbidden events throw in development and are dropped in production", () => {
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  writeConsent({ analytics: false, marketing: true });
  for (const name of FORBIDDEN_EVENTS) assert.throws(() => track(name), /owned by Hotmart/);
  process.env.NODE_ENV = "production";
  for (const name of FORBIDDEN_EVENTS) assert.equal(track(name), "");
  assert.equal(window.dataLayer, undefined);
  assert.deepEqual(adapter.sent, []);
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
  assert.deepEqual(adapter.sent[1].params, { content_ids: "gf" });
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
  assert.deepEqual(adapter.sent, []);
  writeConsent({ analytics: false, marketing: true });
  assert.deepEqual(adapter.sent, []);
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
  assert.deepEqual(adapter.sent, []);
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
  assert.ok(bootstrap.inline.includes("fbq('init',\"1234567890123456\")"));
  assert.equal(bootstrap.inline.includes("revoke"), false);
  assert.equal(loader.src, "https://connect.facebook.net/en_US/fbevents.js");

  const calls = [];
  const cookieWrites = [];
  globalThis.document = {
    get cookie() {
      return "";
    },
    set cookie(value) {
      cookieWrites.push(value);
    },
  };
  window.location = { hostname: "www.pequeverso.com" };
  window.fbq = (...args) => calls.push(args);
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
  window.fbq = undefined;
  assert.equal(adapter.send({ name: "PageView", params: {}, eventId: "id-3" }), false);
});

function installCapiPage({ href = "https://pequeverso.com/grafismo-fonetico/", cookie = "" } = {}) {
  window.location = { href, search: new URL(href).search };
  // biome-ignore lint/suspicious/noDocumentCookie: fake document in the unit-test window
  document.cookie = cookie;
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init, body: JSON.parse(init.body) });
    return new Response(null, { status: 202 });
  };
  return { requests, fetchImpl };
}

const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const fbqCalls = [];
  window.fbq = (...args) => fbqCalls.push(args);
  _resetForTests([pixel, capi]);
  const first = track("PageView");
  const second = track("ViewContent", { content_ids: "gf", value: 19.9, currency: "USD" });
  assert.deepEqual(page.requests, []);
  await tick(20);
  assert.equal(page.requests.length, 1);
  const [request] = page.requests;
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
    fbqCalls.map((call) => call[3].eventID),
    [first, second],
  );
  window.fbq = undefined;
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
  assert.equal(page.requests[0].body.events[0].fbp, "fb.1.1.x");
  assert.equal(page.requests[0].body.events[0].fbc, "fb.1.1700.IwAR2abc_def-ghi");

  const bare = installCapiPage();
  const capi2 = createMetaCapiAdapter("1234567890123456", {
    fetch: bare.fetchImpl,
    flushDelayMs: 5,
    fbpWaitMs: 0,
  });
  _resetForTests([capi2]);
  track("PageView");
  await tick(20);
  assert.equal("fbp" in bare.requests[0].body.events[0], false);
  assert.equal("fbc" in bare.requests[0].body.events[0], false);
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
  assert.deepEqual(page.requests, []);
  track("CheckoutIntent", { product: "gf", offer: "main", cta_position: "hero" });
  await tick(20);
  assert.deepEqual(page.requests, []);
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
  const beacons = [];
  navigator.sendBeacon = (url, blob) => {
    beacons.push({ url, type: blob.type });
    return true;
  };
  try {
    const capi = createMetaCapiAdapter("1234567890123456", { fetch: page.fetchImpl, flushDelayMs: 1000 });
    _resetForTests([capi]);
    track("PageView");
    window.dispatchEvent(new Event("pagehide"));
    assert.deepEqual(beacons, [{ url: META_CAPI_ENDPOINT, type: "application/json" }]);
    await tick(20);
    assert.deepEqual(page.requests, []);
  } finally {
    delete navigator.sendBeacon;
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
  assert.deepEqual(page.requests, [], "held back while _fbp is missing");
  // biome-ignore lint/suspicious/noDocumentCookie: fake document in the unit-test window
  document.cookie = "_fbp=fb.1.1.late";
  await tick(30);
  assert.equal(page.requests.length, 1);
  assert.deepEqual(
    page.requests[0].body.events.map((e) => [e.eventId, e.fbp]),
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
  assert.equal("fbp" in never.requests[0].body.events[0], false);
});
