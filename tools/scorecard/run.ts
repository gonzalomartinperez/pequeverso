// Scorecard CLI: aggregates CI artifacts into scorecard.json and fails on a regression against the
// committed ratchets/*.json baselines. Missing inputs are reported as `missing`, never as pass.
// Usage: node tools/scorecard/run.ts [--inputs <dir>] [--out scorecard.json] [--ratchets <dir>]
//   <dir>/coverage/lcov.info      node --experimental-test-coverage --test-reporter=lcov
//   <dir>/bundle.json             node tools/check-bundle-budget.ts --json <dir>/bundle.json
//   <dir>/.lighthouseci/          lhci output (manifest.json plus the run json files)
// Repo size is measured from `git ls-files` in the working directory.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { loadRatchets } from "./ratchets.ts";
import {
  buildScorecard,
  bundleMeasurements,
  lighthouseMeasurements,
  type Measurements,
  parseLcov,
  regressions,
  repoSizeMeasurements,
  unmetRequirements,
} from "./scorecard.ts";

type ManifestRun = { url: string; jsonPath: string };
type Lhr = {
  categories?: { performance?: { score?: unknown } };
  audits?: Record<string, { numericValue?: unknown } | undefined>;
};

function readLighthouse(dir: string): Record<string, number> | undefined {
  const manifest = path.join(dir, ".lighthouseci", "manifest.json");
  if (!existsSync(manifest)) return undefined;
  const runs = JSON.parse(readFileSync(manifest, "utf8")) as ManifestRun[];
  return lighthouseMeasurements(
    runs.map((run) => {
      const lhr = JSON.parse(
        readFileSync(path.resolve(dir, ".lighthouseci", run.jsonPath), "utf8"),
      ) as Lhr;
      const audits = lhr.audits ?? {};
      return {
        path: new URL(run.url).pathname,
        performance: lhr.categories?.performance?.score,
        lcp: audits["largest-contentful-paint"]?.numericValue,
        tbt: audits["total-blocking-time"]?.numericValue,
        cls: audits["cumulative-layout-shift"]?.numericValue,
      };
    }),
  );
}

function readRepoSize(cwd: string): Record<string, number> {
  const listed = execFileSync("git", ["ls-files", "-z"], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean);
  return repoSizeMeasurements(
    listed
      .filter((file) => existsSync(path.join(cwd, file)))
      .map((file) => ({
        path: file,
        size: statSync(path.join(cwd, file)).size,
      })),
  );
}

/** Runs a collector; a missing input or a malformed file is recorded as a problem, never thrown. */
function collect(
  metric: string,
  measurements: Measurements,
  problems: Record<string, string>,
  read: () => Record<string, number> | undefined,
): void {
  try {
    const found = read();
    if (found === undefined) problems[metric] = "input not found";
    else measurements[metric] = found;
  } catch (error) {
    problems[metric] = `malformed input: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function main(): void {
  const { values } = parseArgs({
    options: {
      inputs: { type: "string", default: "." },
      out: { type: "string", default: "scorecard.json" },
      ratchets: { type: "string", default: path.resolve(import.meta.dirname, "../../ratchets") },
      need: { type: "string", default: "" },
    },
  });
  const measurements: Measurements = {};
  const problems: Record<string, string> = {};
  const inFile = (...parts: string[]): string | undefined => {
    const file = path.join(values.inputs, ...parts);
    return existsSync(file) ? file : undefined;
  };
  collect("coverage", measurements, problems, () => {
    const file = inFile("coverage", "lcov.info");
    return file ? parseLcov(readFileSync(file, "utf8")) : undefined;
  });
  collect("bundle", measurements, problems, () => {
    const file = inFile("bundle.json");
    return file ? bundleMeasurements(JSON.parse(readFileSync(file, "utf8"))) : undefined;
  });
  collect("lighthouse", measurements, problems, () => readLighthouse(values.inputs));
  collect("repo-size", measurements, problems, () => readRepoSize(process.cwd()));

  const commit =
    process.env.GITHUB_SHA ??
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const scorecard = buildScorecard(
    loadRatchets(values.ratchets),
    measurements,
    { generatedAt: new Date().toISOString(), commit },
    problems,
  );
  writeFileSync(values.out, `${JSON.stringify(scorecard, null, 2)}\n`);
  const { pass, fail, missing } = scorecard.summary;
  console.log(`scorecard: ${pass} pass, ${fail} regressions, ${missing} missing -> ${values.out}`);
  for (const [metric, reason] of Object.entries(problems))
    console.log(`missing ${metric}: ${reason}`);
  const lines = regressions(scorecard);
  for (const line of lines) console.log(`REGRESSION ${line}`);
  const required = values.need.split(",").filter(Boolean);
  const unmet = unmetRequirements(scorecard, required);
  for (const metric of unmet) console.log(`REQUIRED input incomplete: ${metric}`);
  if (lines.length || unmet.length) process.exitCode = 1;
}

if (import.meta.main) main();
