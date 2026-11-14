import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { diffCoverage, parseChangedLines, parseLcovLines } from "../../tools/ci/diff-coverage.ts";

const root = path.resolve(import.meta.dirname, "../..");
const tool = path.join(root, "tools/ci/diff-coverage.ts");

const lcov = (hits: Record<number, number>, file = "src/a.ts"): string =>
  `TN:\nSF:${path.join("/repo", file)}\n${Object.entries(hits)
    .map(([line, count]) => `DA:${line},${count}`)
    .join("\n")}\nend_of_record\n`;

const diff = (file: string, hunks: string[]): string =>
  `diff --git a/${file} b/${file}\n--- a/${file}\n+++ b/${file}\n${hunks.join("\n")}\n`;

test("parses added lines from zero-context hunks, ignoring deletions", () => {
  const changed = parseChangedLines(
    `${diff("src/a.ts", ["@@ -3 +3,2 @@", "@@ -9,2 +10,0 @@", "@@ -20 +21 @@"])}--- a/gone.ts\n+++ /dev/null\n@@ -1,2 +0,0 @@\n`,
  );
  assert.deepEqual([...(changed.get("src/a.ts") ?? [])], [3, 4, 21]);
  assert.equal(changed.has("gone.ts"), false);
});

test("lcov paths become repo-relative and repeated records add up", () => {
  const files = parseLcovLines(`${lcov({ 1: 0 })}${lcov({ 1: 2, 2: 1 })}`, "/repo");
  assert.deepEqual(
    [...(files.get("src/a.ts") ?? [])],
    [
      [1, 2],
      [2, 1],
    ],
  );
});

test("only changed executable lines in files with coverage count", () => {
  const coverage = parseLcovLines(lcov({ 1: 3, 2: 0, 4: 1 }), "/repo");
  const changed = parseChangedLines(
    `${diff("src/a.ts", ["@@ -0,0 +1,4 @@"])}${diff("README.md", ["@@ -0,0 +1,9 @@"])}${diff("src/uncovered.ts", ["@@ -0,0 +1,9 @@"])}`,
  );
  const result = diffCoverage(coverage, changed);
  // Line 3 has no DA record (a blank or a type line), README and the untracked file are ignored.
  assert.equal(result.executable, 3);
  assert.equal(result.covered, 2);
  assert.deepEqual(result.uncovered.get("src/a.ts"), [2]);
});

test("a diff without executable lines passes at 100%", () => {
  const result = diffCoverage(new Map(), parseChangedLines(diff("docs/x.md", ["@@ -0,0 +1 @@"])));
  assert.equal(result.percent, 100);
});

test("the seeded failing fixture lands under 85%", () => {
  const hits = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, i < 16 ? 1 : 0]));
  const result = diffCoverage(
    parseLcovLines(lcov(hits), "/repo"),
    parseChangedLines(diff("src/a.ts", ["@@ -0,0 +1,20 @@"])),
  );
  assert.equal(result.percent, 80);
  assert.ok(result.percent < 85);
});

test("the CLI reads git and the lcov file, passing at the floor and failing below it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "diff-coverage-"));
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
      cwd: dir,
      stdio: "ignore",
    });
  try {
    git("init", "-q", "-b", "base");
    mkdirSync(path.join(dir, "src"));
    writeFileSync(path.join(dir, "src/a.ts"), "one\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    writeFileSync(path.join(dir, "src/a.ts"), "one\ntwo\nthree\nfour\n");
    git("commit", "-qam", "work");
    writeFileSync(
      path.join(dir, "lcov.info"),
      lcov({ 2: 1, 3: 1, 4: 0 }, "src/a.ts").replace("/repo", dir),
    );
    const run = (min: string) =>
      spawnSync(process.execPath, [tool, "--lcov", "lcov.info", "--base", "base", "--min", min], {
        cwd: dir,
        encoding: "utf8",
      });
    const pass = run("60");
    assert.equal(pass.status, 0, pass.stdout + pass.stderr);
    assert.match(pass.stdout, /66\.67% \(2\/3/);
    const fail = run("85");
    assert.equal(fail.status, 1);
    assert.match(fail.stdout, /uncovered src\/a\.ts: 4/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the committed floor is 85% and the tool refuses a missing lcov file", () => {
  const ratchet = JSON.parse(
    readFileSync(path.join(root, "ratchets/diff-coverage.json"), "utf8"),
  ) as { values: { key: string; value: number }[] };
  assert.equal(ratchet.values.find((item) => item.key === "changed lines")?.value, 85);
  const run = spawnSync(process.execPath, [tool, "--lcov", "/nonexistent/lcov.info"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(run.status, 1);
});
