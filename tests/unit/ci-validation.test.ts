import assert from "node:assert/strict";
import { test } from "node:test";
import { prerequisites, requireSuccessfulJobs } from "../../tools/ci/acceptance.ts";
import {
  type Binding,
  buildIdentity,
  digest,
  requireBinding,
  requireManifest,
  requireMembers,
  requireRegular,
  safeMember,
} from "../../tools/ci/artifacts.ts";
import { requirePartition, testIdentities } from "../../tools/ci/inventories.ts";

const binding: Binding = {
  repository: "gonzalomartinperez/pequeverso",
  source_sha: "a".repeat(40),
  workflow_sha: "b".repeat(40),
  configuration_sha256: "c".repeat(64),
  lock_sha256: "d".repeat(64),
  run_id: "1",
  run_attempt: "1",
};
const members = ["index.html", "build-info.json"].map((path) => ({
  path,
  size: 0,
  sha256: digest(""),
}));

test("artifact validators reject malformed containers and identity formats before transfer", () => {
  for (const invalid of [null, false, [], "binding"]) {
    assert.throws(() => requireBinding(invalid, binding), /Invalid artifact object/);
  }
  for (const [key, value] of [
    ["workflow_sha", "unknown"],
    ["configuration_sha256", "bad"],
    ["lock_sha256", ""],
    ["run_id", "0"],
    ["run_attempt", "-1"],
  ]) {
    const invalid = { ...binding, [key ?? ""]: value };
    assert.throws(() => requireBinding(invalid, invalid), /Invalid (source|input|run) identity/);
  }
  for (const path of [null, 1, "", "a".repeat(513), "control\u007f"]) {
    assert.throws(() => safeMember(path), /Unsafe artifact member/);
  }
  for (const value of [null, [], {}]) {
    assert.throws(() => requireMembers(value), /Invalid artifact file inventory/);
  }
  for (const sha256 of [null, "INVALID", "a".repeat(63)]) {
    assert.throws(
      () => requireMembers([{ ...members[0], sha256 }, members[1]]),
      /Invalid total size\/member identity/,
    );
  }
  const manifest = {
    schema_version: 1,
    variant: "off-export",
    binding,
    build_id: digest("build"),
    files: members,
  };
  for (const build_id of [null, "invalid"]) {
    assert.throws(
      () => requireManifest({ ...manifest, build_id }, binding, members),
      /Invalid build identity/,
    );
  }
  const info = {
    sha: binding.source_sha,
    assistant: "disabled",
    site_analytics: "disabled",
    output: "export",
    ref: "fixture",
    builtAt: "2026-11-01T00:00:00Z",
  };
  for (const changed of [{ ref: " " }, { builtAt: false }, { builtAt: "invalid" }]) {
    assert.throws(
      () =>
        buildIdentity(Buffer.from(JSON.stringify({ ...info, ...changed })), binding, "disabled"),
      /Build identity mismatch/,
    );
  }
});

test("nightly evidence rejects arrays, primitive jobs and empty job results", () => {
  const success = Object.fromEntries(
    prerequisites.nightly.map((name) => [name, { result: "success" }]),
  );
  assert.throws(() => requireSuccessfulJobs([], "nightly"), /Required job evidence is missing/);
  for (const quality of [null, 1, "success", {}]) {
    assert.throws(
      () => requireSuccessfulJobs({ ...success, quality }, "nightly"),
      /Every required job must complete successfully/,
    );
  }
});

test("test discovery rejects malformed reports and ambiguous positions or repeat identities", () => {
  const valid = {
    file: "fixture.spec.ts",
    title: "case",
    line: 1,
    column: 1,
    tests: [{ projectName: "chromium-390" }],
  };
  for (const value of [null, [], { suites: null }, { errors: {}, suites: [] }]) {
    assert.throws(() => testIdentities(value, "functional"), /Invalid test inventory/);
  }
  for (const changed of [
    { file: "" },
    { file: 1 },
    { line: 1.5 },
    { column: 0 },
    { column: 1.5 },
    { id: 1 },
    { tests: null },
    { tests: [{ projectName: "" }] },
    { tests: [{ projectName: "chromium-390", repeatEachIndex: -1 }] },
    { tests: [{ projectName: "chromium-390", repeatEachIndex: 0.5 }] },
  ]) {
    assert.throws(
      () => testIdentities({ suites: [{ specs: [{ ...valid, ...changed }] }] }, "functional"),
      /Invalid/,
    );
  }
  const identities = testIdentities({ suites: [{ specs: [valid] }] }, "functional");
  assert.deepEqual(JSON.parse(identities[0] ?? ""), [
    "functional",
    "chromium-390",
    "fixture.spec.ts",
    1,
    1,
    "",
    "case",
    null,
    0,
  ]);
});

test("artifact inventories reject reverse prefix conflicts, missing entrypoints and invalid sizes", () => {
  const member = { path: "asset/child", size: 0, sha256: digest("") };
  assert.throws(
    () => requireMembers([...members, member, { ...member, path: "asset" }]),
    /Duplicate or conflicting artifact members/,
  );
  assert.throws(() => requireMembers([members[0]]), /Not an OFF export/);
  assert.throws(
    () => requireMembers([...members, { ...member, size: "1" }]),
    /Invalid member size/,
  );
  assert.throws(
    () => requireRegular({ isFile: () => true, nlink: 1, size: 0.5 }, 1),
    /Expected bounded regular file/,
  );
  const extraBinding = { ...binding, unexpected: "field" };
  assert.throws(() => requireBinding(extraBinding, extraBinding), /Invalid expected producer/);
});

test("partition and discovery validation reject empty sets, duplicate parts and malformed test names", () => {
  for (const [full, parts] of [
    [[], [["a"]]],
    [["a"], []],
    [["a"], [["a", "a"]]],
  ] as [string[], string[][]][]) {
    assert.throws(() => requirePartition(full, parts), /Invalid/);
  }
  for (const title of [null, "", 2]) {
    assert.throws(
      () =>
        testIdentities(
          {
            suites: [
              {
                specs: [
                  {
                    file: "f.ts",
                    title,
                    line: 1,
                    column: 1,
                    tests: [{ projectName: "chromium-390" }],
                  },
                ],
              },
            ],
          },
          "functional",
        ),
      /Invalid test identity/,
    );
  }
  assert.throws(
    () => requireSuccessfulJobs("success", "nightly"),
    /Required job evidence is missing/,
  );
});
