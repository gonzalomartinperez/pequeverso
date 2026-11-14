// Diff coverage gate (roadmap M2-5, docs/master-plan/testing.md section 1): the share of changed
// executable lines that the unit tests execute. No dependency: it reads node's lcov report and the
// zero-context unified diff of the branch. Only files that appear in the lcov report count, and only
// lines with a DA record (executable) count, so docs, JSON, tests and untracked files are ignored.
// Usage: node tools/ci/diff-coverage.ts [--lcov coverage/lcov.info] [--base origin/develop] [--min 85]
//   without --min the floor is ratchets/diff-coverage.json ("changed lines").
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export type LineHits = Map<number, number>;
export type DiffCoverage = {
  covered: number;
  executable: number;
  percent: number;
  uncovered: Map<string, number[]>;
};

/** lcov text to `repo-relative file -> line -> hits` (DA records). */
export function parseLcovLines(text: string, root: string): Map<string, LineHits> {
  const files = new Map<string, LineHits>();
  let current: LineHits | undefined;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("SF:")) {
      const file = path
        .relative(root, path.resolve(root, line.slice(3)))
        .split(path.sep)
        .join("/");
      current = files.get(file) ?? new Map();
      files.set(file, current);
    } else if (line === "end_of_record") current = undefined;
    else if (line.startsWith("DA:") && current) {
      const [number, hits] = line.slice(3).split(",").map(Number);
      if (Number.isInteger(number) && Number.isFinite(hits))
        current.set(number as number, (current.get(number as number) ?? 0) + (hits as number));
    }
  }
  return files;
}

/** `git diff --unified=0` output to `file -> added line numbers`. */
export function parseChangedLines(diff: string): Map<string, Set<number>> {
  const changed = new Map<string, Set<number>>();
  let lines: Set<number> | undefined;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const target = line.slice(4);
      lines = target === "/dev/null" ? undefined : new Set();
      if (lines) changed.set(target.replace(/^b\//, ""), lines);
    } else if (lines && line.startsWith("@@")) {
      const hunk = /\+(\d+)(?:,(\d+))?/.exec(line);
      const start = Number(hunk?.[1]);
      const count = hunk?.[2] === undefined ? 1 : Number(hunk[2]);
      for (let offset = 0; offset < count; offset += 1) lines.add(start + offset);
    }
  }
  return changed;
}

export function diffCoverage(
  coverage: Map<string, LineHits>,
  changed: Map<string, Set<number>>,
): DiffCoverage {
  const uncovered = new Map<string, number[]>();
  let covered = 0;
  let executable = 0;
  for (const [file, lines] of changed) {
    const hits = coverage.get(file);
    if (!hits) continue;
    for (const number of [...lines].sort((a, b) => a - b)) {
      const count = hits.get(number);
      if (count === undefined) continue;
      executable += 1;
      if (count > 0) covered += 1;
      else uncovered.set(file, [...(uncovered.get(file) ?? []), number]);
    }
  }
  // Nothing executable changed: the gate has nothing to judge and passes.
  return {
    covered,
    executable,
    percent: executable ? (covered / executable) * 100 : 100,
    uncovered,
  };
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function floorFromRatchet(root: string): number {
  const data = JSON.parse(readFileSync(path.join(root, "ratchets/diff-coverage.json"), "utf8")) as {
    values: { key: string; value: number }[];
  };
  const value = data.values.find((item) => item.key === "changed lines")?.value;
  if (typeof value !== "number")
    throw new Error("ratchets/diff-coverage.json has no changed lines");
  return value;
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    const root = process.cwd();
    const base = option(args, "--base") ?? "origin/develop";
    const min = Number(option(args, "--min") ?? floorFromRatchet(root));
    if (!Number.isFinite(min)) throw new Error("--min must be a number");
    const lcov = readFileSync(option(args, "--lcov") ?? "coverage/lcov.info", "utf8");
    const diff = execFileSync("git", ["diff", "--unified=0", "--no-color", `${base}...HEAD`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const result = diffCoverage(parseLcovLines(lcov, root), parseChangedLines(diff));
    for (const [file, lines] of result.uncovered)
      console.log(`uncovered ${file}: ${lines.join(", ")}`);
    console.log(
      `diff coverage ${result.percent.toFixed(2)}% (${result.covered}/${result.executable} changed executable lines), floor ${min}%`,
    );
    if (result.percent < min) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
