import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutPassthroughParams, currency, formatUsd, guaranteeDays } from "../../config/commerce.ts";

test("shared commercial facts (guarantee and currency)", () => {
  assert.equal(guaranteeDays, 7);
  assert.equal(currency, "USD");
});

test("USD formatting matches the landings", () => {
  assert.equal(formatUsd(14.99), "US$14.99");
  assert.equal(formatUsd(7.49), "US$7.49");
});

test("off and ref are not in the passthrough allowlist", () => {
  assert.ok(!checkoutPassthroughParams.includes("off"));
  assert.ok(!checkoutPassthroughParams.includes("ref"));
});
