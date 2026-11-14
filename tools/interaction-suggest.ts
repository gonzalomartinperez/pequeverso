// Calibrates ratchets/interaction.json from CI runs: proposes ceilings that only tighten.
// Usage: node tools/interaction-suggest.ts <ratchet.json> <run-dir>... [--min-runs=3] [--headroom=0.25]
// Each <run-dir> is one CI run's `test-results/interaction-measurements/` (downloaded from the
// `verification-functional-*` artifacts; tests/browser/interaction.spec.ts writes one JSON array of
// {project, route, key, value} per test). A ceiling is the worst value over all runs, projects and
// routes plus headroom, so one noisy runner does not lock in a flaky gate; it never rises. The
// proposal sets `calibrated: true`: review it and commit it over the ratchet file.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { RatchetValue } from "./scorecard/ratchets.ts";

export type Measurement = { project: string; route: string; key: string; value: number };

const isMeasurement = (row: unknown): row is Measurement => {
  const candidate = row as Partial<Measurement> | null;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof candidate.key === "string" &&
    typeof candidate.value === "number" &&
    Number.isFinite(candidate.value)
  );
};

/** Every measurement under a run directory (recursive); a malformed row is an error. */
export function readRun(dir: string): Measurement[] {
  const found: Measurement[] = [];
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) found.push(...readRun(file));
    else if (name.endsWith(".json")) {
      const rows: unknown = JSON.parse(readFileSync(file, "utf8"));
      if (!Array.isArray(rows) || !rows.every(isMeasurement))
        throw new Error(
          `${file}: expected an array of {key, value} measurements with finite values`,
        );
      found.push(...rows);
    }
  }
  return found;
}

/** New ceilings: max over all runs times (1 + headroom) plus a small absolute margin, never above the current. */
export function suggestCeilings(
  values: RatchetValue[],
  runs: Measurement[][],
  headroom = 0.25,
): RatchetValue[] {
  if (!Number.isFinite(headroom) || headroom <= 0)
    throw new Error("headroom must be a finite number above 0");
  return values.map((item) => {
    const samples = runs.flatMap((run) =>
      run.filter((m) => m.key === item.key && Number.isFinite(m.value)).map((m) => m.value),
    );
    if (samples.length === 0) throw new Error(`no measurement for "${item.key}" in any run`);
    // Absolute margin: 5 ms of timer noise, otherwise one unit (a frame or a percentage point).
    const margin = item.unit === "ms" ? 5 : 1;
    const suggested = Math.ceil(Math.max(...samples) * (1 + headroom) + margin);
    return { ...item, value: Math.min(item.value, suggested) };
  });
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (name: string, fallback: number): number => {
    const raw = args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
    const value = raw === undefined ? fallback : Number(raw);
    if (raw === "" || !Number.isFinite(value) || value <= 0) {
      console.error(`--${name} must be a finite number above 0 (got "${raw}")`);
      process.exit(2);
    }
    return value;
  };
  const [file, ...given] = args.filter((a) => !a.startsWith("--"));
  const minRuns = flag("min-runs", 3);
  const headroom = flag("headroom", 0.25);
  const dirs = [...new Set(given.map((dir) => path.resolve(dir)))];
  if (!file || dirs.length < minRuns) {
    console.error(
      `Usage: node tools/interaction-suggest.ts <ratchet.json> <run-dir>... [--min-runs=${minRuns}] [--headroom=${headroom}] (at least ${minRuns} distinct run directories, got ${dirs.length})`,
    );
    process.exit(2);
  }
  const ratchet = JSON.parse(readFileSync(file, "utf8")) as { values: RatchetValue[] };
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();
  } catch {}
  console.log(
    JSON.stringify(
      {
        ...ratchet,
        measuredAt: new Date().toISOString().slice(0, 10),
        commit,
        source: `interaction-suggest, worst of ${dirs.length} CI runs with ${Math.round(headroom * 100)}% headroom (first-party only, 4x CPU slowdown, chromium-390)`,
        calibrated: true,
        values: suggestCeilings(ratchet.values, dirs.map(readRun), headroom),
      },
      null,
      2,
    ),
  );
}
