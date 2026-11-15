/**
 * Pull-request and weekly gate over a Stryker JSON report (ADR-0015). Stryker itself runs with
 * `thresholds.break` 0 on pull requests; this script decides.
 *
 *   node tools/ci/mutation-gate.ts --files a.ts,b.ts [--report <json>] [--ratchet <json>]
 *       fails when a listed file scores below its per-file baseline in ratchets/mutation.json;
 *       a file with no baseline must reach BREAK (60)
 *   node tools/ci/mutation-gate.ts --global
 *       fails when the whole report scores below the global `score` baseline
 *
 * Score = (killed + timeout) / (all mutants except runtime errors, compile errors and ignored).
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const BREAK = 60;
/** Baselines are rounded to two decimals; allow that rounding. */
const TOLERANCE = 0.01;

type Report = { files: Record<string, { mutants: { status: string }[] }> };
type Baselines = { score: number; files: Record<string, number> };

const DETECTED = new Set(["Killed", "Timeout"]);
const EXCLUDED = new Set(["RuntimeError", "CompileError", "Ignored"]);

/** Mutation score in percent, or undefined when no mutant counts. */
export function score(mutants: readonly { status: string }[]): number | undefined {
  const valid = mutants.filter((mutant) => !EXCLUDED.has(mutant.status));
  if (valid.length === 0) return undefined;
  return (100 * valid.filter((mutant) => DETECTED.has(mutant.status)).length) / valid.length;
}

export function readBaselines(ratchet: unknown): Baselines {
  const data = ratchet as {
    values?: { key: string; value: number }[];
    files?: Record<string, number>;
  };
  const global = data.values?.find((value) => value.key === "score")?.value;
  if (typeof global !== "number") throw new Error('ratchets/mutation.json has no "score" value');
  return { score: global, files: data.files ?? {} };
}

function checkFile(report: Report, baselines: Baselines, file: string): string | undefined {
  const entry = report.files[file];
  if (entry === undefined) return `${file}: not in the mutation report`;
  const value = score(entry.mutants);
  if (value === undefined) return undefined;
  const baseline = baselines.files[file];
  const floor = baseline ?? BREAK;
  if (value + TOLERANCE >= floor) return undefined;
  const why = baseline === undefined ? "no baseline, needs the global break" : "per-file baseline";
  return `${file}: score ${value.toFixed(2)} is below ${floor} (${why})`;
}

/** Problems for the listed files; empty means the gate passes. */
export function checkFiles(
  report: Report,
  baselines: Baselines,
  files: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const file of files) {
    const problem = checkFile(report, baselines, file);
    if (problem !== undefined) problems.push(problem);
  }
  return problems;
}

export function checkGlobal(report: Report, baselines: Baselines): string[] {
  const value = score(Object.values(report.files).flatMap((entry) => entry.mutants));
  if (value === undefined) return ["the report has no countable mutants"];
  return value + TOLERANCE < baselines.score
    ? [`global score ${value.toFixed(2)} is below the baseline ${baselines.score}`]
    : [];
}

function option(args: readonly string[], name: string, fallback: string): string {
  const at = args.indexOf(name);
  return at >= 0 ? (args[at + 1] ?? fallback) : fallback;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const report = JSON.parse(
    readFileSync(option(args, "--report", "reports/mutation/mutation.json"), "utf8"),
  ) as Report;
  const baselines = readBaselines(
    JSON.parse(readFileSync(option(args, "--ratchet", "ratchets/mutation.json"), "utf8")),
  );
  const files = option(args, "--files", "").split(",").filter(Boolean);
  const problems = args.includes("--global")
    ? checkGlobal(report, baselines)
    : checkFiles(report, baselines, files);
  for (const file of files) {
    const entry = report.files[file];
    const value = entry && score(entry.mutants);
    console.log(
      `${file}: ${value === undefined ? "n/a" : value.toFixed(2)} (baseline ${baselines.files[file] ?? `none, break ${BREAK}`})`,
    );
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`mutation gate: ${problem}`);
    process.exit(1);
  }
  console.log("mutation gate: ok");
}
