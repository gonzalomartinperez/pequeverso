import assert from "node:assert/strict";
import { test } from "node:test";
import { below, breakpoints } from "../../src/lib/breakpoints.ts";

test("breakpoints match the documented scale and ascend", () => {
  assert.deepEqual(breakpoints, { sm: 640, md: 768, lg: 1024, xl: 1280 });
  const values = Object.values(breakpoints);
  assert.deepEqual(
    values,
    [...values].sort((a, b) => a - b),
  );
});

test("below() builds an exclusive max-width query", () => {
  assert.equal(below("lg"), "(max-width: 1023px)");
  assert.equal(below("sm"), "(max-width: 639px)");
});
