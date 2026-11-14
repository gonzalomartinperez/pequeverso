import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * OD-53 / DR-14: the previous operator domain (digitalproductsteam.com) is not renewed and not
 * redirected; every tracked file must use only pequeverso.com. The plan records under
 * `docs/master-plan/`, this test and its negative fixture are the only allowed mentions.
 */
const oldDomain = /digitalproductsteam/i;
const fixture = "tests/unit/fixtures/old-domain/negative.md";
const allowlist = ["docs/master-plan/", "tests/unit/old-domain.test.ts", fixture];

const isAllowed = (path: string): boolean =>
  allowlist.some((entry) => (entry.endsWith("/") ? path.startsWith(entry) : path === entry));

/** Tracked and untracked (not ignored) files, so a new file fails before it is committed. */
function repositoryFiles(): string[] {
  const listed = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 10_000,
  });
  return [...new Set(listed.split("\0").filter(Boolean))];
}

function mentionsOldDomain(path: string): boolean {
  let bytes: Buffer;
  try {
    bytes = readFileSync(path);
  } catch {
    return false; // deleted in the working tree, or a symlinked directory
  }
  if (bytes.subarray(0, 8000).includes(0)) return false; // binary (images, fonts, video)
  return oldDomain.test(bytes.toString("utf8"));
}

test("no file outside the allowlist mentions the retired domain (OD-53)", () => {
  const files = repositoryFiles();
  assert.ok(files.length > 100, "expected the repository file list");
  const offenders = files.filter((path) => !isAllowed(path) && mentionsOldDomain(path));
  assert.deepEqual(offenders, [], "replace the retired domain with pequeverso.com");
});

test("the scan detects the retired domain in the negative fixture", () => {
  assert.ok(repositoryFiles().includes(fixture), "negative fixture must stay in the repository");
  assert.equal(mentionsOldDomain(fixture), true);
  assert.equal(isAllowed(fixture), true);
  assert.equal(isAllowed("SECURITY.md"), false);
  assert.equal(isAllowed("docs/master-plan-copy/notes.md"), false);
});
