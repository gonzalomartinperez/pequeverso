import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { prerequisites } from "../../tools/ci/acceptance.ts";
import { cleanEnv, runCli } from "./cli-process.ts";

const run = (_script: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) =>
  runCli(new URL("../../tools/ci/acceptance.ts", import.meta.url).pathname, args, cwd, env);

test("acceptance CLI requires the exact successful nightly evidence", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-acceptance-cli-"));
  try {
    const success = Object.fromEntries(
      prerequisites.nightly.map((name) => [name, { result: "success" }]),
    );
    const valid = run("ci/acceptance", ["nightly"], root, {
      ...cleanEnv(),
      CI_NEEDS: JSON.stringify(success),
    });
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /All required jobs completed successfully/);
    for (const [args, evidence] of [
      [[], "{}"],
      [["unknown"], "{}"],
      [["nightly"], "invalid"],
      [["nightly"], "null"],
      [["nightly"], JSON.stringify({ ...success, quality: { result: "failure" } })],
    ] as const) {
      const result = run("ci/acceptance", [...args], root, { ...cleanEnv(), CI_NEEDS: evidence });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Required checks failed/);
      assert.equal(result.stdout, "");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
