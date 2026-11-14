import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { tileOrder } from "../../../src/features/playground/domain/syllable-game.ts";
import { numRuns, seed } from "./runs.ts";

test("tile shuffle is a deterministic permutation preserving repeated syllables", () => {
  fc.assert(
    fc.property(fc.array(fc.string(), { maxLength: 80 }), fc.string(), (items, key) => {
      const order = tileOrder(items.length, key);
      const identity = items.map((_, index) => index);
      assert.deepEqual(
        [...order].sort((a, b) => a - b),
        identity,
      );
      assert.deepEqual(order.map((index) => items[index]).sort(), [...items].sort());
      assert.deepEqual(tileOrder(items.length, key), order);
      if (items.length > 2) assert.notDeepEqual(order, identity);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});
