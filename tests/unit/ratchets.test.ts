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
  needsCalibration,
  type Ratchet,
  ratchetPhase,
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
  "interaction",
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

const warnSample: Ratchet = {
  ...sample,
  metric: "interaction",
  measuredAt: "2026-11-14",
  mode: "warn",
  expires: "2026-11-28",
};

test("ratchetPhase: warn through the expiry day inclusive, enforce after, fail closed", () => {
  assert.equal(ratchetPhase(warnSample, "2026-11-14"), "warn");
  assert.equal(ratchetPhase(warnSample, "2026-11-28"), "warn");
  assert.equal(ratchetPhase(warnSample, "2026-11-29"), "enforce");
  assert.equal(
    ratchetPhase({ ...warnSample, expires: "2026-11-30" }, "2026-11-20"),
    "enforce",
    "a window longer than 14 days enforces at every consumer",
  );
  assert.equal(ratchetPhase({ ...warnSample, expires: "2099-01-01" }, "2026-11-20"), "enforce");
  assert.equal(ratchetPhase({ ...warnSample, measuredAt: "nope" }, "2026-11-20"), "enforce");
  const { expires: _expires, ...noExpiry } = warnSample;
  assert.equal(ratchetPhase(noExpiry, "2026-11-14"), "enforce", "missing expires enforces");
  assert.equal(ratchetPhase({ ...warnSample, expires: "soon" }, "2026-11-14"), "enforce");
  assert.equal(ratchetPhase({ ...warnSample, expires: "2026-02-30" }, "2026-02-01"), "enforce");
  assert.equal(ratchetPhase({ ...warnSample, mode: "enforce" }, "2026-11-14"), "enforce");
  assert.equal(ratchetPhase(sample, "2026-11-14"), "enforce", "no mode enforces");
});

test("mode and expires are validated: warn needs expires within 14 days of measuredAt", () => {
  const check = (patch: object) => validateRatchet({ ...warnSample, ...patch }, "interaction.json");
  assert.deepEqual(check({}), []);
  assert.deepEqual(check({ mode: "enforce", expires: undefined }), []);
  assert.match(check({ mode: "soft" }).join(), /mode must be/);
  assert.match(check({ expires: undefined }).join(), /needs expires/);
  assert.match(check({ expires: "2026-11-30" }).join(), /at most 14 days/);
  assert.match(check({ expires: "2026-13-01" }).join(), /needs expires/);
  assert.match(check({ mode: undefined }).join(), /mode must be/);
});

test("postponing a warn window is a loosening", () => {
  assert.deepEqual(loosened(warnSample, warnSample), []);
  assert.deepEqual(loosened(warnSample, { ...warnSample, expires: "2026-11-27" }), []);
  assert.deepEqual(loosened(warnSample, { ...warnSample, expires: "2026-12-05" }), ["expires"]);
  assert.deepEqual(loosened({ ...warnSample, mode: "enforce" }, warnSample), ["mode"]);
  assert.deepEqual(loosened(sample, warnSample), ["mode"], "no mode means enforce");
  const { mode: _mode, expires: _expires, ...enforced } = warnSample;
  assert.deepEqual(loosened(warnSample, enforced), [], "warn -> enforce tightens");
});

test("needsCalibration: a warn ratchet must be calibrated once it enforces", () => {
  const { expires: _expires, ...noExpiry } = warnSample;
  assert.equal(needsCalibration(warnSample, "2026-11-28"), false, "still warning");
  assert.equal(needsCalibration(warnSample, "2026-11-29"), true, "expired, not calibrated");
  assert.equal(needsCalibration({ ...warnSample, calibrated: true }, "2026-11-29"), false);
  assert.equal(needsCalibration({ ...warnSample, calibrated: false }, "2026-11-29"), true);
  assert.equal(needsCalibration(sample, "2026-11-29"), false, "no mode: nothing to calibrate");
  assert.equal(needsCalibration(noExpiry, "2026-11-20"), true);
});

test("calibrated is validated and cannot be withdrawn", () => {
  const check = (patch: object) => validateRatchet({ ...warnSample, ...patch }, "interaction.json");
  assert.deepEqual(check({ calibrated: true }), []);
  assert.match(check({ calibrated: "yes" }).join(), /calibrated must be a boolean/);
  const calibrated = { ...warnSample, calibrated: true };
  assert.deepEqual(loosened(calibrated, calibrated), []);
  assert.deepEqual(loosened(calibrated, warnSample), ["calibrated"]);
});

test("no committed ratchet that declares a mode is uncalibrated after its warn window", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const ratchet of loadRatchets(ratchetsDir)) {
    assert.equal(
      needsCalibration(ratchet, today),
      false,
      `ratchets/${ratchet.metric}.json passed its warn window without "calibrated": true: calibrate it from CI runs and set it`,
    );
  }
});
