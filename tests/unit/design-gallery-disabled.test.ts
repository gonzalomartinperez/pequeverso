import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, describe, it } from "node:test";

import { designGalleryEnabled } from "../../config/design-gallery-env.ts";

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
    assert.equal(enabled.status, 1, "the flag alone is not enough");
    const verified = spawnSync("node", [script, "--allow-enabled", dir], {
      encoding: "utf8",
      env: {
        NODE_ENV: "test",
        PATH: process.env.PATH ?? "",
        NEXT_PUBLIC_DESIGN_GALLERY: "true",
        PV_VERIFICATION_BUILD: "design-gallery",
      },
    });
    assert.equal(verified.status, 0, verified.stderr);
    assert.match(verified.stderr, /NOT publishable/);
  });
});

describe("designGalleryEnabled", () => {
  const token = { PV_VERIFICATION_BUILD: "design-gallery" };
  it("is off for an absent, empty or false flag", () => {
    for (const flag of [undefined, "", " false "])
      assert.equal(designGalleryEnabled({ NEXT_PUBLIC_DESIGN_GALLERY: flag }, false), false);
  });
  it("needs the out-of-band verification token", () => {
    assert.throws(
      () => designGalleryEnabled({ NEXT_PUBLIC_DESIGN_GALLERY: "true" }, false),
      /PV_VERIFICATION_BUILD/,
    );
    assert.equal(
      designGalleryEnabled({ NEXT_PUBLIC_DESIGN_GALLERY: "true", ...token }, false),
      true,
    );
  });
  it("is refused in Hostinger's builder even with the token", () => {
    assert.throws(
      () => designGalleryEnabled({ NEXT_PUBLIC_DESIGN_GALLERY: "true", ...token }, true),
      /Hostinger/,
    );
  });
  it("rejects any other value", () => {
    assert.throws(
      () => designGalleryEnabled({ NEXT_PUBLIC_DESIGN_GALLERY: "1" }, false),
      /"true" or "false"/,
    );
  });
});

describe("check-design-gallery-disabled (standalone layout)", () => {
  function standalone(files: Record<string, string>, ...flags: string[]) {
    const cwd = mkdtempSync(join(work, "cwd-"));
    const tree: Record<string, string> = {
      "public/build-info.json": JSON.stringify({ output: "standalone" }),
      ".next/static/a.js": "var a=1",
      ".next/server/app/index.html": "<h1>ok</h1>",
      ...files,
    };
    for (const [name, text] of Object.entries(tree)) {
      mkdirSync(dirname(join(cwd, name)), { recursive: true });
      writeFileSync(join(cwd, name), text);
    }
    return spawnSync("node", [script, ...flags], {
      cwd,
      encoding: "utf8",
      env: { NODE_ENV: "test", PATH: process.env.PATH ?? "" },
    });
  }
  it("passes on a clean standalone tree", () => {
    assert.equal(standalone({}).status, 0);
  });
  it("fails on a marker in the server output, a manifest or the nested standalone copy", () => {
    for (const files of [
      { ".next/server/app/_design.html": "x" },
      { ".next/routes-manifest.json": '{"/_design/":1}' },
      { ".next/standalone/apps/web/.next/server/app/x.html": "pv-design-gallery" },
    ]) {
      const result = standalone(files);
      assert.equal(result.status, 1, JSON.stringify(files));
    }
  });
  it("ignores node_modules and does not tolerate the flag without the token", () => {
    assert.equal(standalone({ ".next/standalone/node_modules/x/a.js": "/_design" }).status, 0);
  });
});
