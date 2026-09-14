import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCheckoutUrl,
  isAllowedParam,
  sckFor,
  withPassthrough,
} from "../../src/features/commerce/checkout-url.ts";

const base = "https://pay.hotmart.com/D106959604R?checkoutMode=10";

test("forwards allowlisted acquisition params and keeps checkoutMode", () => {
  const url = new URL(buildCheckoutUrl(base, "?utm_source=tiktok&utm_medium=social&a=aff1&sck=pv-gf-hero"));
  assert.equal(url.searchParams.get("checkoutMode"), "10");
  assert.equal(url.searchParams.get("utm_source"), "tiktok");
  assert.equal(url.searchParams.get("a"), "aff1");
  assert.equal(url.searchParams.get("sck"), "pv-gf-hero");
});

test("never forwards off or ref (visitor-controlled offer selection)", () => {
  const url = new URL(buildCheckoutUrl(base, "?off=abc123&ref=someone&utm_campaign=x"));
  assert.equal(url.searchParams.has("off"), false);
  assert.equal(url.searchParams.has("ref"), false);
  assert.equal(url.searchParams.get("utm_campaign"), "x");
  assert.equal(isAllowedParam("off"), false);
  assert.equal(isAllowedParam("UTM_TERM"), true);
});

test("extra params are added only when absent", () => {
  const url = new URL(buildCheckoutUrl(base, "?sck=keep", { sck: "pv-gf-final" }));
  assert.equal(url.searchParams.get("sck"), "keep");
  const url2 = new URL(buildCheckoutUrl(base, "", { sck: "pv-gf-final" }));
  assert.equal(url2.searchParams.get("sck"), "pv-gf-final");
});

test("empty base yields empty string (public clone without checkout URL)", () => {
  assert.equal(buildCheckoutUrl("", "?utm_source=x"), "");
});

test("internal passthrough keeps only allowlisted params", () => {
  assert.equal(
    withPassthrough("/grafismo-fonetico/", "?utm_source=ig&foo=bar&off=1"),
    "/grafismo-fonetico/?utm_source=ig",
  );
  assert.equal(withPassthrough("/grafismo-fonetico/", ""), "/grafismo-fonetico/");
});

test("sck carries the product prefix, is sanitized and capped at 30 characters", () => {
  assert.equal(sckFor("gf", "hero"), "pv-gf-hero");
  assert.equal(sckFor("gf", "he ro!"), "pv-gf-hero");
  assert.ok(sckFor("gf", "a-very-long-position-name-that-exceeds").length <= 30);
});
