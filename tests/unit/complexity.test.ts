import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  measure,
  measureConfig,
  parseFindings,
  report,
  summarize,
} from "../../tools/complexity.ts";
import { holds, type Ratchet } from "../../tools/scorecard/ratchets.ts";

const RULE = "lint/complexity/noExcessiveCognitiveComplexity";
const diagnostic = (path: string, score: number, category = RULE) => ({
  category,
  message: `Excessive complexity of ${score} detected (max: 10).`,
  location: { path, start: { line: 3, column: 1 } },
});

test("the measure configuration enables only the complexity rule at threshold 10", () => {
  const config = JSON.parse(measureConfig());
  assert.equal(config.linter.rules.preset, "none");
  assert.deepEqual(config.linter.rules.complexity, {
    noExcessiveCognitiveComplexity: { level: "error", options: { maxAllowedComplexity: 10 } },
  });
});

test("findings come only from the complexity rule and split tests from the rest", () => {
  const report = JSON.stringify({
    diagnostics: [
      diagnostic("tools/a.ts", 12),
      diagnostic("tests/unit/b.test.ts", 31),
      diagnostic("src/c.ts", 11),
      diagnostic("src/c.ts", 99, "suppressions/unused"),
    ],
  });
  const findings = parseFindings(report);
  assert.deepEqual(findings, [
    { path: "tools/a.ts", line: 3, score: 12 },
    { path: "tests/unit/b.test.ts", line: 3, score: 31 },
    { path: "src/c.ts", line: 3, score: 11 },
  ]);
  assert.deepEqual(summarize(findings), {
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

test("an unreadable report fails closed instead of reading as zero findings", () => {
  assert.throws(() => parseFindings("{}"), /without diagnostics/);
  assert.throws(() => parseFindings("not json"));
  const broken = { ...diagnostic("src/x.ts", 12), message: "something else" };
  assert.throws(() => parseFindings(JSON.stringify({ diagnostics: [broken] })), /unreadable/);
  const pathless = { ...diagnostic("src/x.ts", 12), location: {} };
  assert.throws(() => parseFindings(JSON.stringify({ diagnostics: [pathless] })), /unreadable/);
});

test("cognitive complexity stays within ratchets/complexity.json (it may only fall)", () => {
  const ratchet = JSON.parse(readFileSync("ratchets/complexity.json", "utf8")) as Ratchet;
  const measured = summarize(measure());
  for (const item of ratchet.values) {
    const value = measured[item.key as keyof typeof measured];
    assert.equal(typeof value, "number", `no measurement for "${item.key}"`);
    assert.ok(
      holds(item, value),
      `${item.key}: ${value} exceeds the ratchet ${item.value}. Split the new hot spot ` +
        "(node tools/complexity.ts lists every function above 10).",
    );
  }
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
