import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The parent environment without host git and CI state: no `GIT_*` (a hook's GIT_DIR would point
 * the child at this repository), no `GITHUB_*` (a CLI must never append to the real run's
 * GITHUB_OUTPUT or step summary) and no `CI_*`; git discovery stops at the temp directory.
 */
export function cleanEnv(): NodeJS.ProcessEnv {
  const env: Record<string, string | undefined> = {
    GIT_CEILING_DIRECTORIES: tmpdir(),
    GIT_CONFIG_NOSYSTEM: "1",
  };
  for (const [key, value] of Object.entries(process.env))
    if (!/^(GIT|GITHUB|CI)_/.test(key)) env[key] = value;
  return env as NodeJS.ProcessEnv;
}

/** Capture CLI output in regular files so nested processes do not depend on pipe support. */
export function runCli(file: string, args: readonly string[], cwd: string, env = cleanEnv()) {
  const capture = mkdtempSync(join(tmpdir(), "pv-cli-output-"));
  const stdout = join(capture, "stdout");
  const stderr = join(capture, "stderr");
  const out = openSync(stdout, "w");
  const err = openSync(stderr, "w");
  try {
    const result = spawnSync(process.execPath, [file, ...args], {
      cwd,
      env,
      stdio: ["ignore", out, err],
      // Generous: a hang still fails, a loaded runner (coverage, parallel files) does not.
      timeout: 30_000,
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return {
      status: result.status,
      stdout: readFileSync(stdout, "utf8"),
      stderr: readFileSync(stderr, "utf8"),
    };
  } finally {
    closeSync(out);
    closeSync(err);
    rmSync(capture, { recursive: true, force: true });
  }
}
