import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  holds,
  loadRatchets,
  loosened,
  type Ratchet,
  validateRatchet,
} from "../../tools/scorecard/ratchets.ts";

const expected = ["a11y", "bundle", "complexity", "coverage", "lighthouse", "repo-size"];

test("every committed ratchet file is valid and the M1-9 baselines exist", () => {
  const ratchets = loadRatchets("ratchets");
  assert.deepEqual(
    ratchets.map((ratchet) => ratchet.metric),
    expected,
  );
  const coverage = ratchets.find((ratchet) => ratchet.metric === "coverage");
  assert.equal(coverage?.values.find((item) => item.key === "branches")?.value, 88.11);
});

test("committed baselines only tighten against the base branch", (t) => {
  let base: string;
  try {
    base = execFileSync("git", ["merge-base", "HEAD", "origin/develop"], { encoding: "utf8" }).trim();
  } catch {
    t.skip("no origin/develop to compare with");
    return;
  }
  for (const metric of expected) {
    let previous: string;
    try {
      previous = execFileSync("git", ["show", `${base}:ratchets/${metric}.json`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      continue; // new ratchet file: nothing to compare yet
    }
    const now = loadRatchets("ratchets").find((ratchet) => ratchet.metric === metric);
    assert.ok(now, metric);
    assert.deepEqual(loosened(JSON.parse(previous) as Ratchet, now), [], `${metric} was loosened`);
  }
});

const sample: Ratchet = {
  metric: "coverage",
  measuredAt: "2026-11-09",
  commit: "cbf519c",
  source: "test",
  values: [
    { key: "branches", value: 88.11, unit: "%", direction: "min" },
    { key: "bytes", value: 100, unit: "B", direction: "max" },
  ],
};

test("floors may only rise and ceilings may only fall", () => {
  const [floor, ceiling] = sample.values;
  assert.ok(floor && ceiling);
  assert.equal(holds(floor, 88.11), true);
  assert.equal(holds(floor, 88.1), false);
  assert.equal(holds(ceiling, 100), true);
  assert.equal(holds(ceiling, 101), false);
  const tighter = {
    ...sample,
    values: [
      { ...floor, value: 90 },
      { ...ceiling, value: 90 },
    ],
  };
  assert.deepEqual(loosened(sample, tighter), []);
  const looser = {
    ...sample,
    values: [
      { ...floor, value: 80 },
      { ...ceiling, value: 120 },
    ],
  };
  assert.deepEqual(loosened(sample, looser), ["branches", "bytes"]);
  assert.deepEqual(loosened(sample, { ...sample, values: [floor] }), ["bytes"], "removing a key loosens");
  const flipped = { ...sample, values: [{ ...floor, direction: "max" as const }, ceiling] };
  assert.deepEqual(loosened(sample, flipped), ["branches"]);
});

test("invalid ratchet files are rejected", () => {
  assert.deepEqual(validateRatchet(sample, "coverage.json"), []);
  assert.match(validateRatchet(sample, "bundle.json").join(), /metric must be "bundle"/);
  assert.match(validateRatchet({ ...sample, values: [] }, "coverage.json").join(), /non-empty/);
  const bad = {
    ...sample,
    commit: "HEAD",
    values: [{ key: "x", value: Number.NaN, unit: "", direction: "up" }],
  };
  const problems = validateRatchet(bad, "coverage.json").join("\n");
  assert.match(problems, /commit must be a git SHA/);
  assert.match(problems, /finite number/);
  assert.match(problems, /direction must be min or max/);
  const dir = mkdtempSync(path.join(tmpdir(), "ratchets-"));
  try {
    writeFileSync(path.join(dir, "coverage.json"), "{not json");
    assert.throws(() => loadRatchets(dir), /invalid JSON/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
