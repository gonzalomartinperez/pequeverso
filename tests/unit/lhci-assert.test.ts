import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertRatchet,
  type Lhr,
  median,
  parseKey,
  suggestRatchet,
} from "../../tools/lhci-assert.ts";
import type { RatchetValue } from "../../tools/scorecard/ratchets.ts";
import { loadRatchets } from "../../tools/scorecard/ratchets.ts";

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

test("a median at or under the ratchet passes; an uncollected route fails in strict mode", () => {
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
  assert.deepEqual(
    failures.map((f) => f.key),
    ["/other/ lcp"],
  );
  assert.equal(checked, 5);
  const lenient = assertRatchet(ratchet, runs, { allowMissingPaths: true });
  assert.deepEqual(lenient.failures, []);
});

test("a seeded value above the ceiling or under the floor fails", () => {
  const bad = run(3500, 450, 0.05, 250_000, 0.5);
  const { failures } = assertRatchet(ratchet.slice(0, 5), new Map([["/", [bad, bad, bad]]]));
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
  assert.equal(assertRatchet(live, runs, { tolerance: 0.15 }).failures.length, 0);
});

test("median handles odd and even counts", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

const three = [
  run(1000, 100, 0, 100_000, 0.9),
  run(1000, 100, 0, 100_000, 0.9),
  run(1, 1, 0, 1, 1),
];
const keysOf = (r: { failures: { key: string }[] }) => r.failures.map((f) => f.key).sort();

test("a route with fewer runs than expected fails", () => {
  const some = assertRatchet(ratchet.slice(0, 5), new Map([["/", three.slice(0, 2)]]), {
    expectedRuns: 3,
  });
  assert.ok(keysOf(some).length > 0);
  assert.equal(
    assertRatchet(ratchet.slice(0, 5), new Map([["/", three]]), { expectedRuns: 3 }).failures
      .length,
    0,
  );
});

test("a metric absent from every run, or from only some runs, fails", () => {
  const noJs: Lhr = { categories: {}, audits: { "largest-contentful-paint": { numericValue: 1 } } };
  const all = assertRatchet([ratchet[3] as RatchetValue], new Map([["/", [noJs, noJs, noJs]]]));
  assert.deepEqual(keysOf(all), ["/ js-kb"]);
  const mixed = assertRatchet(
    [ratchet[3] as RatchetValue],
    new Map([["/", [noJs, three[0] as Lhr, three[1] as Lhr]]]),
  );
  assert.deepEqual(keysOf(mixed), ["/ js-kb"]);
});

test("a run with a runtimeError, or a non-finite value, fails", () => {
  const broken = { ...(three[0] as Lhr), runtimeError: { code: "PROTOCOL_TIMEOUT", message: "x" } };
  const withError = assertRatchet(
    ratchet.slice(0, 5),
    new Map([["/", [broken, three[1] as Lhr, three[2] as Lhr]]]),
  );
  assert.ok(withError.failures.length > 0);
  const nan = run(Number.NaN, 100, 0, 100_000, 0.9);
  assert.deepEqual(
    keysOf(assertRatchet([ratchet[0] as RatchetValue], new Map([["/", [nan, nan, nan]]]))),
    ["/ lcp"],
  );
});

test("an unknown metric or a malformed key throws", () => {
  assert.throws(() =>
    assertRatchet([{ key: "/ lpc", value: 1, unit: "s", direction: "max" }], new Map()),
  );
  assert.throws(() => parseKey("lcp"));
  assert.throws(() => parseKey("/ lcp extra"));
  assert.deepEqual(parseKey("/a/ lcp"), { pathname: "/a/", metric: "lcp" });
});

test("a NaN, negative or too large tolerance throws", () => {
  const runs = new Map([["/", three]]);
  for (const tolerance of [Number.NaN, -0.1, 0.9])
    assert.throws(() => assertRatchet(ratchet.slice(0, 1), runs, { tolerance }));
});

test("every key of both committed lighthouse ratchets parses", () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "ratchets");
  const files = loadRatchets(dir).filter((r) => r.metric.startsWith("lighthouse"));
  assert.equal(files.length, 2);
  for (const file of files) for (const item of file.values) parseKey(item.key);
});

test("suggest only tightens, with headroom, flooring minimums", () => {
  const current: RatchetValue[] = [
    { key: "/ lcp", value: 3, unit: "s", direction: "max" },
    { key: "/ tbt", value: 1, unit: "s", direction: "max" },
    { key: "/ performance", value: 50, unit: "score", direction: "min" },
    { key: "/ cls", value: 0, unit: "", direction: "max" },
  ];
  const runs = new Map([["/", [run(2000, 1500, 0.2, 1, 0.8), run(2000, 1500, 0.2, 1, 0.8)]]]);
  const out = suggestRatchet(current, runs, 0.1);
  const byKey = Object.fromEntries(out.map((v) => [v.key, v.value]));
  assert.equal(byKey["/ lcp"], 2.2);
  assert.equal(byKey["/ tbt"], 1);
  assert.equal(byKey["/ performance"], 72);
  assert.equal(byKey["/ cls"], 0);
});

test("the CLI exits 1 on a missing route, 0 when complete, 2 on bad tolerance", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lhci-assert-"));
  try {
    const lhr = path.join(dir, "a.json");
    writeFileSync(lhr, JSON.stringify(run(1000, 100, 0, 100_000, 0.9)));
    writeFileSync(
      path.join(dir, "manifest.json"),
      JSON.stringify([{ url: "http://localhost:3000/", jsonPath: lhr }]),
    );
    const ratchetFile = path.join(dir, "r.json");
    const body = (values: RatchetValue[]) => JSON.stringify({ values });
    const tool = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "tools",
      "lhci-assert.ts",
    );
    const cli = (...args: string[]) =>
      spawnSync("node", [tool, ratchetFile, `--dir=${dir}`, "--runs=1", ...args], {
        encoding: "utf8",
      }).status;
    writeFileSync(ratchetFile, body(ratchet.slice(0, 2)));
    assert.equal(cli(), 0);
    writeFileSync(ratchetFile, body(ratchet));
    assert.equal(cli(), 1);
    assert.equal(cli("--allow-missing-paths"), 0);
    assert.equal(cli("--tolerance=2"), 2);
    assert.equal(cli("--tolerance=abc"), 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
