// Cognitive complexity measurement for ratchets/complexity.json (roadmap M4-3, ecosystem 10.1:
// at most 10 per function). Runs Biome's noExcessiveCognitiveComplexity at threshold 10 with a
// throwaway configuration (the repository's biome.json stays the lint gate) and counts the
// functions above the threshold, split into tests and everything else, plus the maximum score.
// Usage: node tools/complexity.ts [--json]
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const THRESHOLD = 10;
export const SCOPE = ["src", "config", "content", "tools", "tests"] as const;
const RULE = "lint/complexity/noExcessiveCognitiveComplexity";

export type Finding = { path: string; line: number; score: number };
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

/** Complexity findings from Biome's JSON reporter output; other diagnostics are ignored. */
export function parseFindings(report: string): Finding[] {
  const parsed: unknown = JSON.parse(report);
  const diagnostics =
    typeof parsed === "object" && parsed !== null && "diagnostics" in parsed
      ? (parsed as { diagnostics: unknown }).diagnostics
      : undefined;
  if (!Array.isArray(diagnostics)) throw new Error("biome report without diagnostics");
  return diagnostics.flatMap((item: unknown): Finding[] => {
    const diagnostic = item as {
      category?: unknown;
      message?: unknown;
      location?: { path?: unknown; start?: { line?: unknown } };
    };
    if (diagnostic.category !== RULE) return [];
    const score = /complexity of (\d+)/.exec(String(diagnostic.message))?.[1];
    const path = diagnostic.location?.path;
    if (score === undefined || typeof path !== "string")
      throw new Error("unreadable complexity diagnostic");
    const line = diagnostic.location?.start?.line;
    return [{ path, line: typeof line === "number" ? line : 0, score: Number(score) }];
  });
}

export function summarize(findings: readonly Finding[]): Measurement {
  const tests = findings.filter((finding) => finding.path.startsWith("tests/")).length;
  return {
    "functions over 10 (src, config, content, tools)": findings.length - tests,
    "functions over 10 (tests)": tests,
    "max cognitive complexity": Math.max(0, ...findings.map((finding) => finding.score)),
  };
}

/** Runs Biome over the scope from `root` and returns every function above the threshold. */
export function measure(root: string = process.cwd()): Finding[] {
  const config = mkdtempSync(join(tmpdir(), "pv-complexity-"));
  try {
    writeFileSync(join(config, "biome.json"), measureConfig());
    const biome = resolve(root, "node_modules/.bin/biome");
    const args = ["lint", `--config-path=${config}`, "--reporter=json", "--max-diagnostics=none"];
    let stdout: string;
    try {
      stdout = execFileSync(biome, [...args, ...SCOPE], {
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
    return parseFindings(stdout);
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

if (import.meta.main) for (const line of report(measure(), process.argv)) console.log(line);
