import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkSkills } from "../../scripts/check-skills.ts";

const root = path.resolve(import.meta.dirname, "../..");

test("the committed skill catalog is valid", () => {
  assert.deepEqual(checkSkills(root), []);
});

/** A copy of the real catalog in a temp dir, broken by `mutate`, returns the problems found. */
function broken(mutate: (dir: string) => void): string[] {
  const dir = mkdtempSync(path.join(tmpdir(), "pv-skills-"));
  try {
    for (const entry of [".agents", ".claude", "CLAUDE.md", "package.json", "docs", "scripts", "config"])
      cpSync(path.join(root, entry), path.join(dir, entry), { recursive: true });
    mutate(dir);
    return checkSkills(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const edit = (file: string, change: (text: string) => string) =>
  writeFileSync(file, change(readFileSync(file, "utf8")));

test("adapter drift is detected", () => {
  const problems = broken((dir) =>
    edit(path.join(dir, ".claude/skills/release/SKILL.md"), (t) => t.replace("Cut a tagged", "Cut any")),
  );
  assert.ok(problems.some((p) => p.includes("release: adapter frontmatter drifted")));
});

test("a skill without limits or exclusions is rejected", () => {
  const problems = broken((dir) => {
    for (const base of [".agents", ".claude"])
      edit(path.join(dir, base, "skills/release/SKILL.md"), (t) =>
        t.replace(" Not an authorization to release or deploy.", "").replace(/## Limits[\s\S]*$/, ""),
      );
  });
  assert.ok(problems.some((p) => p.includes('release: missing "## Limits" section')));
  assert.ok(problems.some((p) => p.includes("release: description must state what the skill is not for")));
});

test("private paths, secrets, unknown scripts and placeholders are rejected", () => {
  const problems = broken((dir) =>
    edit(
      path.join(dir, ".agents/skills/release/SKILL.md"),
      (t) => `${t}\nRun npm run deploy:now from /home/someone with sk-${"a".repeat(24)}. TODO\n`,
    ),
  );
  for (const expected of [
    "absolute private path",
    "secret-like token",
    "unknown npm script deploy:now",
    "placeholder text",
  ])
    assert.ok(
      problems.some((p) => p.includes(expected)),
      expected,
    );
});

test("a skill present in only one catalog is rejected", () => {
  const problems = broken((dir) => rmSync(path.join(dir, ".claude/skills/release"), { recursive: true }));
  assert.ok(problems.some((p) => p.includes("catalogs differ")));
});
