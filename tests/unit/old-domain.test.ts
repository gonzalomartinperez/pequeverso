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

/**
 * Tracked and untracked (not ignored) files, so a new file fails before it is committed. Needs a
 * git checkout, like `architecture.test.ts`; CI and local work always have one.
 */
function repositoryFiles(): string[] {
  const listed = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      timeout: 10_000,
    },
  );
  return [...new Set(listed.split("\0").filter(Boolean))];
}

type Reader = (path: string) => Buffer | undefined;

const readTracked: Reader = (path) => {
  try {
    return readFileSync(path);
  } catch {
    return undefined; // deleted in the working tree, or a symlinked directory
  }
};

/** Binary files (images, fonts, video) are skipped; UTF-16 text would be skipped too (none exists). */
function mentionsOldDomain(bytes: Buffer | undefined): boolean {
  if (!bytes || bytes.subarray(0, 8000).includes(0)) return false;
  return oldDomain.test(bytes.toString("utf8"));
}

function findOffenders(files: readonly string[], read: Reader): string[] {
  return files.filter((path) => !isAllowed(path) && mentionsOldDomain(read(path)));
}

test("no file outside the allowlist mentions the retired domain (OD-53)", () => {
  const files = repositoryFiles();
  assert.ok(files.length > 100, "expected the repository file list");
  assert.deepEqual(
    findOffenders(files, readTracked),
    [],
    "replace the retired domain with pequeverso.com",
  );
});

test("the scan flags the negative fixture content outside the allowlist and skips binaries", () => {
  const files = repositoryFiles();
  assert.ok(files.includes(fixture), "negative fixture must stay in the repository");
  const content = readTracked(fixture);
  assert.equal(mentionsOldDomain(content), true);
  const fake = new Map<string, Buffer | undefined>([
    [fixture, content],
    ["SECURITY.md", content],
    ["docs/master-plan-copy/notes.md", content],
    ["docs/master-plan/audit.md", content],
    ["public/logo.png", Buffer.concat([Buffer.from([0x89, 0x00]), content ?? Buffer.alloc(0)])],
    ["README.md", Buffer.from("https://pequeverso.com/")],
  ]);
  assert.deepEqual(
    findOffenders([...fake.keys()], (path) => fake.get(path)),
    ["SECURITY.md", "docs/master-plan-copy/notes.md"],
  );
});
