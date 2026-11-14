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

const root = path.resolve(import.meta.dirname, "../..");
const ratchetsDir = path.join(root, "ratchets");
const git = (...args: string[]): string =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
const required = [
  "a11y",
  "bundle",
  "complexity",
  "coverage",
  "design-lint",
  "lighthouse",
  "lighthouse-lab",
  "repo-size",
];

test("every committed ratchet file is valid and the M1-9 baselines exist", () => {
  const metrics = loadRatchets(ratchetsDir).map((ratchet) => ratchet.metric);
  for (const metric of required)
    assert.ok(metrics.includes(metric), `missing ratchets/${metric}.json`);
  const coverage = loadRatchets(ratchetsDir).find((ratchet) => ratchet.metric === "coverage");
  assert.equal(coverage?.values.find((item) => item.key === "branches")?.value, 88.11);
});

/** The develop tip to compare with; CI checkouts are shallow, so fetch it there (public repo). */
function developTip(): string | undefined {
  try {
    return git("rev-parse", "--verify", "--quiet", "origin/develop").trim();
  } catch {
    if (!process.env.CI) return undefined;
    git(
      "fetch",
      "--no-tags",
      "--depth=1",
      "origin",
      "+refs/heads/develop:refs/remotes/origin/develop",
    );
    return git("rev-parse", "--verify", "origin/develop").trim();
  }
}

test("committed baselines only tighten against develop", (t) => {
  const base = developTip();
  if (!base) {
    t.skip("no origin/develop outside CI");
    return;
  }
  for (const ratchet of loadRatchets(ratchetsDir)) {
    const file = `ratchets/${ratchet.metric}.json`;
    const exists = git("ls-tree", "--name-only", base, "--", file).trim() === file;
    if (!exists) continue; // new ratchet file: nothing to compare yet
    const previous = JSON.parse(git("show", `${base}:${file}`)) as Ratchet;
    assert.deepEqual(loosened(previous, ratchet), [], `${file} was loosened`);
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
  assert.deepEqual(
    loosened(sample, { ...sample, values: [floor] }),
    ["bytes"],
    "removing a key loosens",
  );
  const flipped = { ...sample, values: [{ ...floor, direction: "max" as const }, ceiling] };
  assert.deepEqual(loosened(sample, flipped), ["branches"]);
  const relabelled = { ...sample, values: [floor, { ...ceiling, unit: "KB" }] };
  assert.deepEqual(loosened(sample, relabelled), ["bytes"], "a unit change is a loosening");
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
