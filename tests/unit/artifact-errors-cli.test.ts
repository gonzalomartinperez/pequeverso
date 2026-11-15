import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cleanEnv, runCli } from "./cli-process.ts";

test("artifact CLI fails closed on invalid operations, roots and candidate identity", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-artifact-errors-"));
  const source = "a".repeat(40);
  try {
    mkdirSync(join(root, "config"));
    writeFileSync(join(root, "config/next.ts"), "// fixture");
    writeFileSync(join(root, "config/edge-rules.json"), "{}");
    writeFileSync(join(root, "package-lock.json"), "{}");
    const env = {
      ...cleanEnv(),
      GITHUB_SHA: source,
      GITHUB_REPOSITORY: "gonzalomartinperez/pequeverso",
      GITHUB_WORKFLOW_SHA: source,
      GITHUB_RUN_ID: "1",
      GITHUB_RUN_ATTEMPT: "1",
      CI_CANDIDATE_SHA: source,
      FIXTURE_GIT_ARGS: JSON.stringify(["rev-parse", "HEAD"]),
      FIXTURE_GIT_OUTPUT: source,
    };
    const cases: { args: string[]; overrides?: Partial<NodeJS.ProcessEnv> }[] = [
      { args: [] },
      { args: ["unknown", "out", "unused"] },
      { args: ["pack-off", "wrong", "unused"] },
      { args: ["attest-native", "out", "unused"] },
      { args: ["pack-off", "sites", "unused"] },
      { args: ["pack-off", "site/", "unused"] },
      { args: ["pack-off", "./site", "unused"] },
      { args: ["pack-off", "site", "unused"] },
      { args: ["unpack-off", "site", "unused"] },
      { args: ["unpack-off", "elsewhere", "unused"] },
      { args: ["attest-native", "site", "unused"] },
      { args: ["pack-off", "out", "unused"], overrides: { CI_CANDIDATE_SHA: "c".repeat(40) } },
      { args: ["pack-off", "out", "unused"], overrides: { FIXTURE_GIT_OUTPUT: "c".repeat(40) } },
    ];
    for (const { args, overrides } of cases) {
      const result = runCli(
        new URL("./cli-git-fixture.ts", import.meta.url).pathname,
        [new URL("../../tools/ci/artifacts.ts", import.meta.url).pathname, ...args],
        root,
        { ...env, ...overrides },
      );
      assert.equal(result.status, 1);
      assert.equal(
        result.stderr,
        "Candidate artifact validation failed (input details withheld).\n",
      );
      assert.equal(result.stdout, "");
      assert.equal(existsSync(join(root, "unused")), false);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
