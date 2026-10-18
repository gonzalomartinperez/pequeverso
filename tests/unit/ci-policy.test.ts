import assert from "node:assert/strict";
import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { prerequisites, requireSuccessfulJobs } from "../../scripts/ci/acceptance.ts";
import {
  type Binding,
  buildIdentity,
  digest,
  limits,
  payloadInventory,
  requireBinding,
  requireManifest,
  requireMembers,
  requireRegular,
  safeMember,
  validateOffArtifact,
} from "../../scripts/ci/artifacts.ts";
import {
  coreMatrix,
  nightlyMatrix,
  projects,
  requirePartition,
  type Suite,
  testIdentities,
} from "../../scripts/ci/inventories.ts";

for (const profile of ["core", "nightly", "bridge"] as const) {
  const success = Object.fromEntries(prerequisites[profile].map((name) => [name, { result: "success" }]));
  test(`${profile} requires every exact prerequisite`, () => {
    requireSuccessfulJobs(success, profile);
    assert.throws(() => requireSuccessfulJobs(null, profile));
    assert.throws(() => requireSuccessfulJobs({ ...success, unexpected: { result: "success" } }, profile));
    const incomplete = { ...success };
    delete incomplete[prerequisites[profile][0]];
    assert.throws(() => requireSuccessfulJobs(incomplete, profile));
  });
  for (const result of ["failure", "cancelled", "pending", "skipped", "unknown", ""]) {
    test(`${profile} rejects ${result || "empty"} prerequisites`, () => {
      assert.throws(() =>
        requireSuccessfulJobs(
          {
            ...success,
            [prerequisites[profile][0]]: { result },
          },
          profile,
        ),
      );
    });
  }
}

function report(suite: Suite, selected: readonly string[] = projects[suite]) {
  return {
    errors: [],
    suites: [
      {
        title: "commerce.spec.ts",
        suites: [
          {
            title: "parameterized",
            specs: selected.map((project, index) => ({
              title: `case ${index}`,
              id: `parameter-${index}`,
              file: "tests/e2e/commerce.spec.ts",
              line: 20,
              column: 1,
              tests: [{ projectName: project, repeatEachIndex: 0 }],
            })),
          },
        ],
      },
    ],
  };
}

test("core matrix retains separate six-project functional and native configurations", () => {
  assert.equal(coreMatrix.include.length, 8);
  assert.deepEqual(
    coreMatrix.include.map((row) => row.index),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(projects.functional.length, 6);
  assert.equal(projects.native.length, 6);
  assert.equal(projects.nightly.length, 14);
  assert.deepEqual(
    nightlyMatrix.include.map((row) => `${row.shard}/${row.shards}`),
    ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8", "8/8"],
  );
});
for (const suite of Object.keys(projects) as Suite[]) {
  test(`${suite} rejects incomplete project catalogues and foreign configurations`, () => {
    assert.equal(testIdentities(report(suite), suite, true).length, projects[suite].length);
    const first = projects[suite][0];
    assert.ok(first);
    assert.throws(() => testIdentities(report(suite, [first]), suite, true));
    assert.throws(() => testIdentities(report(suite, ["foreign-project"]), suite));
    assert.throws(() => testIdentities({ ...report(suite), errors: [{ message: "load failed" }] }, suite));
    assert.throws(() => testIdentities({ suites: [] }, suite));
  });
}
test("identities preserve config, project, source location, nested titles and parameter identities", () => {
  const value = report("functional", ["chromium-390", "chromium-390"]);
  const identities = testIdentities(value, "functional");
  assert.equal(new Set(identities).size, 2);
  assert.match(identities[0] ?? "", /parameterized/);
  const spec = value.suites[0]?.suites[0]?.specs[0];
  assert.ok(spec);
  spec.line = 0;
  assert.throws(() => testIdentities(value, "functional"));
});
test("partition coverage rejects overlap, missing, extra and duplicate cases", () => {
  requirePartition(["a", "b", "c"], [["a"], ["b", "c"]]);
  for (const parts of [
    [["a"], ["a", "b", "c"]],
    [["a"], ["b"]],
    [["a"], ["b", "c", "d"]],
    [[], ["a", "b", "c"]],
  ]) {
    assert.throws(() => requirePartition(["a", "b", "c"], parts));
  }
  assert.throws(() => requirePartition(["a", "a"], [["a"]]));
});

const binding: Binding = {
  repository: "gonzalomartinperez/pequeverso",
  source_sha: "a".repeat(40),
  workflow_sha: "b".repeat(40),
  run_id: "123",
  run_attempt: "1",
  configuration_sha256: "c".repeat(64),
  lock_sha256: "d".repeat(64),
};
const members = ["index.html", "build-info.json", "_next/static/app.js"].map((path) => ({
  path,
  size: 1,
  sha256: digest(path),
}));
const manifest = {
  schema_version: 1,
  variant: "off-export",
  binding,
  build_id: "e".repeat(64),
  files: members,
};

test("OFF manifests bind the exact complete payload, source, workflow, run, config and lock", () => {
  requireManifest(manifest, binding, [...members].reverse());
  for (const key of Object.keys(binding) as (keyof Binding)[]) {
    assert.throws(() =>
      requireManifest({ ...manifest, binding: { ...binding, [key]: "changed" } }, binding, members),
    );
  }
  assert.throws(() => requireManifest({ ...manifest, extra: true }, binding, members));
  assert.throws(() => requireManifest({ ...manifest, schema_version: 2 }, binding, members));
  assert.throws(() => requireManifest({ ...manifest, variant: "enabled" }, binding, members));
  assert.throws(() => requireManifest(manifest, binding, members.slice(1)));
  assert.throws(() =>
    requireManifest(manifest, binding, [...members, { path: "extra.html", size: 0, sha256: digest("") }]),
  );
  assert.throws(() => requireBinding(binding, { ...binding, repository: "foreign/repository" }));
  assert.throws(() => requireBinding(binding, { ...binding, source_sha: "unknown" }));
});
for (const path of [
  "../x",
  "/absolute",
  "C:/windows",
  "a\\b",
  "a//b",
  "a/./b",
  "x\u0000y",
  ".env",
  "a/.env.local",
  ".git/config",
  "private.key",
  "data.sqlite",
  "dump.bak",
]) {
  test(`unsafe artifact path rejected: ${JSON.stringify(path)}`, () => assert.throws(() => safeMember(path)));
}
test("OFF inventory rejects duplicates, prefix conflicts, unknown fields, enabled markers and size bombs", () => {
  const extra = { path: "asset", size: 1, sha256: digest("asset") };
  assert.throws(() => requireMembers([...members, members[0]]));
  assert.throws(() => requireMembers([...members, extra, { ...extra, path: "asset/child" }]));
  assert.throws(() => requireMembers([...members, { ...extra, unknown: true }]));
  assert.throws(() => requireMembers([...members, { ...extra, path: "UNPUBLISHABLE.txt" }]));
  for (const size of [-1, 0.5, Number.NaN, limits.fileBytes + 1]) {
    assert.throws(() => requireMembers([...members, { ...extra, size }]));
  }
  assert.throws(() => requireMembers(Array.from({ length: limits.files + 1 }, () => extra)));
  assert.throws(() =>
    requireMembers([
      ...members,
      ...Array.from({ length: 9 }, (_, index) => ({
        ...extra,
        path: `large-${index}`,
        size: limits.fileBytes,
      })),
    ]),
  );
});
test("linked, FIFO/device and unbounded files cannot enter the payload", () => {
  requireRegular({ isFile: () => true, nlink: 1, size: 2 }, 2);
  for (const stat of [
    { isFile: () => false, nlink: 1, size: 0 },
    { isFile: () => true, nlink: 2, size: 1 },
    { isFile: () => true, nlink: 1, size: 3 },
    { isFile: () => true, nlink: 1, size: -1 },
  ])
    assert.throws(() => requireRegular(stat, 2));
});
test("build identity distinguishes disabled exports from enabled fixtures", () => {
  const info = {
    sha: binding.source_sha,
    ref: "develop",
    builtAt: "2026-10-18T00:00:00Z",
    output: "export",
    assistant: "disabled",
  };
  const bytes = Buffer.from(JSON.stringify(info));
  assert.equal(buildIdentity(bytes, binding, "disabled"), digest(bytes));
  assert.throws(() => buildIdentity(bytes, binding, "enabled"));
  assert.throws(() =>
    buildIdentity(Buffer.from(JSON.stringify({ ...info, sha: "f".repeat(40) })), binding, "disabled"),
  );
  assert.throws(() =>
    buildIdentity(Buffer.from(JSON.stringify({ ...info, output: "standalone" })), binding, "disabled"),
  );
  assert.throws(() =>
    buildIdentity(Buffer.from(JSON.stringify({ ...info, extra: "unexpected" })), binding, "disabled"),
  );
  assert.throws(() => buildIdentity(Buffer.from(JSON.stringify({ ...info, ref: {} })), binding, "disabled"));
});
test("workflow transfer and aggregate wiring never uploads enabled exports or weakens the ci bridge", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const nightly = readFileSync(".github/workflows/nightly.yml", "utf8");
  for (const source of [ci, nightly]) {
    assert.match(source, /pack-off out \.ci-off-artifact/);
    assert.match(source, /unpack-off out \.ci-off-artifact/);
    assert.match(source, /CI_MANIFEST_SHA256:/);
    assert.match(source, /persist-credentials: false/);
    assert.doesNotMatch(source, /contents: write|pull-requests: write|tar -xf/);
    assert.doesNotMatch(source, /path: out-assistant-fixture/);
  }
  assert.match(ci, /acceptance\.ts bridge/);
  assert.match(ci, /attest-native out-assistant-fixture/);
  assert.match(ci, /rockylinux:8@sha256:/);
  assert.match(ci, /wasm bindings loaded/);
  assert.match(nightly, /update_snapshots:[\s\S]*default: false/);
  assert.match(nightly, /--collect.numberOfRuns=5/);
  assert.match(nightly, /Clean clone retains no banner or cookies/);
});

test("quarantine validates before destination writes and rejects real symlinks/hardlinks/drift", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-ci-policy-"));
  const artifact = join(root, "quarantine");
  const payload = join(artifact, "payload");
  const destination = join(root, "out");
  try {
    mkdirSync(payload, { recursive: true });
    const info = Buffer.from(
      JSON.stringify({
        sha: binding.source_sha,
        ref: "develop",
        builtAt: "2026-10-18T00:00:00Z",
        output: "export",
        assistant: "disabled",
      }),
    );
    writeFileSync(join(payload, "index.html"), "synthetic OFF");
    writeFileSync(join(payload, "build-info.json"), info);
    const files = payloadInventory(payload);
    const serialized = JSON.stringify({ ...manifest, build_id: digest(info), files });
    writeFileSync(join(artifact, "manifest.json"), serialized);
    validateOffArtifact(artifact, binding, digest(serialized));
    assert.equal(existsSync(destination), false);
    assert.equal(readFileSync(join(artifact, "manifest.json"), "utf8"), serialized);
    const reject = () => {
      assert.throws(() => validateOffArtifact(artifact, binding, digest(serialized)));
      assert.equal(existsSync(destination), false);
    };
    assert.throws(() => validateOffArtifact(artifact, binding, "0".repeat(64)));
    writeFileSync(join(payload, "unexpected.html"), "extra");
    reject();
    rmSync(join(payload, "unexpected.html"));
    symlinkSync(join(payload, "index.html"), join(payload, "linked.html"));
    reject();
    rmSync(join(payload, "linked.html"));
    linkSync(join(payload, "index.html"), join(payload, "hardlinked.html"));
    reject();
    rmSync(join(payload, "hardlinked.html"));
    symlinkSync(payload, join(payload, "recursive-directory"));
    reject();
    rmSync(join(payload, "recursive-directory"));
    writeFileSync(join(artifact, "unexpected.json"), "{}");
    reject();
    rmSync(join(artifact, "unexpected.json"));
    writeFileSync(join(payload, "index.html"), "changed");
    reject();
    rmSync(join(payload, "index.html"));
    reject();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("analyzer rebuild has fresh metadata, its own OFF verification and manifest-only evidence", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const nightly = readFileSync(".github/workflows/nightly.yml", "utf8");
  assert.match(ci, /max-parallel: 4/);
  const bundle = nightly.slice(nightly.indexOf("\n  bundle:\n"), nightly.indexOf("\n  checks:\n"));
  const commands = [
    "npx lhci autorun --collect.numberOfRuns=5",
    "node scripts/build-info.ts",
    "npm run analyze",
    "npm run check:assistant-disabled",
    "node scripts/ci/artifacts.ts pack-off out .ci-analyzer-artifact",
  ];
  let previous = -1;
  for (const command of commands) {
    const index = bundle.indexOf(command);
    assert.ok(index > previous, `Required analyzer provenance step missing/out of order: ${command}`);
    previous = index;
  }
  const upload = bundle.slice(bundle.indexOf("      - name: Upload Lighthouse and bundle reports"));
  assert.match(upload, /^\s+\.ci-analyzer-artifact\/manifest\.json$/m);
  assert.doesNotMatch(
    upload,
    /^\s+(?:out\/?|\.ci-analyzer-artifact\/?|\.ci-analyzer-artifact\/payload\/?)$/m,
  );
});

function requireDiscoveryStdoutAndHiddenEvidence(workflow: string): void {
  const browser = workflow.slice(workflow.indexOf("\n  browser:\n"), workflow.indexOf("\n  performance:\n"));
  assert.match(browser, /PLAYWRIGHT_JSON_OUTPUT_NAME: \.ci-evidence\/results\.json/);
  const discovery = browser.slice(
    browser.indexOf("      - name: Prove every test belongs"),
    browser.indexOf("      - name: Build the unpublishable native fixture"),
  );
  const listings = discovery.split("\n").filter((line) => line.includes("--list --reporter=json"));
  assert.equal(listings.length, 2);
  for (const command of listings) {
    assert.match(command, /env -u PLAYWRIGHT_JSON_OUTPUT_NAME npx playwright test/);
  }
  const upload = browser.slice(browser.indexOf("      - name: Upload bounded verification evidence"));
  assert.match(upload, /include-hidden-files: true/);
  assert.match(upload, /^\s+\.ci-evidence\/$/m);
  assert.doesNotMatch(upload, /^\s+(?:\.|\.assistant-api\/?|out-assistant-fixture\/?|\.env[^\s]*)$/m);
}

test("global runtime JSON reporter cannot consume discovery stdout or omit hidden evidence", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  requireDiscoveryStdoutAndHiddenEvidence(ci);
  assert.throws(() =>
    requireDiscoveryStdoutAndHiddenEvidence(ci.replaceAll("env -u PLAYWRIGHT_JSON_OUTPUT_NAME ", "")),
  );
  const browserStart = ci.indexOf("\n  browser:\n");
  const performanceStart = ci.indexOf("\n  performance:\n");
  assert.throws(() =>
    requireDiscoveryStdoutAndHiddenEvidence(
      ci.slice(0, browserStart) +
        ci.slice(browserStart, performanceStart).replace("          include-hidden-files: true\n", "") +
        ci.slice(performanceStart),
    ),
  );
});

test("Nightly uploads hidden evidence only within the existing bounded report paths", () => {
  const nightly = readFileSync(".github/workflows/nightly.yml", "utf8");
  const browser = nightly.slice(nightly.indexOf("\n  browser:\n"), nightly.indexOf("\n  visual:\n"));
  assert.doesNotMatch(browser.slice(0, browser.indexOf("\n    steps:")), /PLAYWRIGHT_JSON_OUTPUT_NAME/);
  const upload = browser.slice(browser.indexOf("      - name: Upload Playwright report"));
  assert.match(upload, /include-hidden-files: true/);
  assert.match(upload, /^\s+nightly-evidence$/m);
  assert.doesNotMatch(upload, /^\s+(?:\.|\.assistant-api\/?|out-assistant-fixture\/?|\.env[^\s]*)$/m);
});
