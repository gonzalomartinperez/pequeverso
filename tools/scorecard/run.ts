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
} from "./scorecard.ts";

type ManifestRun = { url: string; jsonPath: string; isRepresentativeRun: boolean };
type Lhr = {
  categories?: { performance?: { score?: number } };
  audits?: Record<string, { numericValue?: number } | undefined>;
};

function readLighthouse(dir: string): Record<string, number> | undefined {
  const manifest = path.join(dir, ".lighthouseci", "manifest.json");
  if (!existsSync(manifest)) return undefined;
  const runs = (JSON.parse(readFileSync(manifest, "utf8")) as ManifestRun[]).filter(
    (run) => run.isRepresentativeRun,
  );
  return lighthouseMeasurements(
    runs.map((run) => {
      const lhr = JSON.parse(
        readFileSync(path.resolve(dir, ".lighthouseci", run.jsonPath), "utf8"),
      ) as Lhr;
      const audits = lhr.audits ?? {};
      return {
        path: new URL(run.url).pathname,
        ...(lhr.categories?.performance?.score === undefined
          ? {}
          : { performance: lhr.categories.performance.score }),
        ...(audits["largest-contentful-paint"]?.numericValue === undefined
          ? {}
          : { lcp: audits["largest-contentful-paint"].numericValue }),
        ...(audits["total-blocking-time"]?.numericValue === undefined
          ? {}
          : { tbt: audits["total-blocking-time"].numericValue }),
        ...(audits["cumulative-layout-shift"]?.numericValue === undefined
          ? {}
          : { cls: audits["cumulative-layout-shift"].numericValue }),
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

function main(): void {
  const { values } = parseArgs({
    options: {
      inputs: { type: "string", default: "." },
      out: { type: "string", default: "scorecard.json" },
      ratchets: { type: "string", default: path.resolve(import.meta.dirname, "../../ratchets") },
    },
  });
  const measurements: Measurements = {};
  const lcov = path.join(values.inputs, "coverage", "lcov.info");
  if (existsSync(lcov)) measurements.coverage = parseLcov(readFileSync(lcov, "utf8"));
  const bundle = path.join(values.inputs, "bundle.json");
  if (existsSync(bundle))
    measurements.bundle = bundleMeasurements(JSON.parse(readFileSync(bundle, "utf8")));
  const lighthouse = readLighthouse(values.inputs);
  if (lighthouse) measurements.lighthouse = lighthouse;
  measurements["repo-size"] = readRepoSize(process.cwd());

  const commit =
    process.env.GITHUB_SHA ??
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const scorecard = buildScorecard(loadRatchets(values.ratchets), measurements, {
    generatedAt: new Date().toISOString(),
    commit,
  });
  writeFileSync(values.out, `${JSON.stringify(scorecard, null, 2)}\n`);
  const { pass, fail, missing } = scorecard.summary;
  console.log(`scorecard: ${pass} pass, ${fail} regressions, ${missing} missing -> ${values.out}`);
  for (const line of regressions(scorecard)) console.error(`REGRESSION ${line}`);
  if (fail) process.exitCode = 1;
}

if (import.meta.main) main();
