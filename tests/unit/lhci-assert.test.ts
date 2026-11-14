import assert from "node:assert/strict";
import { test } from "node:test";
import { assertRatchet, type Lhr, median } from "../../tools/lhci-assert.ts";
import type { RatchetValue } from "../../tools/scorecard/ratchets.ts";

const run = (lcp: number, tbt: number, cls: number, scriptBytes: number, perf: number): Lhr => ({
  categories: { performance: { score: perf } },
  audits: {
    "largest-contentful-paint": { numericValue: lcp },
    "total-blocking-time": { numericValue: tbt },
    "cumulative-layout-shift": { numericValue: cls },
    "resource-summary": {
      details: { items: [{ resourceType: "script", transferSize: scriptBytes }] },
    },
  },
});
const ratchet: RatchetValue[] = [
  { key: "/ lcp", value: 3000, unit: "ms", direction: "max" },
  { key: "/ tbt", value: 400, unit: "ms", direction: "max" },
  { key: "/ cls", value: 0, unit: "", direction: "max" },
  { key: "/ js-kb", value: 200, unit: "KB", direction: "max" },
  { key: "/ performance", value: 60, unit: "score", direction: "min" },
  { key: "/other/ lcp", value: 1, unit: "ms", direction: "max" },
];

test("a median at or under the ratchet passes and uncollected paths are skipped", () => {
  const runs = new Map([
    [
      "/",
      [
        run(3000, 400, 0, 200_000, 0.6),
        run(2000, 100, 0, 100_000, 0.9),
        run(9000, 900, 0.5, 900_000, 0.1),
      ],
    ],
  ]);
  const { failures, checked } = assertRatchet(ratchet, runs);
  assert.deepEqual(failures, []);
  assert.equal(checked, 5);
});

test("a seeded value above the ceiling or under the floor fails", () => {
  const bad = run(3500, 450, 0.05, 250_000, 0.5);
  const { failures } = assertRatchet(ratchet, new Map([["/", [bad, bad, bad]]]));
  assert.deepEqual(failures.map((f) => f.key).sort(), [
    "/ cls",
    "/ js-kb",
    "/ lcp",
    "/ performance",
    "/ tbt",
  ]);
});

test("tolerance widens the limit and seconds convert from milliseconds", () => {
  const live: RatchetValue[] = [{ key: "/ lcp", value: 4.4, unit: "s", direction: "max" }];
  const runs = new Map([["/", [run(4800, 0, 0, 0, 1)]]]);
  assert.equal(assertRatchet(live, runs).failures.length, 1);
  assert.equal(assertRatchet(live, runs, 0.15).failures.length, 0);
});

test("median handles odd and even counts", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});
