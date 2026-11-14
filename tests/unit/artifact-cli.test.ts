import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { digest } from "../../tools/ci/artifacts.ts";
import { cleanEnv, runCli } from "./cli-process.ts";

const source = "a".repeat(40);
const info = (assistant: "enabled" | "disabled") =>
  JSON.stringify({
    sha: source,
    ref: "fixture",
    builtAt: "2026-11-01T00:00:00Z",
    output: "export",
    assistant,
    site_analytics: "disabled",
  });

test("artifact CLI binds a packed export to inputs, unpacks exact bytes and attests a native fixture", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-artifact-cli-"));
  const output = join(root, "github-output");
  const env: NodeJS.ProcessEnv = {
    ...cleanEnv(),
    GITHUB_SHA: source,
    GITHUB_REPOSITORY: "gonzalomartinperez/pequeverso",
    GITHUB_WORKFLOW_SHA: "b".repeat(40),
    GITHUB_RUN_ID: "123",
    GITHUB_RUN_ATTEMPT: "1",
    GITHUB_OUTPUT: output,
    CI_CANDIDATE_SHA: source,
    FIXTURE_GIT_ARGS: JSON.stringify(["rev-parse", "HEAD"]),
    FIXTURE_GIT_OUTPUT: `${source}\n`,
  };
  const run = (args: string[], overrides: Partial<NodeJS.ProcessEnv> = {}) =>
    runCli(
      new URL("./cli-git-fixture.ts", import.meta.url).pathname,
      [new URL("../../tools/ci/artifacts.ts", import.meta.url).pathname, ...args],
      root,
      { ...env, ...overrides },
    );
  const reject = (args: string[], overrides: Partial<NodeJS.ProcessEnv> = {}) => {
    const result = run(args, overrides);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "Candidate artifact validation failed (input details withheld).\n");
    assert.equal(result.stdout, "");
  };
  try {
    mkdirSync(join(root, "config"));
    writeFileSync(join(root, "config/next.ts"), "// fixture config");
    writeFileSync(join(root, "config/edge-rules.json"), "{}");
    writeFileSync(join(root, "package-lock.json"), "{}");
    mkdirSync(join(root, "out/assets"), { recursive: true });
    writeFileSync(join(root, "out/index.html"), "<p>synthetic export</p>");
    writeFileSync(join(root, "out/assets/app.js"), "// synthetic asset");
    writeFileSync(join(root, "out/build-info.json"), info("disabled"));
    const packed = run(["pack-off", "out", "quarantine"]);
    assert.equal(packed.status, 0, packed.stderr);
    assert.match(
      packed.stdout,
      /Candidate identity and file integrity checked; no delivery authorized/,
    );
    const serialized = readFileSync(join(root, "quarantine/manifest.json"), "utf8");
    const manifest = JSON.parse(serialized);
    assert.equal(manifest.binding.source_sha, source);
    assert.equal(manifest.binding.lock_sha256, digest("{}"));
    assert.equal(manifest.build_id, digest(info("disabled")));
    assert.deepEqual(
      manifest.files.map((file: { path: string }) => file.path),
      ["assets/app.js", "build-info.json", "index.html"],
    );
    assert.equal(
      readFileSync(output, "utf8"),
      `manifest_sha256=${digest(serialized)}\nsource_sha=${source}\n`,
    );
    reject(["pack-off", "out", "quarantine"]);
    reject(["unpack-off", "out", "quarantine"]);
    rmSync(join(root, "out"), { recursive: true });
    reject(["unpack-off", "out", "quarantine"], { CI_MANIFEST_SHA256: "0".repeat(64) });
    assert.equal(existsSync(join(root, "out")), false);
    const unpacked = run(["unpack-off", "out", "quarantine"], {
      CI_MANIFEST_SHA256: digest(serialized),
    });
    assert.equal(unpacked.status, 0, unpacked.stderr);
    assert.equal(readFileSync(join(root, "out/index.html"), "utf8"), "<p>synthetic export</p>");
    assert.equal(readFileSync(join(root, "out/assets/app.js"), "utf8"), "// synthetic asset");
    assert.equal(readFileSync(join(root, "out/build-info.json"), "utf8"), info("disabled"));
    mkdirSync(join(root, "out-assistant-fixture"));
    writeFileSync(join(root, "out-assistant-fixture/build-info.json"), info("enabled"));
    const attested = run(["attest-native", "out-assistant-fixture", "native.json"]);
    assert.equal(attested.status, 0, attested.stderr);
    const attestation = JSON.parse(readFileSync(join(root, "native.json"), "utf8"));
    assert.equal(attestation.variant, "native-fixture");
    assert.equal(attestation.uploaded_export, false);
    assert.equal(attestation.build_id, digest(info("enabled")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
