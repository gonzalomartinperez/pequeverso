import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createMetaAdapter } from "../../src/features/tracking/adapters/meta.ts";
import { createUmamiAdapter } from "../../src/features/tracking/adapters/umami.ts";
import {
  CONSENT_VERSION,
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

test("every event gets a UUID id and is mirrored to dataLayer before any adapter", () => {
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  const id = trackCheckoutIntent({ product: "gf", offer: "main", position: "hero", offerMode: undefined });
  assert.match(id, UUID);
  assert.deepEqual(window.dataLayer, [
    { event: "CheckoutIntent", event_id: id, product: "gf", offer: "main", cta_position: "hero" },
  ]);
  assert.deepEqual(adapter.sent, []);
});

test("gated adapter queues until its category is granted, then flushes in order", () => {
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  const first = track("PageView");
  const second = track("ViewContent", { content_ids: "gf" });
  assert.deepEqual(adapter.sent, []);
  const state = writeConsent({ analytics: false, marketing: true });
  assert.deepEqual(adapter.consents, [state]);
  assert.deepEqual(
    adapter.sent.map((event) => event.eventId),
    [first, second],
  );
  assert.deepEqual(adapter.sent[1].params, { content_ids: "gf" });
});

test("rejecting drops the queue and events raised while rejected are never replayed", () => {
  const adapter = fakeAdapter();
  _resetForTests([adapter]);
  track("PageView");
  writeConsent({ analytics: false, marketing: false });
  track("ViewContent");
  assert.deepEqual(adapter.sent, []);
  writeConsent({ analytics: false, marketing: true });
  assert.deepEqual(adapter.sent, []);
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

test("an adapter in category none receives events without consent", () => {
  const adapter = fakeAdapter({ id: "umami", category: "none" });
  _resetForTests([adapter]);
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

test("meta adapter revokes before init only in advanced mode and passes eventID", () => {
  const adapter = createMetaAdapter("1234567890123456");
  assert.equal(adapter.enabled, true);
  assert.equal(createMetaAdapter("").enabled, false);
  const [advanced] = adapter.scripts("advanced");
  const [strict, loader] = adapter.scripts("strict");
  assert.ok(advanced.inline.indexOf("fbq('consent','revoke')") < advanced.inline.indexOf("fbq('init'"));
  assert.equal(strict.inline.includes("revoke"), false);
  assert.equal(loader.src, "https://connect.facebook.net/en_US/fbevents.js");

  const calls = [];
  window.fbq = (...args) => calls.push(args);
  adapter.onConsent({ version: 2, analytics: false, marketing: true, updatedAt: "" });
  assert.ok(adapter.send({ name: "PageView", params: {}, eventId: "id-1" }));
  assert.ok(adapter.send({ name: "CheckoutIntent", params: { offer: "main" }, eventId: "id-2" }));
  assert.deepEqual(calls, [
    ["consent", "grant"],
    ["track", "PageView", {}, { eventID: "id-1" }],
    ["trackCustom", "CheckoutIntent", { offer: "main" }, { eventID: "id-2" }],
  ]);
  window.fbq = undefined;
  assert.equal(adapter.send({ name: "PageView", params: {}, eventId: "id-3" }), false);
});

test("umami adapter needs both variables, no consent, and skips auto-tracked page views", () => {
  assert.equal(createUmamiAdapter("https://a.example/script.js", "").enabled, false);
  const adapter = createUmamiAdapter("https://a.example/script.js", "site-1");
  assert.equal(adapter.category, "none");
  assert.deepEqual(adapter.scripts("strict"), [
    {
      id: "umami",
      src: "https://a.example/script.js",
      strategy: "lazyOnload",
      attributes: { "data-website-id": "site-1" },
    },
  ]);
  const calls = [];
  window.umami = { track: (...args) => calls.push(args) };
  assert.ok(adapter.send({ name: "PageView", params: {}, eventId: "id-1" }));
  assert.ok(adapter.send({ name: "CheckoutIntent", params: { offer: "main" }, eventId: "id-2" }));
  assert.deepEqual(calls, [["CheckoutIntent", { offer: "main", event_id: "id-2" }]]);
});
