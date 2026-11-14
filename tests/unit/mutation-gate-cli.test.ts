import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkFiles, checkGlobal, readBaselines } from "../../tools/ci/mutation-gate.ts";
import { runCli } from "./cli-process.ts";

const run = (_script: string, args: string[], cwd: string) =>
  runCli(new URL("../../tools/ci/mutation-gate.ts", import.meta.url).pathname, args, cwd);

test("mutation gate CLI reports baselines, rejects regressions and handles uncountable mutants", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-mutation-gate-"));
  try {
    const report = {
      files: {
        "good.ts": { mutants: [{ status: "Killed" }, { status: "Timeout" }] },
        "bad.ts": { mutants: [{ status: "Survived" }] },
        "empty.ts": { mutants: [{ status: "Ignored" }] },
      },
    };
    const baseline = { values: [{ key: "score", value: 70 }], files: { "good.ts": 90 } };
    mkdirSync(join(root, "reports/mutation"), { recursive: true });
    mkdirSync(join(root, "ratchets"));
    writeFileSync(join(root, "reports/mutation/mutation.json"), JSON.stringify(report));
    writeFileSync(join(root, "ratchets/mutation.json"), JSON.stringify(baseline));
    const good = run("mutation-gate", ["--files", "good.ts,empty.ts"], root);
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stdout, /good.ts: 100.00 \(baseline 90\)/);
    assert.match(good.stdout, /empty.ts: n\/a \(baseline none, break 60\)/);
    assert.match(good.stdout, /mutation gate: ok/);
    const bad = run("mutation-gate", ["--files", "bad.ts,missing.ts"], root);
    assert.equal(bad.status, 1);
    assert.match(
      bad.stderr,
      /bad.ts: score 0.00 is below 60 \(no baseline, needs the global break\)/,
    );
    assert.match(bad.stderr, /missing.ts: not in the mutation report/);
    const global = run(
      "mutation-gate",
      [
        "--global",
        "--report",
        join(root, "reports/mutation/mutation.json"),
        "--ratchet",
        join(root, "ratchets/mutation.json"),
      ],
      root,
    );
    assert.equal(global.status, 1);
    assert.match(global.stderr, /global score 66.67 is below the baseline 70/);
    writeFileSync(
      join(root, "ratchets/mutation.json"),
      JSON.stringify({ values: [{ key: "score", value: 60 }] }),
    );
    const passing = run("mutation-gate", ["--global", "--files"], root);
    assert.equal(passing.status, 0, passing.stderr);
    assert.match(passing.stdout, /mutation gate: ok/);
    assert.deepEqual(
      readBaselines({
        values: [
          { key: "other", value: 1 },
          { key: "score", value: 60 },
        ],
      }),
      { score: 60, files: {} },
    );
    assert.throws(() => readBaselines({}), /has no "score" value/);
    assert.deepEqual(checkGlobal({ files: {} }, { score: 60, files: {} }), [
      "the report has no countable mutants",
    ]);
    assert.deepEqual(checkFiles(report, { score: 60, files: {} }, ["empty.ts"]), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
