import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { extractSection, parseVersion, requireNotes } from "../../tools/release-notes.ts";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("the current package.json version has a non-empty CHANGELOG section", () => {
  const version = parseVersion(read("package.json"));
  assert.ok(requireNotes(read("CHANGELOG.md"), version));
});

test("parseVersion accepts only X.Y.Z", () => {
  assert.equal(parseVersion('{"version":"1.2.3"}'), "1.2.3");
  assert.throws(() => parseVersion('{"version":"1.2"}'));
  assert.throws(() => parseVersion('{"version":"1.2.3-rc.1"}'));
  assert.throws(() => parseVersion("{}"));
});

const changelog = [
  "# Changelog",
  "",
  "## [Unreleased]",
  "",
  "- pending",
  "",
  "## [1.1.0] - 2026-11-01",
  "",
  "### Added",
  "- hyphen",
  "",
  "## [1.0.0] — 2026-10-13",
  "",
  "### Fixed",
  "- em dash",
  "",
  "## [0.9.0] - 2026-09-01",
  "",
  "## [0.8.0] - 2026-08-01",
  "- last",
  "",
  "[0.8.0]: https://example.invalid/0.8.0",
  "",
].join("\n");

test("extractSection handles hyphen and em dash headings and stops at the next heading", () => {
  assert.equal(extractSection(changelog, "1.1.0"), "### Added\n- hyphen");
  assert.equal(extractSection(changelog, "1.0.0"), "### Fixed\n- em dash");
  assert.equal(extractSection(changelog, "0.8.0"), "- last");
});

test("extractSection tolerates CRLF line endings", () => {
  assert.equal(extractSection(changelog.replaceAll("\n", "\r\n"), "1.0.0"), "### Fixed\n- em dash");
});

test("a missing section is undefined and does not match a version prefix", () => {
  assert.equal(extractSection(changelog, "2.0.0"), undefined);
  assert.equal(extractSection(changelog, "1.1"), undefined);
  assert.equal(requireNotes(changelog, "2.0.0"), undefined);
});

test("an empty section is rejected", () => {
  assert.equal(extractSection(changelog, "0.9.0"), "");
  assert.throws(() => requireNotes(changelog, "0.9.0"), /is empty/);
});

test("release.yml triggers only on push to main and does not touch deploy.yml", () => {
  const workflow = read(".github/workflows/release.yml");
  const on = workflow.match(/^"on":\n((?: {2}.*\n)+)/m)?.[1] ?? "";
  assert.equal(on, "  push:\n    branches:\n      - main\n");
  assert.match(workflow, /^permissions: \{\}$/m);
  assert.doesNotMatch(workflow, /workflow_dispatch|pull_request|tags:/);
  const uses = [...workflow.matchAll(/^\s*(?:- )?uses: (\S+)/gm)].map((match) => match[1]);
  assert.ok(uses.length > 0);
  for (const action of uses) assert.match(action ?? "", /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
  assert.doesNotMatch(workflow.replace(/^\s*#.*$/gm, ""), /npm (ci|run)|deploy|hostinger/i);
});
