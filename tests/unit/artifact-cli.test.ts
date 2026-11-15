import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

const siteInfo = (output: "export" | "standalone" = "standalone") =>
  JSON.stringify({
    sha: source,
    ref: "fixture",
    builtAt: "2026-11-01T00:00:00Z",
    output,
    assistant: "disabled",
    site_analytics: "disabled",
  });

/** A synthetic assembled standalone site (tools/ci/assemble-site.ts layout). */
function writeSite(
  root: string,
  directory = "site",
  output: "export" | "standalone" = "standalone",
) {
  mkdirSync(join(root, directory, "public"), { recursive: true });
  mkdirSync(join(root, directory, ".next/static/chunks"), { recursive: true });
  writeFileSync(join(root, directory, "server.js"), "// synthetic server");
  writeFileSync(join(root, directory, "public/build-info.json"), siteInfo(output));
  writeFileSync(join(root, directory, ".next/BUILD_ID"), "fixture-build");
  writeFileSync(join(root, directory, ".next/static/chunks/a.js"), "// synthetic chunk");
}

test("artifact CLI transfers an assembled standalone site and binds the variant to the root", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-artifact-site-"));
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

    // Round trip: pack the site, unpack it into an absent root, same bytes.
    writeSite(root);
    const packed = run(["pack-off", "site", "quarantine"]);
    assert.equal(packed.status, 0, packed.stderr);
    const serialized = readFileSync(join(root, "quarantine/manifest.json"), "utf8");
    const manifest = JSON.parse(serialized);
    assert.equal(manifest.variant, "off-standalone");
    assert.equal(manifest.build_id, digest(siteInfo()));
    assert.deepEqual(
      manifest.files.map((file: { path: string }) => file.path),
      [".next/BUILD_ID", ".next/static/chunks/a.js", "public/build-info.json", "server.js"],
    );
    const checksum = { CI_MANIFEST_SHA256: digest(serialized) };
    reject(["unpack-off", "site", "quarantine"], checksum);
    renameSync(join(root, "site"), join(root, "site-source"));

    // A site manifest never unpacks as the export root, nor with a forged variant.
    reject(["unpack-off", "out", "quarantine"], checksum);
    assert.equal(existsSync(join(root, "out")), false);
    const forged = serialized.replace('"off-standalone"', '"off-export"');
    writeFileSync(join(root, "quarantine/manifest.json"), forged);
    reject(["unpack-off", "site", "quarantine"], { CI_MANIFEST_SHA256: digest(forged) });
    assert.equal(existsSync(join(root, "site")), false);
    writeFileSync(join(root, "quarantine/manifest.json"), serialized);

    const unpacked = run(["unpack-off", "site", "quarantine"], checksum);
    assert.equal(unpacked.status, 0, unpacked.stderr);
    for (const file of ["server.js", "public/build-info.json", ".next/BUILD_ID"]) {
      assert.equal(
        readFileSync(join(root, "site", file), "utf8"),
        readFileSync(join(root, "site-source", file), "utf8"),
      );
    }
    renameSync(join(root, "site"), join(root, "site-unpacked"));

    // An export manifest never unpacks as the site root.
    mkdirSync(join(root, "out"));
    writeFileSync(join(root, "out/index.html"), "<p>synthetic export</p>");
    writeFileSync(join(root, "out/build-info.json"), info("disabled"));
    assert.equal(run(["pack-off", "out", "export-quarantine"]).status, 0);
    const exported = readFileSync(join(root, "export-quarantine/manifest.json"), "utf8");
    reject(["unpack-off", "site", "export-quarantine"], { CI_MANIFEST_SHA256: digest(exported) });
    assert.equal(existsSync(join(root, "site")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("artifact CLI refuses a site that is not a standalone OFF tree", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-artifact-site-bad-"));
  const env: NodeJS.ProcessEnv = {
    ...cleanEnv(),
    GITHUB_SHA: source,
    GITHUB_REPOSITORY: "gonzalomartinperez/pequeverso",
    GITHUB_WORKFLOW_SHA: source,
    GITHUB_RUN_ID: "1",
    GITHUB_RUN_ATTEMPT: "1",
    CI_CANDIDATE_SHA: source,
    FIXTURE_GIT_ARGS: JSON.stringify(["rev-parse", "HEAD"]),
    FIXTURE_GIT_OUTPUT: source,
  };
  const pack = () =>
    runCli(
      new URL("./cli-git-fixture.ts", import.meta.url).pathname,
      [new URL("../../tools/ci/artifacts.ts", import.meta.url).pathname, "pack-off", "site", "q"],
      root,
      env,
    );
  const refuses = (label: string) => {
    const result = pack();
    assert.equal(result.status, 1, label);
    assert.equal(result.stderr, "Candidate artifact validation failed (input details withheld).\n");
    assert.equal(existsSync(join(root, "q")), false, label);
    rmSync(join(root, "site"), { recursive: true, force: true });
  };
  try {
    mkdirSync(join(root, "config"));
    writeFileSync(join(root, "config/next.ts"), "// fixture");
    writeFileSync(join(root, "config/edge-rules.json"), "{}");
    writeFileSync(join(root, "package-lock.json"), "{}");

    writeSite(root);
    rmSync(join(root, "site/server.js"));
    refuses("missing server.js");

    writeSite(root);
    rmSync(join(root, "site/.next/BUILD_ID"));
    refuses("missing BUILD_ID");

    writeSite(root);
    rmSync(join(root, "site/public/build-info.json"));
    refuses("missing build-info");

    writeSite(root, "site", "export");
    refuses("export build-info under site");

    writeSite(root);
    writeFileSync(join(root, "site/public/build-info.json"), siteInfo("export"));
    refuses("export identity at public/build-info.json");

    writeSite(root);
    writeFileSync(join(root, "site/build-info.json"), siteInfo());
    writeFileSync(join(root, "site/public/build-info.json"), siteInfo("export"));
    refuses("only the site's own build-info is read");

    writeSite(root);
    symlinkSync(join(root, "site/server.js"), join(root, "site/public/linked.js"));
    refuses("symlinked file");

    writeSite(root);
    symlinkSync(join(root, "site/public"), join(root, "site/.next/linked"));
    refuses("symlinked directory");

    writeSite(root);
    writeFileSync(join(root, "site/UNPUBLISHABLE.txt"), "x");
    refuses("unpublishable marker");

    writeSite(root);
    writeFileSync(join(root, "site/.env.local"), "SECRET=1");
    refuses("environment file");

    writeSite(root);
    mkdirSync(join(root, "site/node_modules/next"), { recursive: true });
    writeFileSync(join(root, "site/node_modules/next/index.js"), "// planted package");
    refuses("node_modules member");

    writeSite(root);
    writeFileSync(join(root, "site/extra.txt"), "x");
    refuses("top-level entry outside the allowlist");

    writeSite(root);
    writeFileSync(join(root, "site/.next/native.node"), "x");
    refuses("native addon");

    writeSite(root);
    writeFileSync(join(root, "site/public/UNPUBLISHABLE.txt"), "x");
    refuses("nested unpublishable marker");

    // The export root keeps its own requirements: a site tree is not an export.
    mkdirSync(join(root, "out"));
    writeFileSync(join(root, "out/index.html"), "<p>export</p>");
    writeFileSync(join(root, "out/build-info.json"), siteInfo("standalone"));
    const result = runCli(
      new URL("./cli-git-fixture.ts", import.meta.url).pathname,
      [new URL("../../tools/ci/artifacts.ts", import.meta.url).pathname, "pack-off", "out", "q"],
      root,
      env,
    );
    assert.equal(result.status, 1);
    assert.equal(existsSync(join(root, "q")), false);

    // A nested unpublishable marker is refused in an export too.
    writeFileSync(join(root, "out/build-info.json"), info("disabled"));
    mkdirSync(join(root, "out/x"));
    writeFileSync(join(root, "out/x/UNPUBLISHABLE.txt"), "x");
    const marked = runCli(
      new URL("./cli-git-fixture.ts", import.meta.url).pathname,
      [new URL("../../tools/ci/artifacts.ts", import.meta.url).pathname, "pack-off", "out", "q"],
      root,
      env,
    );
    assert.equal(marked.status, 1);
    assert.equal(marked.stderr, "Candidate artifact validation failed (input details withheld).\n");
    assert.equal(existsSync(join(root, "q")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
