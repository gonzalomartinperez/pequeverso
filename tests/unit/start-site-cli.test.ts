import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cleanEnv, runCli } from "./cli-process.ts";

const start = new URL("../../tools/start.ts", import.meta.url).pathname;

test("start runs SITE_DIR/server.js from that directory without copying anything", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-start-site-"));
  try {
    mkdirSync(join(root, "site"));
    // Stands in for the standalone server: reports where and how it was started, then exits.
    writeFileSync(
      join(root, "site/server.js"),
      [
        'const dir = process.cwd().split("/").pop();',
        'console.log("server cwd=" + dir + " host=" + process.env.HOSTNAME + " port=" + process.env.PORT);',
        "",
      ].join("\n"),
    );
    const env = { ...cleanEnv(), SITE_DIR: "site", HOSTNAME: "127.0.0.1", PORT: "3123" };
    const result = runCli(start, [], root, env);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.stdout,
      "start: standalone server on 127.0.0.1:3123\nmeta-capi: disabled\nserver cwd=site host=127.0.0.1 port=3123\n",
    );
    assert.equal(existsSync(join(root, "site/public")), false);
    assert.equal(existsSync(join(root, "site/.next")), false);
    const defaults = runCli(start, [], root, {
      ...cleanEnv(),
      SITE_DIR: "site",
      HOSTNAME: "",
      PORT: "",
    });
    assert.match(defaults.stdout, /^start: standalone server on 0\.0\.0\.0:3000\n/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const refusal =
  "start: SITE_DIR must be a relative directory inside the repository with a regular " +
  "server.js; assemble it with tools/ci/assemble-site.ts\n";

function expectRefused(root: string, siteDir: string): void {
  const result = runCli(start, [], root, { ...cleanEnv(), SITE_DIR: siteDir });
  assert.equal(result.status, 1, siteDir);
  assert.equal(result.stdout, "", siteDir);
  assert.equal(result.stderr, refusal, siteDir);
}

test("start fails clearly when SITE_DIR has no server.js", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-start-site-missing-"));
  try {
    mkdirSync(join(root, "site"));
    expectRefused(root, "site");
    expectRefused(root, "absent");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("start refuses an absolute SITE_DIR, one outside the repository and a symlinked server.js", () => {
  const parent = mkdtempSync(join(tmpdir(), "pv-start-site-refused-"));
  try {
    const root = join(parent, "repo");
    const outside = join(parent, "outside");
    for (const directory of [join(root, "site"), join(root, "linked"), outside])
      mkdirSync(directory, { recursive: true });
    // Each target has a real server.js, so only the location or the link is at fault.
    writeFileSync(join(outside, "server.js"), 'console.log("must not run");\n');
    writeFileSync(join(root, "site/server.js"), 'console.log("must not run");\n');
    symlinkSync(join(outside, "server.js"), join(root, "linked/server.js"));
    expectRefused(root, join(root, "site"));
    expectRefused(root, outside);
    expectRefused(root, "../outside");
    expectRefused(root, "site/..");
    expectRefused(root, ".");
    expectRefused(root, "linked");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
