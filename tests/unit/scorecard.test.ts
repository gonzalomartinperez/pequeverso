import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadRatchets, type Ratchet } from "../../tools/scorecard/ratchets.ts";
import {
  axisReports,
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

const lcovAtFloor = "SF:a.ts\nFNF:1\nFNH:1\nLF:100\nLH:95\nBRF:100\nBRH:88\nend_of_record\n";
const bundleAtCeiling = JSON.stringify([
  { route: "/", metric: "js", kb: 160 },
  { route: "/", metric: "html", kb: 50 },
]);

/** Writes an inputs directory (.lighthouseci/ is gitignored, so it is written here) and runs the CLI. */
function cli(
  dir: string,
  inputs: { lcov?: string; bundle?: string; lighthouse?: Record<string, unknown>[] },
  extra: string[] = [],
) {
  mkdirSync(path.join(dir, "coverage"), { recursive: true });
  if (inputs.lcov !== undefined)
    writeFileSync(path.join(dir, "coverage", "lcov.info"), inputs.lcov);
  if (inputs.bundle !== undefined) writeFileSync(path.join(dir, "bundle.json"), inputs.bundle);
  if (inputs.lighthouse) {
    const lighthouse = path.join(dir, ".lighthouseci");
    mkdirSync(lighthouse);
    const runs = inputs.lighthouse.map((_, index) => ({
      url: "http://localhost:8080/",
      jsonPath: `lhr-${index}.json`,
      isRepresentativeRun: index === 0,
    }));
    writeFileSync(path.join(lighthouse, "manifest.json"), JSON.stringify(runs));
    for (const [index, lhr] of inputs.lighthouse.entries())
      writeFileSync(path.join(lighthouse, `lhr-${index}.json`), JSON.stringify(lhr));
  }
  const out = path.join(dir, "scorecard.json");
  const result = spawnSync(
    process.execPath,
    [
      "tools/scorecard/run.ts",
      "--inputs",
      dir,
      "--out",
      out,
      "--ratchets",
      path.join(fixtures, "ratchets"),
      ...extra,
    ],
    { cwd: root, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    card: JSON.parse(readFileSync(out, "utf8")),
  };
}

const lhr = (score: number, lcp: number | null) => ({
  categories: { performance: { score } },
  audits: { "largest-contentful-paint": { numericValue: lcp } },
});

test("the CLI passes a clean run, using the median over all Lighthouse runs", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "scorecard-"));
  try {
    const result = cli(dir, {
      lcov: fixture("pass", "coverage/lcov.info"),
      bundle: fixture("pass", "bundle.json"),
      lighthouse: [lhr(0.5, 3900), lhr(0.62, 4200), lhr(0.7, null)],
    });
    assert.equal(result.status, 0, result.stdout);
    assert.equal(result.card.version, 1);
    assert.equal(result.card.metrics["repo-size"], undefined);
    const [perf, lcp] = result.card.metrics.lighthouse;
    assert.deepEqual([perf.measured, lcp.measured], [62, 4.05]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the CLI exits 1 on the seeded coverage drop and on a bundle ceiling breach alone", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "scorecard-"));
  try {
    const drop = cli(path.join(dir, "a"), {
      lcov: fixture("drop", "coverage/lcov.info"),
      bundle: fixture("pass", "bundle.json"),
    });
    assert.equal(drop.status, 1);
    assert.match(drop.stdout, /REGRESSION coverage: lines/);
    const bundle = cli(path.join(dir, "b"), {
      lcov: fixture("pass", "coverage/lcov.info"),
      bundle: fixture("drop", "bundle.json"),
    });
    assert.equal(bundle.status, 1);
    assert.match(bundle.stdout, /REGRESSION bundle: \/ js is 181.2/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("measurements equal to the floor and the ceiling pass, raw and unrounded", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "scorecard-"));
  try {
    const equal = cli(dir, { lcov: lcovAtFloor, bundle: bundleAtCeiling }, [
      "--need",
      "coverage,bundle",
    ]);
    assert.equal(equal.status, 0, equal.stdout);
    const raw = cli(path.join(dir, "raw"), {
      lcov: lcovAtFloor,
      bundle: JSON.stringify([{ route: "/", metric: "js", kb: 160.04 }]),
    });
    assert.equal(raw.status, 1, "160.04 must not be rounded down to the 160 ceiling");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--need fails on empty, absent and malformed collector output, with a reason", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "scorecard-"));
  const need = ["--need", "coverage,bundle"];
  try {
    const empty = cli(path.join(dir, "empty"), { lcov: "", bundle: "[]" }, need);
    assert.equal(empty.status, 1);
    assert.match(empty.stdout, /REQUIRED input incomplete: coverage/);
    const absent = cli(path.join(dir, "absent"), {}, need);
    assert.equal(absent.status, 1);
    assert.equal(absent.card.inputProblems.bundle, "input not found");
    const bad = path.join(dir, "bad");
    const optional = cli(bad, { lcov: lcovAtFloor, bundle: "{not json" });
    assert.equal(optional.status, 0, "a malformed input is missing, not a crash, unless required");
    assert.match(optional.card.inputProblems.bundle, /^malformed input/);
    assert.equal(optional.card.metrics.bundle[0].status, "missing");
    assert.equal(
      cli(path.join(dir, "bad2"), { lcov: lcovAtFloor, bundle: "{not json" }, need).status,
      1,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an axis whose input group is absent or empty is missing, never pass", () => {
  const passing = {
    key: "k",
    baseline: 1,
    measured: 1,
    unit: "",
    direction: "max",
    status: "pass",
  } as const;
  const axes = axisReports({ bundle: [passing] });
  assert.equal(axes.D6?.status, "missing");
  assert.equal(axisReports({ bundle: [passing], lighthouse: [] }).D6?.status, "missing");
  assert.equal(axisReports({ bundle: [passing], lighthouse: [passing] }).D6?.status, "pass");
});

test("lighthouse takes the median per URL and metric and ignores non-numbers", () => {
  assert.deepEqual(
    lighthouseMeasurements([
      { path: "/", performance: 0.5, lcp: 3000, tbt: null, cls: "0" },
      { path: "/", performance: 0.7, lcp: 5000 },
      { path: "/a/", performance: 0.9 },
    ]),
    { "/ performance": 60, "/ lcp": 4, "/a/ performance": 90 },
  );
});

test("the committed ratchets load and every one is compared", () => {
  const card = buildScorecard(loadRatchets(path.join(root, "ratchets")), {}, meta);
  assert.deepEqual(Object.keys(card.metrics).sort(), [
    "a11y",
    "bundle",
    "complexity",
    "coverage",
    "design-lint",
    "lighthouse",
    "lighthouse-lab",
    "repo-size",
  ]);
  assert.equal(card.summary.fail, 0);
});
