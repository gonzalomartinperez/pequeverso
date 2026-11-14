// Scorecard core (roadmap M2-9, docs/master-plan/scorecard.md section 3): pure collectors that turn
// CI artifacts into measurements keyed like the ratchet files, and a comparison with the committed
// baselines. No file or process access here; tools/scorecard/run.ts does the I/O.
import { holds, type Ratchet } from "./ratchets.ts";

export type Measurements = Record<string, Record<string, number>>; // metric -> key -> value
export type Status = "pass" | "fail" | "missing";
export type MetricResult = {
  key: string;
  baseline: number;
  measured: number | null;
  unit: string;
  direction: "min" | "max";
  status: Status;
};

/** Coverage percentages from an lcov report (LF/LH lines, BRF/BRH branches, FNF/FNH functions). */
export function parseLcov(text: string): Record<string, number> {
  const sums: Record<string, number> = { LF: 0, LH: 0, BRF: 0, BRH: 0, FNF: 0, FNH: 0 };
  for (const line of text.split("\n")) {
    const [tag, raw] = line.trim().split(":");
    const value = Number(raw);
    if (tag !== undefined && tag in sums && Number.isFinite(value))
      sums[tag] = (sums[tag] ?? 0) + value;
  }
  const pct = (hit: number, found: number): number => (found ? (hit / found) * 100 : 0);
  if (!sums.LF) return {};
  return {
    lines: pct(sums.LH ?? 0, sums.LF),
    branches: pct(sums.BRH ?? 0, sums.BRF ?? 0),
    functions: pct(sums.FNH ?? 0, sums.FNF ?? 0),
  };
}

/** `check-bundle-budget --json` rows ({route, metric, kb}) to ratchet keys ("/ js"). */
export function bundleMeasurements(
  rows: readonly { route: string; metric: string; kb: number }[],
): Record<string, number> {
  return Object.fromEntries(
    rows
      .filter((row) => typeof row.kb === "number" && Number.isFinite(row.kb))
      .map((row) => [`${row.route} ${row.metric}`, row.kb]),
  );
}

export type LighthouseRun = {
  path: string;
  performance?: unknown;
  lcp?: unknown;
  tbt?: unknown;
  cls?: unknown;
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

/**
 * Lighthouse medians per URL and metric over every run (not lhci's representative run): score 0-100,
 * lcp and tbt in seconds, cls. A value that is not a number in any run is skipped, so a metric with
 * no numeric value stays unmeasured (missing).
 */
export function lighthouseMeasurements(runs: readonly LighthouseRun[]): Record<string, number> {
  const samples = new Map<string, number[]>();
  const add = (page: string, name: string, value: unknown, scale: number): void => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    const key = `${page} ${name}`;
    samples.set(key, [...(samples.get(key) ?? []), value * scale]);
  };
  for (const run of runs) {
    add(run.path, "performance", run.performance, 100);
    add(run.path, "lcp", run.lcp, 1 / 1000);
    add(run.path, "tbt", run.tbt, 1 / 1000);
    add(run.path, "cls", run.cls, 1);
  }
  return Object.fromEntries([...samples].map(([key, values]) => [key, median(values)]));
}

/** Repo size keys from tracked files (`git ls-files` plus stat). */
export function repoSizeMeasurements(
  files: readonly { path: string; size: number }[],
): Record<string, number> {
  return {
    "tracked bytes": files.reduce((sum, file) => sum + file.size, 0),
    "largest tracked file": files.reduce((max, file) => Math.max(max, file.size), 0),
    "public/media": files
      .filter((file) => file.path.startsWith("public/media/"))
      .reduce((sum, file) => sum + file.size, 0),
  };
}

/** Compares measurements with every baseline value. A metric with no measurement is `missing`. */
export function compare(
  ratchets: readonly Ratchet[],
  measurements: Measurements,
): Record<string, MetricResult[]> {
  const report: Record<string, MetricResult[]> = {};
  for (const ratchet of ratchets)
    report[ratchet.metric] = ratchet.values.map((baseline) => {
      const measured = measurements[ratchet.metric]?.[baseline.key] ?? null;
      const status: Status =
        measured === null ? "missing" : holds(baseline, measured) ? "pass" : "fail";
      return {
        key: baseline.key,
        baseline: baseline.value,
        measured,
        unit: baseline.unit,
        direction: baseline.direction,
        status,
      };
    });
  return report;
}

// Axes of docs/master-plan/scorecard.md. `ratchets` lists the committed baselines that feed an axis;
// `evaluator` axes are judged by the release evaluator agent and never computed here. Axes whose
// ratchet files have not landed yet list none. `repo-size` feeds no axis; it is reported under metrics.
const axes: Record<string, { evaluator?: true; ratchets: string[] }> = {
  D1: { ratchets: [] },
  D2: { ratchets: ["complexity"] },
  D3: { ratchets: ["coverage"] },
  D4: { ratchets: [] },
  D5: { ratchets: [] },
  D6: { ratchets: ["bundle", "lighthouse"] },
  D7: { ratchets: [] },
  D8: { ratchets: [] },
  P1: { ratchets: [] },
  P2: { ratchets: [] },
  P3: { ratchets: ["a11y"] },
  P4: { ratchets: [] },
  P5: { ratchets: [] },
  P6: { evaluator: true, ratchets: [] },
  C1: { evaluator: true, ratchets: [] },
  C2: { evaluator: true, ratchets: [] },
  C3: { evaluator: true, ratchets: [] },
  C4: { ratchets: ["lighthouse"] },
  C5: { evaluator: true, ratchets: [] },
  C6: { evaluator: true, ratchets: [] },
  C7: { evaluator: true, ratchets: [] },
};

export type AxisReport = {
  kind: "automatic" | "evaluator" | "unmeasured";
  inputs: string[];
  status: Status | "evaluator" | "unmeasured";
};

/** Rolls the metric statuses up per axis: fail if any fails, missing if any is missing, else pass. */
export function axisReports(report: Record<string, MetricResult[]>): Record<string, AxisReport> {
  const out: Record<string, AxisReport> = {};
  for (const [axis, spec] of Object.entries(axes)) {
    if (spec.evaluator) {
      out[axis] = { kind: "evaluator", inputs: [], status: "evaluator" };
      continue;
    }
    const groups = spec.ratchets.map((metric) => report[metric] ?? []);
    const results = groups.flat();
    const statuses = new Set(results.map((result) => result.status));
    out[axis] = {
      kind: spec.ratchets.length ? "automatic" : "unmeasured",
      inputs: spec.ratchets,
      status: !spec.ratchets.length
        ? "unmeasured"
        : statuses.has("fail")
          ? "fail"
          : statuses.has("missing") || groups.some((group) => !group.length)
            ? "missing"
            : "pass",
    };
  }
  return out;
}

export type Scorecard = {
  version: 1;
  generatedAt: string;
  commit: string;
  summary: { pass: number; fail: number; missing: number };
  /** Collector problems, keyed by metric (absent input or malformed file). */
  inputProblems: Record<string, string>;
  metrics: Record<string, MetricResult[]>;
  axes: Record<string, AxisReport>;
};

export function buildScorecard(
  ratchets: readonly Ratchet[],
  measurements: Measurements,
  meta: { generatedAt: string; commit: string },
  inputProblems: Record<string, string> = {},
): Scorecard {
  const metrics = compare(ratchets, measurements);
  const all = Object.values(metrics).flat();
  const count = (status: Status): number => all.filter((result) => result.status === status).length;
  return {
    version: 1,
    ...meta,
    summary: { pass: count("pass"), fail: count("fail"), missing: count("missing") },
    inputProblems,
    metrics,
    axes: axisReports(metrics),
  };
}

/** Human-readable regression lines for the failing metrics. */
export function regressions(scorecard: Scorecard): string[] {
  return Object.entries(scorecard.metrics).flatMap(([metric, results]) =>
    results
      .filter((result) => result.status === "fail")
      .map(
        (result) =>
          `${metric}: ${result.key} is ${result.measured} ${result.unit}, ${result.direction === "min" ? "floor" : "ceiling"} ${result.baseline}`,
      ),
  );
}

/** Required metrics (`--need coverage,bundle`) that have a missing value; empty means satisfied. */
export function unmetRequirements(scorecard: Scorecard, required: readonly string[]): string[] {
  return required.filter((metric) => {
    const results = scorecard.metrics[metric];
    return !results || results.some((result) => result.status === "missing");
  });
}
