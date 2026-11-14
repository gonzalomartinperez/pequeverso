// Asserts the median of every Lighthouse CI run per URL against a ratchet file (M2-1).
// Usage: node tools/lhci-assert.ts <ratchet.json> [--tolerance=0.15] [--dir=.lighthouseci]
// Ratchet keys are "<pathname> <metric>"; metrics: performance, accessibility, best-practices, seo
// (score 0-100), lcp, tbt (s or ms), cls, js-kb (script transfer KB). Keys whose pathname was not
// collected are skipped. `direction` max is a ceiling and min is a floor; `--tolerance` widens the
// limit by a fraction (noisy live lane); CLS gets 0.01 absolute slack on a ratchet of 0.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RatchetValue } from "./scorecard/ratchets.ts";

export type Lhr = {
  categories: Record<string, { score?: number | null } | undefined>;
  audits: Record<
    string,
    { numericValue?: number; details?: { items?: Record<string, unknown>[] } } | undefined
  >;
};
export type Failure = { key: string; measured: number; limit: number; unit: string };

const categories = ["performance", "accessibility", "best-practices", "seo"];

/** One metric of one run, in the unit used by the ratchet; undefined when the run lacks it. */
export function metricOf(lhr: Lhr, metric: string, unit: string): number | undefined {
  const audit = (id: string) => lhr.audits[id]?.numericValue;
  let raw: number | undefined;
  if (categories.includes(metric)) {
    const score = lhr.categories[metric]?.score;
    raw = score == null ? undefined : score * 100;
  } else if (metric === "lcp") {
    raw = audit("largest-contentful-paint");
    if (raw !== undefined) raw = unit === "s" ? raw / 1000 : raw;
  } else if (metric === "tbt") {
    raw = audit("total-blocking-time");
    if (raw !== undefined) raw = unit === "s" ? raw / 1000 : raw;
  } else if (metric === "cls") {
    raw = audit("cumulative-layout-shift");
  } else if (metric === "js-kb") {
    const items = lhr.audits["resource-summary"]?.details?.items ?? [];
    const bytes = items.find((item) => item.resourceType === "script")?.transferSize;
    raw = typeof bytes === "number" ? bytes / 1000 : undefined;
  }
  return raw;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/** Compares the per-path median of every ratchet key with its limit; returns the failures. */
export function assertRatchet(
  values: RatchetValue[],
  runsByPath: Map<string, Lhr[]>,
  tolerance = 0,
): { failures: Failure[]; checked: number } {
  const failures: Failure[] = [];
  let checked = 0;
  for (const item of values) {
    const space = item.key.indexOf(" ");
    const runs = runsByPath.get(item.key.slice(0, space));
    if (!runs) continue;
    const samples = runs
      .map((lhr) => metricOf(lhr, item.key.slice(space + 1), item.unit))
      .filter((sample): sample is number => sample !== undefined);
    if (samples.length === 0) continue;
    checked += 1;
    const measured = median(samples);
    const slack = item.value === 0 && item.unit === "" ? 0.01 : Math.abs(item.value) * tolerance;
    const limit = item.direction === "max" ? item.value + slack : item.value - slack;
    if (item.direction === "max" ? measured > limit : measured < limit)
      failures.push({ key: item.key, measured, limit, unit: item.unit });
  }
  return { failures, checked };
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
  const flag = (name: string, fallback: string) =>
    args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!file) {
    console.error(
      "Usage: node tools/lhci-assert.ts <ratchet.json> [--tolerance=0.15] [--dir=.lighthouseci]",
    );
    process.exit(2);
  }
  const ratchet = JSON.parse(readFileSync(file, "utf8")) as { values: RatchetValue[] };
  const tolerance = Number(flag("tolerance", "0"));
  const { failures, checked } = assertRatchet(
    ratchet.values,
    runsFromDir(flag("dir", ".lighthouseci")),
    tolerance,
  );
  console.log(`Ratchet ${file}: ${checked} values checked, tolerance ${tolerance * 100}%`);
  for (const f of failures)
    console.error(
      `FAIL ${f.key}: median ${f.measured.toFixed(2)} ${f.unit} vs limit ${f.limit.toFixed(2)}`,
    );
  if (checked === 0) {
    console.error("No ratchet key matched a collected URL");
    process.exit(1);
  }
  process.exit(failures.length ? 1 : 0);
}
