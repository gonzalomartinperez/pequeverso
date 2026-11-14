import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readRun, suggestCeilings } from "../../tools/interaction-suggest.ts";

import { runCli } from "./cli-process.ts";

const script = new URL("../../tools/interaction-suggest.ts", import.meta.url).pathname;

test("interaction CLI proposes calibrated ceilings from distinct recursive runs without editing inputs", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-interaction-cli-"));
  const run = (args: string[]) => runCli(script, args, root);
  try {
    const file = join(root, "ratchet.json");
    const values = [{ key: "frames", value: 100, unit: "frames", direction: "max" as const }];
    const original = JSON.stringify({ version: 1, values });
    writeFileSync(file, original);
    const dirs = ["a", "b", "c"].map((name, index) => {
      const dir = join(root, name);
      mkdirSync(join(dir, "nested"), { recursive: true });
      writeFileSync(
        join(dir, "nested", "measurements.json"),
        JSON.stringify([{ key: "frames", value: 10 + index }]),
      );
      writeFileSync(join(dir, "ignored.txt"), "not JSON");
      return dir;
    });
    const result = run([file, ...dirs]);
    assert.equal(result.status, 0, result.stderr);
    const proposal = JSON.parse(result.stdout);
    assert.equal(proposal.calibrated, true);
    assert.equal(proposal.commit, "unknown");
    assert.match(proposal.measuredAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(proposal.source, /worst of 3 CI runs with 25% headroom/);
    assert.deepEqual(proposal.values, [{ ...values[0], value: 16 }]);
    assert.equal(readFileSync(file, "utf8"), original);
    assert.equal(readRun(dirs[0] ?? "").length, 1);
    const custom = run([file, dirs[0] ?? "", "--min-runs=1", "--headroom=0.5"]);
    assert.equal(custom.status, 0, custom.stderr);
    assert.equal(JSON.parse(custom.stdout).values[0].value, 16);
    assert.equal(
      suggestCeilings(values, [[{ key: "frames", value: 4, project: "p", route: "/" }]])[0]?.value,
      6,
    );
    for (const args of [[], [file, dirs[0] ?? "", dirs[0] ?? "", dirs[0] ?? ""]]) {
      const invalid = run(args);
      assert.equal(invalid.status, 2);
      assert.match(invalid.stderr, /at least 3 distinct run directories/);
      assert.equal(invalid.stdout, "");
    }
    for (const flag of ["--min-runs=", "--min-runs=0", "--headroom=NaN", "--headroom=-1"]) {
      const invalid = run([file, ...dirs, flag]);
      assert.equal(invalid.status, 2);
      assert.match(invalid.stderr, /must be a finite number above 0/);
    }
    for (const malformed of [{}, [null], [{ key: "frames", value: "bad" }]]) {
      writeFileSync(join(dirs[0] ?? "", "bad.json"), JSON.stringify(malformed));
      assert.throws(() => readRun(dirs[0] ?? ""), /expected an array/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
