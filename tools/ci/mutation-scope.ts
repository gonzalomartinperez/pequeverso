/**
 * Which changed files the pull-request mutation run covers (ADR-0015). Prints the changed files that
 * match the `mutate` globs of stryker.config.json as one comma-separated list (what `stryker run
 * --mutate` takes); prints nothing when none match, which the job treats as "nothing to mutate".
 *
 *   node tools/ci/mutation-scope.ts <base-ref>   changed files = git diff <base-ref>...HEAD
 *   node tools/ci/mutation-scope.ts --files a b  explicit file list (tests)
 */
// @ts-nocheck

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { matchesGlob } from "node:path";
import { pathToFileURL } from "node:url";

/** Repository-relative files that fall inside the mutation scope; test files never do. */
export function inScope(files: readonly string[], globs: readonly string[]): string[] {
  return files.filter(
    (file) => !file.endsWith(".test.ts") && globs.some((glob) => matchesGlob(file, glob)),
  );
}

export function mutateGlobs(configPath = "stryker.config.json"): string[] {
  const config = JSON.parse(readFileSync(configPath, "utf8")) as { mutate?: unknown };
  if (!Array.isArray(config.mutate) || config.mutate.some((glob) => typeof glob !== "string")) {
    throw new Error(`${configPath}: "mutate" must be a list of globs`);
  }
  return config.mutate as string[];
}

function changedFiles(baseRef: string): string[] {
  const out = execFileSync("git", ["diff", "--name-only", "--diff-filter=d", `${baseRef}...HEAD`], {
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [first, ...rest] = process.argv.slice(2);
  if (first === undefined)
    throw new Error("usage: mutation-scope.ts <base-ref> | --files <file>...");
  const files = first === "--files" ? rest : changedFiles(first);
  process.stdout.write(inScope(files, mutateGlobs()).join(","));
}
