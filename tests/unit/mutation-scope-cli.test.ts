import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { mutateGlobs, smallestScoped } from "../../tools/ci/mutation-scope.ts";

import { cleanEnv, runCli } from "./cli-process.ts";

const run = (script: string, args: string[], cwd: string) =>
  runCli(new URL(`../../tools/ci/${script}.ts`, import.meta.url).pathname, args, cwd);

test("mutation scope CLI selects changed sources, smoke-runs tooling and skips unrelated changes", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-mutation-scope-"));
  try {
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "stryker.config.json"), JSON.stringify({ mutate: ["src/*.ts"] }));
    writeFileSync(join(root, "src/a.ts"), "a");
    writeFileSync(join(root, "src/b.ts"), "b");
    writeFileSync(join(root, "src/large.ts"), "large source");
    writeFileSync(join(root, "src/small.test.ts"), "");
    const cases = [
      { args: ["--files", "src/b.ts"], out: "src/b.ts", reason: /1 scoped file/ },
      { args: ["--files", "stryker.config.json"], out: "src/a.ts", reason: /smallest scoped file/ },
      { args: ["--files", "README.md"], out: "", reason: /no scoped module/ },
      {
        args: ["--files", ...Array.from({ length: 9 }, (_, i) => `src/f${i}.ts`)],
        out: "",
        reason: /weekly full run/,
      },
    ];
    for (const { args, out, reason } of cases) {
      const result = run("mutation-scope", args, root);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, out);
      assert.match(result.stderr, reason);
    }
    const diff = runCli(
      new URL("./cli-git-fixture.ts", import.meta.url).pathname,
      [new URL("../../tools/ci/mutation-scope.ts", import.meta.url).pathname, "fixture-base"],
      root,
      {
        ...cleanEnv(),
        FIXTURE_GIT_ARGS: JSON.stringify([
          "diff",
          "--name-only",
          "--diff-filter=d",
          "fixture-base...HEAD",
        ]),
        FIXTURE_GIT_OUTPUT: "src/b.ts\nREADME.md\n",
      },
    );
    assert.equal(diff.status, 0, diff.stderr);
    assert.equal(diff.stdout, "src/b.ts");
    const usage = run("mutation-scope", [], root);
    assert.notEqual(usage.status, 0);
    assert.match(usage.stderr, /usage: mutation-scope.ts/);
    for (const mutate of [null, [1], "src/*.ts"]) {
      writeFileSync(join(root, "bad.json"), JSON.stringify({ mutate }));
      assert.throws(() => mutateGlobs(join(root, "bad.json")), /must be a list of globs/);
    }
    assert.throws(() => smallestScoped([join(root, "absent/*.ts")]), /no scoped source exists/);
    assert.equal(smallestScoped([join(root, "src/*.ts")]), join(root, "src/a.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
