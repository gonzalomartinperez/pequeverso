import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutPassthroughParams, formatUsd, guaranteeDays, products } from "../../config/commerce.ts";

test("documented composition and prices (README 2026-08-04)", () => {
  assert.equal(products.grafismoFonetico.pdfCount, 9);
  assert.equal(products.grafismoFonetico.pageCount, 414);
  assert.equal(products.grafismoFonetico.price, 14.99);
  assert.equal(products.imprimeYJuega.pdfCount, 6);
  assert.equal(products.imprimeYJuega.pageCount, 384);
  assert.equal(products.imprimeYJuega.upsellPrice, 14.99);
  assert.equal(products.imprimeYJuega.downsellPrice, 7.49);
  assert.equal(guaranteeDays, 7);
});

test("USD formatting matches the landings", () => {
  assert.equal(formatUsd(14.99), "US$14.99");
  assert.equal(formatUsd(7.49), "US$7.49");
});

test("off and ref are not in the passthrough allowlist", () => {
  assert.ok(!checkoutPassthroughParams.includes("off"));
  assert.ok(!checkoutPassthroughParams.includes("ref"));
});
