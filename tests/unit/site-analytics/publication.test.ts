import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("../../../tools/check-site-analytics-disabled.ts", import.meta.url));

test("publication gate rejects enabled metadata and emitted collection on both build targets", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-analytics-off-"));
  try {
    mkdirSync(join(root, "public"));
    mkdirSync(join(root, "out"));
    mkdirSync(join(root, ".next/static"), { recursive: true });
    mkdirSync(join(root, ".next/server/app"), { recursive: true });
    const info = (output: string, site_analytics: string) =>
      writeFileSync(join(root, "public/build-info.json"), JSON.stringify({ output, site_analytics }));
    const run = (...args: string[]) =>
      spawnSync(process.execPath, [checker, ...args], { cwd: root, encoding: "utf8", timeout: 5000 });
    info("export", "disabled");
    writeFileSync(join(root, "out/index.html"), "public page");
    assert.equal(run().status, 0);
    info("export", "enabled");
    assert.notEqual(run().status, 0);
    assert.equal(run("--allow-enabled").status, 0);
    info("export", "disabled");
    writeFileSync(join(root, "out/collection.js"), 'fetch("/api/v1/analytics/events")');
    assert.notEqual(run().status, 0);
    info("standalone", "disabled");
    writeFileSync(join(root, ".next/static/index.js"), "public page");
    assert.equal(run().status, 0);
    writeFileSync(join(root, ".next/server/app/index.js"), 'fetch("/api/v1/analytics/events")');
    assert.notEqual(run().status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
