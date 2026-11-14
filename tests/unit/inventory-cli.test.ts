import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { coreMatrix, nightlyMatrix, projects } from "../../tools/ci/inventories.ts";
import { cleanEnv, runCli } from "./cli-process.ts";

const run = (script: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = cleanEnv()) =>
  runCli(new URL(`../../tools/${script}.ts`, import.meta.url).pathname, args, cwd, env);

function report(selected: readonly string[]) {
  return {
    suites: [
      {
        title: "fixture",
        specs: selected.map((project) => ({
          file: "fixture.spec.ts",
          title: project,
          line: 1,
          column: 1,
          tests: [{ projectName: project }],
        })),
      },
    ],
  };
}

test("inventory CLI emits matrices and verifies exact partitions before writing a receipt", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-inventory-cli-"));
  try {
    for (const [name, expected] of [
      ["core", coreMatrix],
      ["nightly", nightlyMatrix],
    ] as const) {
      const result = run("ci/inventories", ["matrix", name], root);
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(JSON.parse(result.stdout), expected);
    }
    for (const suite of ["functional", "nightly"] as const) {
      const count = suite === "nightly" ? 8 : 4;
      const full = join(root, `${suite}.json`);
      const output = join(root, `${suite}-receipt.json`);
      writeFileSync(full, JSON.stringify(report(projects[suite])));
      const parts = Array.from({ length: count }, (_, index) => {
        const file = join(root, `${suite}-${index}.json`);
        writeFileSync(
          file,
          JSON.stringify(report(projects[suite].filter((_, i) => i % count === index))),
        );
        return file;
      });
      const result = run("ci/inventories", ["verify", suite, full, output, ...parts], root);
      assert.equal(result.status, 0, result.stderr);
      const receipt = JSON.parse(readFileSync(output, "utf8"));
      assert.deepEqual(receipt, {
        configuration: suite,
        full: projects[suite].length,
        parts: Array.from(
          { length: count },
          (_, index) => projects[suite].filter((_, i) => i % count === index).length,
        ),
        exactUnion: true,
        disjoint: true,
        executed: false,
      });
      assert.deepEqual(JSON.parse(result.stdout), receipt);
      const rejected = join(root, `${suite}-rejected.json`);
      for (const invalidParts of [parts.slice(1), parts.map(() => parts[0] ?? "")]) {
        const invalid = run(
          "ci/inventories",
          ["verify", suite, full, rejected, ...invalidParts],
          root,
        );
        assert.equal(invalid.status, 1);
        assert.match(invalid.stderr, /Test inventory verification failed/);
        assert.equal(existsSync(rejected), false);
      }
    }
    for (const args of [[], ["matrix", "unknown"], ["verify", "unknown", "a", "b"]]) {
      const invalid = run("ci/inventories", args, root);
      assert.equal(invalid.status, 1);
      assert.match(invalid.stderr, /no coverage acceptance was produced/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
