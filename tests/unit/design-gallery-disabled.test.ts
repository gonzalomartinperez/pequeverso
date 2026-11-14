import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, describe, it } from "node:test";

const script = resolve("tools/check-design-gallery-disabled.ts");
const work = mkdtempSync(join(tmpdir(), "pv-gallery-check-"));
after(() => rmSync(work, { recursive: true, force: true }));

function run(files: Record<string, string>, ...flags: string[]) {
  const dir = mkdtempSync(join(work, "out-"));
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return spawnSync("node", [script, ...flags, dir], {
    encoding: "utf8",
    env: { NODE_ENV: "test", PATH: process.env.PATH ?? "" },
  });
}

describe("check-design-gallery-disabled", () => {
  it("passes on an output without gallery code", () => {
    const result = run({ "index.html": "<h1>Pequeverso</h1>", "_next/static/a.js": "var a=1" });
    assert.equal(result.status, 0, result.stderr);
  });

  it("fails on a gallery marker in HTML or a chunk", () => {
    for (const files of [
      { "index.html": "ok", "x/index.html": '<main data-design-gallery="pv-design-gallery">' },
      { "index.html": "ok", "_next/static/chunks/a.js": 'href:"/_design/"' },
      { "index.html": "ok", "_next/static/chunks/b.js": '"Design state gallery"' },
    ]) {
      const result = run(files);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /gallery marker/);
    }
  });

  it("fails on a _design route directory or file", () => {
    for (const files of [
      { "_design/index.html": "x" },
      { "index.html": "ok", "_design.html": "x" },
    ]) {
      const result = run(files);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /is a gallery/);
    }
  });

  it("fails on an empty or missing output", () => {
    assert.equal(run({}).status, 1);
  });

  it("only tolerates the gallery with --allow-enabled AND the build flag", () => {
    const files = { "_design/index.html": "pv-design-gallery" };
    assert.equal(run(files, "--allow-enabled").status, 1);
    const dir = mkdtempSync(join(work, "out-"));
    mkdirSync(join(dir, "_design"));
    writeFileSync(join(dir, "_design/index.html"), "pv-design-gallery");
    const enabled = spawnSync("node", [script, "--allow-enabled", dir], {
      encoding: "utf8",
      env: { NODE_ENV: "test", PATH: process.env.PATH ?? "", NEXT_PUBLIC_DESIGN_GALLERY: "true" },
    });
    assert.equal(enabled.status, 0, enabled.stderr);
    assert.match(enabled.stderr, /NOT publishable/);
  });
});
