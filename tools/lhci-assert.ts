// Asserts the median of every Lighthouse CI run per URL against a ratchet file (M2-1).
// Usage: node tools/lhci-assert.ts <ratchet.json> [--dir=.lighthouseci] [--config=lighthouserc.json]
//   [--runs=N] [--tolerance=0.15] [--allow-missing-paths] [--suggest]
// Ratchet keys are "<pathname> <metric>"; metrics: performance, accessibility, best-practices, seo
// (score 0-100), lcp, tbt (s or ms), cls, js-kb (script transfer KB). Strict by default: every key
// must be checked, every route needs the expected number of error-free runs (--runs, else
// ci.collect.numberOfRuns of --config) and every run must carry a finite value. Unknown metrics and
// malformed keys throw. `--allow-missing-paths` (live lane, which covers a subset of the routes)
// skips keys whose route was not collected. `--tolerance` (0 to 0.5) widens the limit by a
// fraction; CLS gets 0.01 absolute slack on a ratchet of 0. `--suggest` prints a tighter ratchet
// JSON (10% headroom, never looser than the current values) instead of asserting.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RatchetValue } from "./scorecard/ratchets.ts";

export type Lhr = {
  runtimeError?: { code?: string; message?: string };
  categories: Record<string, { score?: number | null } | undefined>;
  audits: Record<
    string,
    { numericValue?: number; details?: { items?: Record<string, unknown>[] } } | undefined
  >;
};
export type Failure = { key: string; reason: string };
export type Options = { tolerance?: number; expectedRuns?: number; allowMissingPaths?: boolean };

const categories = ["performance", "accessibility", "best-practices", "seo"];
const metrics = [...categories, "lcp", "tbt", "cls", "js-kb"];

/** Splits "<pathname> <metric>"; throws on anything else, so a typo cannot silently un-gate. */
export function parseKey(key: string): { pathname: string; metric: string } {
  const match = /^(\/\S*) (\S+)$/.exec(key);
  if (!match) throw new Error(`Malformed ratchet key "${key}" (expected "<pathname> <metric>")`);
  const [, pathname, metric] = match as unknown as [string, string, string];
  if (!metrics.includes(metric))
    throw new Error(`Unknown metric "${metric}" in ratchet key "${key}" (${metrics.join(", ")})`);
  return { pathname, metric };
}

/** One metric of one run, in the unit used by the ratchet; undefined when the run lacks it. */
export function metricOf(lhr: Lhr, metric: string, unit: string): number | undefined {
  const audit = (id: string) => lhr.audits[id]?.numericValue;
  const seconds = (ms: number | undefined) =>
    ms === undefined ? undefined : unit === "s" ? ms / 1000 : ms;
  if (categories.includes(metric)) {
    const score = lhr.categories[metric]?.score;
    return score == null ? undefined : score * 100;
  }
  if (metric === "lcp") return seconds(audit("largest-contentful-paint"));
  if (metric === "tbt") return seconds(audit("total-blocking-time"));
  if (metric === "cls") return audit("cumulative-layout-shift");
  const items = lhr.audits["resource-summary"]?.details?.items ?? [];
  const bytes = items.find((item) => item.resourceType === "script")?.transferSize;
  return typeof bytes === "number" ? bytes / 1000 : undefined;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

function checkTolerance(tolerance: number): void {
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 0.5)
    throw new Error(`--tolerance must be a number between 0 and 0.5, got ${tolerance}`);
}

type Collected = { key: string; item: RatchetValue; samples: number[] };

/** Validates routes, run counts and values; returns per-key samples plus every failure. */
function collect(
  values: RatchetValue[],
  runsByPath: Map<string, Lhr[]>,
  options: Options,
): { collected: Collected[]; failures: Failure[] } {
  const failures: Failure[] = [];
  const collected: Collected[] = [];
  const reported = new Set<string>();
  const once = (key: string, reason: string, id: string) => {
    if (reported.has(id)) return;
    reported.add(id);
    failures.push({ key, reason });
  };
  for (const item of values) {
    const { pathname, metric } = parseKey(item.key);
    const runs = runsByPath.get(pathname);
    if (!runs) {
      if (!options.allowMissingPaths)
        failures.push({ key: item.key, reason: "route not collected" });
      continue;
    }
    if (options.expectedRuns !== undefined && runs.length < options.expectedRuns)
      once(
        item.key,
        `${runs.length} runs collected, ${options.expectedRuns} expected`,
        `n:${pathname}`,
      );
    if (runs.some((lhr) => lhr.runtimeError))
      once(item.key, "a run reported runtimeError", `e:${pathname}`);
    const samples = runs.map((lhr) => metricOf(lhr, metric, item.unit));
    if (samples.length === 0 || samples.some((s) => s === undefined || !Number.isFinite(s))) {
      failures.push({ key: item.key, reason: "metric missing or not finite in a run" });
      continue;
    }
    collected.push({ key: item.key, item, samples: samples as number[] });
  }
  return { collected, failures };
}

/** Compares the per-path median of every ratchet key with its limit. */
export function assertRatchet(
  values: RatchetValue[],
  runsByPath: Map<string, Lhr[]>,
  options: Options = {},
): { failures: Failure[]; checked: number } {
  const tolerance = options.tolerance ?? 0;
  checkTolerance(tolerance);
  const { collected, failures } = collect(values, runsByPath, options);
  for (const { key, item, samples } of collected) {
    const measured = median(samples);
    const slack = item.value === 0 && item.unit === "" ? 0.01 : Math.abs(item.value) * tolerance;
    const limit = item.direction === "max" ? item.value + slack : item.value - slack;
    if (item.direction === "max" ? measured > limit : measured < limit)
      failures.push({
        key,
        reason: `median ${measured.toFixed(2)} ${item.unit} vs limit ${limit.toFixed(2)}`,
      });
  }
  return { failures, checked: collected.length };
}

/** Ratchet values from the medians with headroom, clamped so they can only tighten. */
export function suggestRatchet(
  values: RatchetValue[],
  runsByPath: Map<string, Lhr[]>,
  headroom = 0.1,
): RatchetValue[] {
  const { collected, failures } = collect(values, runsByPath, {});
  if (failures.length) throw new Error(failures.map((f) => `${f.key}: ${f.reason}`).join("; "));
  return collected.map(({ item, samples }) => {
    const measured = median(samples);
    const suggested =
      item.direction === "max"
        ? Math.ceil(Number((measured * (1 + headroom) * 100).toFixed(6))) / 100
        : Math.floor(Number((measured * (1 - headroom)).toFixed(6)));
    const value =
      item.direction === "max" ? Math.min(item.value, suggested) : Math.max(item.value, suggested);
    return { ...item, value };
  });
}

function runsFromDir(dir: string): Map<string, Lhr[]> {
  const manifest = resolve(dir, "manifest.json");
  if (!existsSync(manifest)) throw new Error(`No Lighthouse manifest at ${manifest}`);
  const byPath = new Map<string, Lhr[]>();
  for (const run of JSON.parse(readFileSync(manifest, "utf8")) as {
    url: string;
    jsonPath: string;
  }[]) {
    const pathname = new URL(run.url).pathname;
    byPath.set(pathname, [
      ...(byPath.get(pathname) ?? []),
      JSON.parse(readFileSync(run.jsonPath, "utf8")) as Lhr,
    ]);
  }
  return byPath;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (name: string) =>
    args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const file = args.find((arg) => !arg.startsWith("--"));
  const usage = () => {
    console.error(
      "Usage: node tools/lhci-assert.ts <ratchet.json> [--dir=.lighthouseci] [--config=lighthouserc.json] [--runs=N] [--tolerance=0.15] [--allow-missing-paths] [--suggest]",
    );
    process.exit(2);
  };
  if (!file) usage();
  const tolerance = Number(flag("tolerance") ?? "0");
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 0.5) {
    console.error(`--tolerance must be a number between 0 and 0.5`);
    process.exit(2);
  }
  const configFile = flag("config") ?? "lighthouserc.json";
  const configRuns = existsSync(configFile)
    ? (
        JSON.parse(readFileSync(configFile, "utf8")) as {
          ci?: { collect?: { numberOfRuns?: number } };
        }
      ).ci?.collect?.numberOfRuns
    : undefined;
  const expectedRuns = flag("runs") !== undefined ? Number(flag("runs")) : configRuns;
  if (expectedRuns !== undefined && (!Number.isInteger(expectedRuns) || expectedRuns < 1)) {
    console.error("--runs must be a positive integer");
    process.exit(2);
  }
  const ratchet = JSON.parse(readFileSync(file as string, "utf8")) as {
    values: RatchetValue[];
    [key: string]: unknown;
  };
  const runs = runsFromDir(flag("dir") ?? ".lighthouseci");
  if (args.includes("--suggest")) {
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
          source: `lhci-assert --suggest, median of ${expectedRuns ?? "?"} runs with 10% headroom`,
          values: suggestRatchet(ratchet.values, runs),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }
  const { failures, checked } = assertRatchet(ratchet.values, runs, {
    tolerance,
    allowMissingPaths: args.includes("--allow-missing-paths"),
    ...(expectedRuns === undefined ? {} : { expectedRuns }),
  });
  console.log(
    `Ratchet ${file}: ${checked}/${ratchet.values.length} values checked, tolerance ${tolerance * 100}%`,
  );
  for (const f of failures) console.error(`FAIL ${f.key}: ${f.reason}`);
  process.exit(failures.length || checked === 0 ? 1 : 0);
}
