// Diff coverage gate (roadmap M2-5, docs/master-plan/testing.md section 1): the share of changed
// code lines that the unit tests execute. No dependency: it reads node's lcov report and the
// zero-context unified diff of the branch. Counted: added lines with a DA record in a file of the
// report (blank and comment-only lines dropped by a source-text heuristic), plus every added code
// line of an in-scope source file (inScope) that the report lacks, which fails as "not measured".
// Docs, JSON, tests, .tsx components and other files are ignored.
// Usage: node tools/ci/diff-coverage.ts [--lcov coverage/lcov.info] [--base origin/develop] [--min 85]
//   without --min the floor is ratchets/diff-coverage.json ("changed lines").
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export type LineHits = Map<number, number>;
export type DiffCoverage = {
  covered: number;
  counted: number;
  percent: number;
  uncovered: Map<string, number[]>;
  /** In-scope changed files that no test loaded (absent from lcov); every changed code line counts as uncovered. */
  notMeasured: Map<string, number[]>;
};

function lcovFileEntry(files: Map<string, LineHits>, root: string, line: string): LineHits {
  const file = path
    .relative(root, path.resolve(root, line.slice(3)))
    .split(path.sep)
    .join("/");
  const current = files.get(file) ?? new Map();
  files.set(file, current);
  return current;
}

function addLcovHit(current: LineHits, line: string): void {
  const [number, hits] = line.slice(3).split(",").map(Number);
  if (Number.isInteger(number) && Number.isFinite(hits))
    current.set(number as number, (current.get(number as number) ?? 0) + (hits as number));
}

/** lcov text to `repo-relative file -> line -> hits` (DA records). */
export function parseLcovLines(text: string, root: string): Map<string, LineHits> {
  const files = new Map<string, LineHits>();
  let current: LineHits | undefined;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("SF:")) current = lcovFileEntry(files, root, line);
    else if (line === "end_of_record") current = undefined;
    else if (line.startsWith("DA:") && current) addLcovHit(current, line);
  }
  return files;
}

// `---`/`+++` are headers only between `diff --git` and the first hunk; inside a hunk a content
// line such as `+++ x` (an added `++ x`) is data.
type DiffState = {
  changed: Map<string, Set<number>>;
  lines: Set<number> | undefined;
  header: "none" | "start" | "old";
};

function readNewTarget(state: DiffState, line: string): void {
  const target = line.slice(4).replace(/\t.*$/, "");
  state.lines = target === "/dev/null" ? undefined : new Set();
  if (state.lines) state.changed.set(target.replace(/^b\//, ""), state.lines);
  state.header = "none";
}

function readHunk(state: DiffState, line: string): void {
  state.header = "none";
  if (!state.lines) return;
  const hunk = /\+(\d+)(?:,(\d+))?/.exec(line);
  const start = Number(hunk?.[1]);
  const count = hunk?.[2] === undefined ? 1 : Number(hunk[2]);
  for (let offset = 0; offset < count; offset += 1) state.lines.add(start + offset);
}

function readDiffLine(state: DiffState, line: string): void {
  if (line.startsWith("diff --git ")) {
    state.header = "start";
    state.lines = undefined;
  } else if (state.header === "start" && line.startsWith("--- ")) state.header = "old";
  else if (state.header === "old" && line.startsWith("+++ ")) readNewTarget(state, line);
  else if (line.startsWith("@@")) readHunk(state, line);
}

/** `git diff --unified=0` output to `file -> added line numbers`. */
export function parseChangedLines(diff: string): Map<string, Set<number>> {
  const state: DiffState = { changed: new Map(), lines: undefined, header: "none" };
  for (const line of diff.split("\n")) readDiffLine(state, line);
  return state.changed;
}

/**
 * Source files the unit run can load and measure: TypeScript under tools, src and config. Components
 * (.tsx) are excluded on purpose: most are never loaded by node:test (Playwright covers them), so
 * counting the absent ones would fail every UI change; loaded ones are measured via the lcov. Tests, declarations and generated files are out too.
 */
export function inScope(file: string): boolean {
  return (
    /^(tools|src|config)\/.+\.ts$/.test(file) &&
    !file.endsWith(".d.ts") &&
    !/(^|\/)(generated|__generated__)\//.test(file)
  );
}

/** A line worth covering: node reports every line, comments included, so drop blanks and comments. */
export function isCodeLine(text: string): boolean {
  const line = text.trim();
  return line !== "" && !/^(\/\/|\/\*|\*)/.test(line);
}

type Tally = {
  covered: number;
  measured: number;
  uncovered: Map<string, number[]>;
  notMeasured: Map<string, number[]>;
};

function miss(target: Map<string, number[]>, file: string, number: number): void {
  target.set(file, [...(target.get(file) ?? []), number]);
}

function tallyLine(tally: Tally, file: string, number: number, hits: LineHits | undefined): void {
  tally.measured += 1;
  if (!hits) {
    // In scope but never loaded by a test: every changed code line is uncovered.
    miss(tally.notMeasured, file, number);
    return;
  }
  const count = hits.get(number);
  if (count === undefined) tally.measured -= 1;
  else if (count > 0) tally.covered += 1;
  else miss(tally.uncovered, file, number);
}

export function diffCoverage(
  coverage: Map<string, LineHits>,
  changed: Map<string, Set<number>>,
  isCode: (file: string, line: number) => boolean = () => true,
): DiffCoverage {
  const tally: Tally = { covered: 0, measured: 0, uncovered: new Map(), notMeasured: new Map() };
  for (const [file, lines] of changed) {
    const hits = coverage.get(file);
    if (!hits && !inScope(file)) continue;
    for (const number of [...lines].sort((a, b) => a - b)) {
      if (isCode(file, number)) tallyLine(tally, file, number, hits);
    }
  }
  const { covered, measured, uncovered, notMeasured } = tally;
  // Nothing measurable changed: the gate has nothing to judge and passes (the CLI says so).
  return {
    covered,
    counted: measured,
    percent: measured ? (covered / measured) * 100 : 100,
    uncovered,
    notMeasured,
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
    const coverage = parseLcovLines(lcov, root);
    if (!coverage.size) throw new Error("The lcov report has no SF records: nothing was measured");
    const diff = execFileSync(
      "git",
      [
        "-c",
        "core.quotePath=false",
        "diff",
        "--unified=0",
        "--no-color",
        "--no-ext-diff",
        "--src-prefix=a/",
        "--dst-prefix=b/",
        `${base}...HEAD`,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    const sources = new Map<string, string[] | undefined>();
    const isCode = (file: string, line: number): boolean => {
      if (!sources.has(file)) {
        try {
          sources.set(file, readFileSync(path.join(root, file), "utf8").split("\n"));
        } catch {
          sources.set(file, undefined);
        }
      }
      const text = sources.get(file)?.[line - 1];
      return text === undefined || isCodeLine(text);
    };
    const result = diffCoverage(coverage, parseChangedLines(diff), isCode);
    for (const [file, lines] of result.uncovered)
      console.log(`uncovered ${file}: ${lines.join(", ")}`);
    for (const [file, lines] of result.notMeasured)
      console.log(`not measured (no test loads ${file}): ${lines.join(", ")}`);
    if (!result.counted)
      console.log("nothing measured: no changed code line is in a measured or in-scope file");
    console.log(
      `diff coverage ${result.percent.toFixed(2)}% (${result.covered}/${result.counted} changed code lines), floor ${min}%`,
    );
    if (result.percent < min) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
