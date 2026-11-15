import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { measure, measureConfig, parseReport, report, summarize } from "../../tools/complexity.ts";
import { holds, type Ratchet } from "../../tools/scorecard/ratchets.ts";

const root = resolve(import.meta.dirname, "../..");
const biome = join(root, "node_modules/.bin/biome");
const RULE = "lint/complexity/noExcessiveCognitiveComplexity";
const diagnostic = (path: string, score: number, category = RULE, severity = "error") => ({
  category,
  severity,
  message: `Excessive complexity of ${score} detected (max: 10).`,
  location: { path, start: { line: 3, column: 1 } },
});
const biomeReport = (diagnostics: unknown[], unchanged = 3) =>
  JSON.stringify({ summary: { changed: 0, unchanged }, diagnostics });

/** A scratch project with `files`, measured over `scope` with the repository's Biome. */
function measureScratch(files: Record<string, string>, scope: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "pv-complexity-fixture-"));
  try {
    for (const [name, source] of Object.entries(files)) {
      mkdirSync(join(dir, name, ".."), { recursive: true });
      writeFileSync(join(dir, name), source);
    }
    return measure(dir, scope, biome);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("the measure configuration enables only the complexity rule at threshold 10", () => {
  const config = JSON.parse(measureConfig());
  assert.equal(config.linter.rules.preset, "none");
  assert.deepEqual(config.linter.rules.complexity, {
    noExcessiveCognitiveComplexity: { level: "error", options: { maxAllowedComplexity: 10 } },
  });
});

test("findings come only from the complexity rule and split tests from the rest", () => {
  const parsed = parseReport(
    biomeReport([
      diagnostic("tools/a.ts", 12),
      diagnostic("tests/unit/b.test.ts", 31),
      diagnostic("src/c.ts", 11),
      diagnostic("src/c.ts", 99, "suppressions/unused", "warning"),
    ]),
  );
  assert.equal(parsed.files, 3);
  assert.deepEqual(parsed.findings, [
    { path: "tools/a.ts", line: 3, score: 12 },
    { path: "tests/unit/b.test.ts", line: 3, score: 31 },
    { path: "src/c.ts", line: 3, score: 11 },
  ]);
  assert.deepEqual(summarize(parsed.findings), {
    "functions over 10 (src, config, content, tools)": 2,
    "functions over 10 (tests)": 1,
    "max cognitive complexity": 31,
  });
  assert.deepEqual(summarize([]), {
    "functions over 10 (src, config, content, tools)": 0,
    "functions over 10 (tests)": 0,
    "max cognitive complexity": 0,
  });
});

test("an unreadable or incomplete report fails closed instead of reading as zero", () => {
  assert.throws(() => parseReport("{}"), /without diagnostics/);
  assert.throws(() => parseReport("not json"));
  const broken = { ...diagnostic("src/x.ts", 12), message: "something else" };
  assert.throws(() => parseReport(biomeReport([broken])), /unreadable/);
  const pathless = { ...diagnostic("src/x.ts", 12), location: {} };
  assert.throws(() => parseReport(biomeReport([pathless])), /unreadable/);
  // A path Biome cannot read or a file it cannot parse is an error, never a silent gap.
  for (const category of ["fs/cantRead", "parse"])
    assert.throws(() => parseReport(biomeReport([diagnostic("x", 0, category)])), /measure/);
});

test("end to end: a function above 10 is found, and a bad scope or file fails", () => {
  const branchy = `export function f(a: number, b: number, c: number): number {
  if (a) { if (b) { if (c) { for (const x of [a, b]) { if (x) { while (c) { if (b) return 1; } } } } } }
  return a && b ? (c ? 1 : 2) : 3;
}
`;
  const measured = measureScratch({ "src/a.ts": branchy, "src/b.ts": "export const b = 1;\n" }, [
    "src",
  ]);
  assert.equal(measured.files, 2);
  assert.equal(measured.findings.length, 1);
  assert.ok((measured.findings[0]?.score ?? 0) > 10);
  assert.throws(() => measureScratch({ "src/a.ts": "export {};\n" }, ["src", "conent"]), /missing/);
  assert.throws(() => measureScratch({ "src/a.ts": "export function (\n" }, ["src"]), /measure/);
});

test("the report lists findings worst first, or only the summary with --json", () => {
  const findings = [
    { path: "src/a.ts", line: 1, score: 11 },
    { path: "tests/b.ts", line: 2, score: 30 },
  ];
  const lines = report(findings, []);
  assert.deepEqual(lines.slice(0, 2), ["30\ttests/b.ts:2", "11\tsrc/a.ts:1"]);
  assert.deepEqual(JSON.parse(lines[2] ?? ""), summarize(findings));
  assert.deepEqual(JSON.parse(report(findings, ["--json"])[0] ?? ""), summarize(findings));
});

test("cognitive complexity stays within ratchets/complexity.json (it may only fall)", () => {
  const ratchet = JSON.parse(
    readFileSync(join(root, "ratchets/complexity.json"), "utf8"),
  ) as Ratchet;
  const { findings, files } = measure(root);
  // Sanity floor: the whole scope was read (several hundred TypeScript files today).
  assert.ok(files > 300, `only ${files} files measured`);
  const measured = summarize(findings);
  for (const item of ratchet.values) {
    const value = measured[item.key as keyof typeof measured];
    assert.equal(typeof value, "number", `no measurement for "${item.key}"`);
    assert.ok(
      holds(item, value),
      `${item.key}: ${value} exceeds the ratchet ${item.value}. Split the new hot spot ` +
        "(npm run complexity lists every function above 10).",
    );
  }
});
