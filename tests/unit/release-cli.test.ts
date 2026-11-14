import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseVersion, requireNotes } from "../../tools/release-notes.ts";
import { runCli } from "./cli-process.ts";

const run = (_script: string, args: string[], cwd: string) =>
  runCli(new URL("../../tools/release-notes.ts", import.meta.url).pathname, args, cwd);

test("release CLI writes current reviewed notes, rejects missing arguments and reports write failures", () => {
  const root = mkdtempSync(join(tmpdir(), "pv-release-cli-"));
  try {
    const output = join(root, "notes.md");
    const version = parseVersion(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    );
    const notes = requireNotes(
      readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8"),
      version,
    );
    const result = run("release-notes", ["--out", output], root);
    assert.equal(result.status, 0, result.stderr);
    // A version bump may precede its CHANGELOG section: assert the contract, not today's data.
    const hasSection = notes !== undefined && notes.trim() !== "";
    assert.equal(result.stdout, `version=${version}\nhas_section=${hasSection}\n`);
    if (hasSection) assert.equal(readFileSync(output, "utf8"), `${notes}\n`);
    for (const args of [[], ["--out"]]) {
      const invalid = run("release-notes", args, root);
      assert.equal(invalid.status, 2);
      assert.match(invalid.stderr, /usage: node tools\/release-notes.ts/);
    }
    const invalid = run("release-notes", ["--out", join(root, "missing", "notes.md")], root);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /::error title=release::.*ENOENT/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
