import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadRatchets, type Ratchet } from "../../tools/scorecard/ratchets.ts";
import {
  buildScorecard,
  bundleMeasurements,
  lighthouseMeasurements,
  parseLcov,
  regressions,
  repoSizeMeasurements,
} from "../../tools/scorecard/scorecard.ts";

const root = path.resolve(import.meta.dirname, "../..");
const fixtures = path.join(root, "tests/unit/fixtures/scorecard");
const meta = { generatedAt: "2026-11-14T00:00:00.000Z", commit: "abc1234" };
const fixture = (name: string, file: string): string =>
  readFileSync(path.join(fixtures, name, file), "utf8");

const ratchet = (metric: string, values: Ratchet["values"]): Ratchet => ({
  metric,
  measuredAt: "2026-11-14",
  commit: "abc1234",
  source: "test",
  values,
});
const ratchets = [
  ratchet("coverage", [
    { key: "lines", value: 95, unit: "%", direction: "min" },
    { key: "branches", value: 88, unit: "%", direction: "min" },
  ]),
  ratchet("bundle", [
    { key: "/ js", value: 160, unit: "KB gzip", direction: "max" },
    { key: "/ html", value: 50, unit: "KB gzip", direction: "max" },
  ]),
  ratchet("lighthouse", [{ key: "/ performance", value: 55, unit: "score", direction: "min" }]),
];
const measure = (name: string) => ({
  coverage: parseLcov(fixture(name, "coverage/lcov.info")),
  bundle: bundleMeasurements(JSON.parse(fixture(name, "bundle.json"))),
});

test("parseLcov sums lines, branches and functions across files", () => {
  assert.deepEqual(parseLcov(fixture("pass", "coverage/lcov.info")), {
    lines: 98,
    branches: 90,
    functions: 90,
  });
  assert.deepEqual(parseLcov(""), {});
});

test("a pass case reports pass for measured metrics and missing for absent inputs", () => {
  const card = buildScorecard(ratchets, measure("pass"), meta);
  assert.deepEqual(card.summary, { pass: 4, fail: 0, missing: 1 });
  assert.equal(card.metrics.lighthouse?.[0]?.status, "missing");
  assert.equal(card.metrics.lighthouse?.[0]?.measured, null);
  assert.deepEqual(regressions(card), []);
});

test("a seeded drop (coverage below the floor, bundle above the ceiling) fails", () => {
  const card = buildScorecard(ratchets, measure("drop"), meta);
  assert.equal(card.summary.fail, 2);
  const lines = regressions(card);
  assert.match(lines.join("\n"), /coverage: lines is 84.5 %, floor 95/);
  assert.match(lines.join("\n"), /bundle: \/ js is 181.2 KB gzip, ceiling 160/);
});

test("a measurement equal to the baseline holds", () => {
  const card = buildScorecard(ratchets, { bundle: { "/ js": 160 } }, meta);
  assert.equal(card.metrics.bundle?.[0]?.status, "pass");
});

test("lighthouse medians map onto ratchet keys with seconds and 0-100 scores", () => {
  assert.deepEqual(
    lighthouseMeasurements([{ path: "/", performance: 0.554, lcp: 4423, tbt: 2051, cls: 0 }]),
    { "/ performance": 55, "/ lcp": 4.4, "/ tbt": 2.1, "/ cls": 0 },
  );
});

test("repo size sums tracked bytes, finds the largest file and the public/media total", () => {
  assert.deepEqual(
    repoSizeMeasurements([
      { path: "a.ts", size: 10 },
      { path: "public/media/x.png", size: 30 },
      { path: "public/media/y.png", size: 5 },
    ]),
    { "tracked bytes": 45, "largest tracked file": 30, "public/media": 35 },
  );
});

test("axes list their inputs; judgement axes are marked evaluator and not computed", () => {
  const card = buildScorecard(ratchets, measure("drop"), meta);
  assert.equal(card.axes.D3?.status, "fail");
  assert.deepEqual(card.axes.D6?.inputs, ["bundle", "lighthouse"]);
  assert.equal(card.axes.P6?.status, "evaluator");
  assert.equal(card.axes.D1?.status, "unmeasured");
});

test("the CLI writes scorecard.json and exits 1 on the seeded drop, 0 on the pass case", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "scorecard-"));
  try {
    // .lighthouseci/ is gitignored, so that fixture is written here rather than committed.
    const lighthouse = path.join(dir, "pass", ".lighthouseci");
    cpSync(path.join(fixtures, "pass"), path.join(dir, "pass"), { recursive: true });
    mkdirSync(lighthouse);
    const runs = [
      { url: "http://localhost:8080/", jsonPath: "lhr-1.json", isRepresentativeRun: true },
      { url: "http://localhost:8080/", jsonPath: "lhr-2.json", isRepresentativeRun: false },
    ];
    writeFileSync(path.join(lighthouse, "manifest.json"), JSON.stringify(runs));
    writeFileSync(
      path.join(lighthouse, "lhr-1.json"),
      JSON.stringify({
        categories: { performance: { score: 0.62 } },
        audits: {
          "largest-contentful-paint": { numericValue: 3900 },
          "total-blocking-time": { numericValue: 1800 },
          "cumulative-layout-shift": { numericValue: 0 },
        },
      }),
    );
    writeFileSync(path.join(lighthouse, "lhr-2.json"), "{}");
    const run = (name: string) => {
      const out = path.join(dir, `${name}.json`);
      // Isolated ratchets dir so only the fixture-backed metrics can regress.
      const result = spawnSync(
        process.execPath,
        [
          "tools/scorecard/run.ts",
          "--inputs",
          name === "pass" ? path.join(dir, "pass") : path.join(fixtures, name),
          "--out",
          out,
          "--ratchets",
          path.join(fixtures, "ratchets"),
        ],
        { cwd: root, encoding: "utf8" },
      );
      return {
        status: result.status,
        card: JSON.parse(readFileSync(out, "utf8")),
        stderr: result.stderr,
      };
    };
    const pass = run("pass");
    assert.equal(pass.status, 0, pass.stderr);
    assert.equal(pass.card.version, 1);
    assert.equal(pass.card.metrics["repo-size"], undefined);
    assert.deepEqual(
      pass.card.metrics.lighthouse.map((metric: { status: string }) => metric.status),
      ["pass", "pass"],
    );
    const drop = run("drop");
    assert.equal(drop.status, 1);
    assert.match(drop.stderr, /REGRESSION coverage: lines/);
    assert.equal(drop.card.metrics.lighthouse[0].status, "missing");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the committed ratchets load and every one is compared", () => {
  const card = buildScorecard(loadRatchets(path.join(root, "ratchets")), {}, meta);
  assert.deepEqual(Object.keys(card.metrics).sort(), [
    "a11y",
    "bundle",
    "complexity",
    "coverage",
    "lighthouse",
    "repo-size",
  ]);
  assert.equal(card.summary.fail, 0);
});
