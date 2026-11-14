import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  diffCoverage,
  inScope,
  isCodeLine,
  parseChangedLines,
  parseLcovLines,
} from "../../tools/ci/diff-coverage.ts";

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

test("only changed code lines in files with coverage count", () => {
  const coverage = parseLcovLines(lcov({ 1: 3, 2: 0, 4: 1 }), "/repo");
  const changed = parseChangedLines(
    `${diff("src/a.ts", ["@@ -0,0 +1,4 @@"])}${diff("README.md", ["@@ -0,0 +1,9 @@"])}${diff("src/component.tsx", ["@@ -0,0 +1,9 @@"])}`,
  );
  const result = diffCoverage(coverage, changed);
  // Line 3 has no DA record (a blank or a type line), README and the untracked file are ignored.
  assert.equal(result.counted, 3);
  assert.equal(result.covered, 2);
  assert.deepEqual(result.uncovered.get("src/a.ts"), [2]);
});

test("a diff without counted lines passes at 100%", () => {
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
    execFileSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args],
      {
        cwd: dir,
        stdio: "ignore",
      },
    );
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

test("a content line that looks like a header does not create a phantom file", () => {
  const changed = parseChangedLines(
    `${diff("src/a.ts", ["@@ -0,0 +1,2 @@", "+++ x", "+line"])}`.replace("+++ x", "+++ phantom.ts"),
  );
  assert.deepEqual([...changed.keys()], ["src/a.ts"]);
  assert.deepEqual([...(changed.get("src/a.ts") ?? [])], [1, 2]);
});

test("renames use the new path, a trailing tab is stripped and no-newline markers are ignored", () => {
  const changed = parseChangedLines(
    [
      "diff --git a/old name.ts b/new name.ts",
      "similarity index 80%",
      "rename from old name.ts",
      "rename to new name.ts",
      "--- a/old name.ts\t",
      "+++ b/new name.ts\t",
      "@@ -1 +1 @@",
      "-a",
      "\\ No newline at end of file",
      "+b",
      "\\ No newline at end of file",
      "diff --git a/pure.ts b/moved.ts",
      "similarity index 100%",
      "rename from pure.ts",
      "rename to moved.ts",
      "",
    ].join("\n"),
  );
  assert.deepEqual([...changed.keys()], ["new name.ts"]);
  assert.deepEqual([...(changed.get("new name.ts") ?? [])], [1]);
});

test("a changed in-scope file that no test loaded counts every code line as uncovered", () => {
  const changed = parseChangedLines(
    `${diff("tools/new.ts", ["@@ -0,0 +1,4 @@"])}${diff("src/ui.tsx", ["@@ -0,0 +1,4 @@"])}${diff("tests/unit/x.test.ts", ["@@ -0,0 +1,4 @@"])}`,
  );
  const isCode = (_file: string, line: number) => line !== 2; // line 2 is a comment
  const result = diffCoverage(parseLcovLines(lcov({ 1: 1 }), "/repo"), changed, isCode);
  assert.equal(result.counted, 3);
  assert.equal(result.percent, 0);
  assert.deepEqual(result.notMeasured.get("tools/new.ts"), [1, 3, 4]);
  assert.equal(result.notMeasured.has("src/ui.tsx"), false);
  assert.equal(result.notMeasured.has("tests/unit/x.test.ts"), false);
  assert.equal(inScope("src/a.d.ts"), false);
  assert.equal(inScope("config/a.ts"), true);
});

test("blank and comment-only lines are not code", () => {
  for (const text of ["", "   ", "// c", "/* c", " * c", " */"])
    assert.equal(isCodeLine(text), false);
  for (const text of ["const a = 1; // c", "}", "export {};"]) assert.equal(isCodeLine(text), true);
});

test("the CLI fails on an lcov report without records and says when nothing was measured", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "diff-coverage-empty-"));
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args],
      {
        cwd: dir,
        stdio: "ignore",
      },
    );
  try {
    git("init", "-q", "-b", "base");
    writeFileSync(path.join(dir, "a.md"), "one\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    writeFileSync(path.join(dir, "a.md"), "two\n");
    git("commit", "-qam", "work");
    const run = (lcovText: string) => {
      writeFileSync(path.join(dir, "lcov.info"), lcovText);
      return spawnSync(
        process.execPath,
        [tool, "--lcov", "lcov.info", "--base", "base", "--min", "85"],
        {
          cwd: dir,
          encoding: "utf8",
        },
      );
    };
    const empty = run("");
    assert.equal(empty.status, 1);
    assert.match(empty.stderr, /no SF records/);
    const docsOnly = run(lcov({ 1: 1 }).replace("/repo", dir));
    assert.equal(docsOnly.status, 0);
    assert.match(docsOnly.stdout, /nothing measured/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
