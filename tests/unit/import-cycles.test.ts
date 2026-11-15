import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const biome = resolve("node_modules/.bin/biome");

/** Lints `files` in a scratch project with only noImportCycles at the repository's level. */
function lintScratch(files: Record<string, string>): { status: number; output: string } {
  const level = JSON.parse(readFileSync("biome.json", "utf8")).linter.rules.suspicious
    .noImportCycles;
  const dir = mkdtempSync(join(tmpdir(), "pv-cycles-"));
  try {
    writeFileSync(
      join(dir, "biome.json"),
      JSON.stringify({
        root: true,
        vcs: { enabled: false },
        linter: { rules: { preset: "none", suspicious: { noImportCycles: level } } },
      }),
    );
    for (const [name, source] of Object.entries(files)) writeFileSync(join(dir, name), source);
    try {
      const output = execFileSync(biome, ["lint", "."], {
        cwd: dir,
        encoding: "utf8",
        stdio: "pipe",
      });
      return { status: 0, output };
    } catch (error) {
      const failed = error as { status?: number; stdout?: string; stderr?: string };
      return { status: failed.status ?? 1, output: `${failed.stdout}${failed.stderr}` };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("biome.json rejects import cycles as errors (negative fixture)", () => {
  const cycle = lintScratch({
    "a.ts": 'import { b } from "./b.ts";\nexport const a = () => b;\n',
    "b.ts": 'import { a } from "./a.ts";\nexport const b = () => a;\n',
  });
  assert.notEqual(cycle.status, 0);
  assert.match(cycle.output, /noImportCycles/);
  const chain = lintScratch({
    "a.ts": 'import { b } from "./b.ts";\nexport const a = () => b;\n',
    "b.ts": "export const b = 1;\n",
  });
  assert.equal(chain.status, 0, chain.output);
});
