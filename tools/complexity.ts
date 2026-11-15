// Cognitive complexity measurement for ratchets/complexity.json (roadmap M4-3, ecosystem 10.1:
// at most 10 per function). Runs Biome's noExcessiveCognitiveComplexity at threshold 10 with a
// throwaway configuration (the repository's biome.json stays the lint gate) and counts the
// functions above the threshold, split into tests and everything else, plus the maximum score.
// Usage: node tools/complexity.ts [--json]
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const THRESHOLD = 10;
export const SCOPE = ["src", "config", "content", "tools", "tests"] as const;
const RULE = "lint/complexity/noExcessiveCognitiveComplexity";

export type Finding = { path: string; line: number; score: number };
export type Report = { findings: Finding[]; files: number };
export type Measurement = {
  "functions over 10 (src, config, content, tools)": number;
  "functions over 10 (tests)": number;
  "max cognitive complexity": number;
};

/** The standalone Biome configuration: only the complexity rule, TypeScript sources only. */
export function measureConfig(): string {
  return `${JSON.stringify(
    {
      root: true,
      vcs: { enabled: false },
      files: { includes: ["**/*.ts", "**/*.tsx", "!**/node_modules"] },
      linter: {
        rules: {
          preset: "none",
          complexity: {
            noExcessiveCognitiveComplexity: {
              level: "error",
              options: { maxAllowedComplexity: THRESHOLD },
            },
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

type Diagnostic = {
  category?: unknown;
  severity?: unknown;
  message?: unknown;
  location?: { path?: unknown; start?: { line?: unknown } };
};

/** One complexity finding; any other error (unreadable path, parse error) fails closed. */
function findingOf(diagnostic: Diagnostic): Finding[] {
  if (diagnostic.category !== RULE) {
    if (diagnostic.severity !== "error") return [];
    throw new Error(`biome could not measure: ${String(diagnostic.category)}`);
  }
  const score = /complexity of (\d+)/.exec(String(diagnostic.message))?.[1];
  const path = diagnostic.location?.path;
  if (score === undefined || typeof path !== "string")
    throw new Error("unreadable complexity diagnostic");
  const line = diagnostic.location?.start?.line;
  return [{ path, line: typeof line === "number" ? line : 0, score: Number(score) }];
}

/** Findings and the number of files Biome checked, from its JSON reporter output. */
export function parseReport(report: string): Report {
  const parsed = JSON.parse(report) as { diagnostics?: unknown; summary?: unknown } | null;
  if (!parsed || !Array.isArray(parsed.diagnostics))
    throw new Error("biome report without diagnostics");
  const summary = (parsed.summary ?? {}) as { changed?: unknown; unchanged?: unknown };
  const files = Number(summary.changed ?? 0) + Number(summary.unchanged ?? 0);
  if (!Number.isFinite(files)) throw new Error("biome report without a file count");
  return { findings: (parsed.diagnostics as Diagnostic[]).flatMap(findingOf), files };
}

export function summarize(findings: readonly Finding[]): Measurement {
  const tests = findings.filter((finding) => finding.path.startsWith("tests/")).length;
  return {
    "functions over 10 (src, config, content, tools)": findings.length - tests,
    "functions over 10 (tests)": tests,
    "max cognitive complexity": Math.max(0, ...findings.map((finding) => finding.score)),
  };
}

/** Runs Biome over `scope` from `root`: every function above the threshold and the files checked. */
export function measure(
  root: string = process.cwd(),
  scope: readonly string[] = SCOPE,
  biome: string = resolve(root, "node_modules/.bin/biome"),
): Report {
  const missing = scope.filter((entry) => !existsSync(join(root, entry)));
  if (missing.length > 0) throw new Error(`complexity scope missing: ${missing.join(", ")}`);
  const config = mkdtempSync(join(tmpdir(), "pv-complexity-"));
  try {
    writeFileSync(join(config, "biome.json"), measureConfig());
    const args = ["lint", `--config-path=${config}`, "--reporter=json", "--max-diagnostics=none"];
    let stdout: string;
    try {
      stdout = execFileSync(biome, [...args, ...scope], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
        timeout: 120_000,
      });
    } catch (error) {
      // Biome exits 1 when it reports errors; the findings are still on stdout.
      const out = (error as { stdout?: unknown }).stdout;
      if (typeof out !== "string" || !out.trim()) throw error;
      stdout = out;
    }
    const report = parseReport(stdout);
    if (report.files === 0) throw new Error("biome checked no files");
    return report;
  } finally {
    rmSync(config, { recursive: true, force: true });
  }
}

/** Report lines: the summary as JSON with `--json`, else every finding (worst first) then it. */
export function report(findings: readonly Finding[], argv: readonly string[]): string[] {
  if (argv.includes("--json")) return [JSON.stringify(summarize(findings), null, 2)];
  const sorted = [...findings].sort((a, b) => b.score - a.score);
  return [
    ...sorted.map(({ path, line, score }) => `${score}\t${path}:${line}`),
    JSON.stringify(summarize(findings)),
  ];
}

if (import.meta.main)
  for (const line of report(measure().findings, process.argv)) console.log(line);
