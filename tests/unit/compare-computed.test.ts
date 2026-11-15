import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  diff,
  diffElements,
  diffVars,
  type Page,
  PROPERTIES,
} from "../../tools/tokens/compare-computed.ts";

const page = (vars: Record<string, string>, els: Page["els"] = {}): Page => ({ vars, els });

test("custom properties compare after normalizing light-dark(x, x) to x", () => {
  const problems: string[] = [];
  const checks = diffVars(
    "/ 390",
    page({ "--a": "light-dark(red, red)", "--b": "1px", "--gone": "x" }),
    page({ "--a": "red", "--b": "2px", "--new": "y" }),
    problems,
  );
  assert.equal(checks, 4);
  assert.deepEqual(problems, [
    "/ 390 --b: 1px | 2px",
    "/ 390 --gone: x | undefined",
    "/ 390 --new: undefined | y",
  ]);
});

test("every listed computed property of every element is compared", () => {
  const [first = "", second = ""] = PROPERTIES;
  const problems: string[] = [];
  const checks = diffElements(
    "/ 1280",
    page({}, { "DIV:0": { [first]: "1", [second]: "2" } }),
    page({}, { "DIV:0": { [first]: "1", [second]: "3" }, "P:0": { [first]: "1" } }),
    problems,
  );
  assert.equal(checks, 2 * PROPERTIES.length);
  assert.ok(problems.includes(`/ 1280 DIV:0 ${second}: 2 | 3`));
  assert.ok(problems.includes(`/ 1280 P:0 ${first}: undefined | 1`));
});

test("diff reads two captures, reports missing pages and exits 1 only on differences", () => {
  const dir = mkdtempSync(join(tmpdir(), "pv-compare-"));
  const log = console.log;
  const lines: string[] = [];
  console.log = (line: string) => lines.push(line);
  try {
    const same = { "/ 390": page({ "--a": "red" }) };
    writeFileSync(join(dir, "a.json"), JSON.stringify(same));
    writeFileSync(join(dir, "b.json"), JSON.stringify(same));
    assert.equal(diff(join(dir, "a.json"), join(dir, "b.json")), 0);
    assert.equal(lines.at(-1), `${1 + 0} checks, 0 differences`);
    writeFileSync(join(dir, "c.json"), JSON.stringify({}));
    assert.equal(diff(join(dir, "a.json"), join(dir, "c.json")), 1);
    assert.equal(lines.at(-2), "missing page / 390");
    assert.equal(lines.at(-1), "0 checks, 1 differences");
  } finally {
    console.log = log;
    rmSync(dir, { recursive: true, force: true });
  }
});
