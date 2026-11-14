import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { formatUsd } from "../../../config/commerce.ts";
import { numRuns, seed } from "./runs.ts";

test("non-negative USD amounts use a decimal comma and round trip at cent precision", () => {
  // Monetary amounts: finite values below toFixed's exponential-notation threshold.
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 100_000_000 }), (cents) => {
      const formatted = formatUsd(cents / 100);
      assert.match(formatted, /^US\$\d+,\d{2}$/);
      assert.ok(!formatted.includes("."));
      assert.equal(Math.round(Number(formatted.slice(3).replace(",", ".")) * 100), cents);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

test("fractional cents round within half a cent", () => {
  fc.assert(
    fc.property(fc.double({ min: 0, max: 1_000_000, noNaN: true }), (amount) => {
      const formatted = formatUsd(amount);
      assert.match(formatted, /^US\$\d+,\d{2}$/);
      const parsed = Number(formatted.slice(3).replace(",", "."));
      assert.ok(Math.abs(parsed - amount) <= 0.005 + 1e-9);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});
