import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkSkills } from "../../tools/check-skills.ts";

const root = path.resolve(import.meta.dirname, "../..");

test("the committed skill catalog is valid", () => {
  assert.deepEqual(checkSkills(root), []);
});

/** A copy of the real catalog in a temp dir, broken by `mutate`, returns the problems found. */
function broken(mutate: (dir: string) => void): string[] {
  const dir = mkdtempSync(path.join(tmpdir(), "pv-skills-"));
  try {
    for (const entry of [".agents", ".claude", "CLAUDE.md", "package.json", "docs", "tools", "config", "src"])
      cpSync(path.join(root, entry), path.join(dir, entry), { recursive: true });
    mkdirSync(path.join(dir, "tests"));
    for (const entry of ["helpers", "unit"])
      cpSync(path.join(root, "tests", entry), path.join(dir, "tests", entry), { recursive: true });
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
    edit(path.join(dir, ".claude/skills/prepare-delivery/SKILL.md"), (t) =>
      t.replace("Cut a tagged", "Cut any"),
    ),
  );
  assert.ok(problems.some((p) => p.includes("prepare-delivery: adapter frontmatter drifted")));
});

test("a skill without limits or exclusions is rejected", () => {
  const problems = broken((dir) => {
    for (const base of [".agents", ".claude"])
      edit(path.join(dir, base, "skills/prepare-delivery/SKILL.md"), (t) =>
        t.replace(" Not an authorization to release or deploy.", "").replace(/## Limits[\s\S]*$/, ""),
      );
  });
  assert.ok(problems.some((p) => p.includes('prepare-delivery: missing "## Limits" section')));
  assert.ok(
    problems.some((p) => p.includes("prepare-delivery: description must state what the skill is not for")),
  );
});

test("private paths, secrets, unknown scripts and placeholders are rejected", () => {
  const problems = broken((dir) =>
    edit(
      path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"),
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
  const problems = broken((dir) =>
    rmSync(path.join(dir, ".claude/skills/prepare-delivery"), { recursive: true }),
  );
  assert.ok(problems.some((p) => p.includes("catalogs differ")));
});

test("Claude adapters cannot duplicate procedural instructions", () => {
  const problems = broken((dir) =>
    edit(
      path.join(dir, ".claude/skills/prepare-delivery/SKILL.md"),
      (text) => `${text}\nRun a release directly.\n`,
    ),
  );
  assert.ok(problems.some((problem) => problem.includes("only the canonical skill reference")));
});

test("skill frontmatter naming and canonical references remain enforced", () => {
  const named = broken((dir) =>
    edit(path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"), (text) =>
      text.replace("name: prepare-delivery", "name: wrong-name"),
    ),
  );
  assert.ok(named.some((problem) => problem.includes("name must match its folder")));
  const referenced = broken((dir) =>
    edit(path.join(dir, ".claude/skills/prepare-delivery/SKILL.md"), (text) =>
      text.replace("skills/prepare-delivery/SKILL.md", "skills/missing/SKILL.md"),
    ),
  );
  assert.ok(referenced.some((problem) => problem.includes("only the canonical skill reference")));
});

test("broken and outside canonical references are rejected", () => {
  for (const [reference, expected] of [
    ["missing.md", "broken link"],
    ["../../../../outside.md", "reference outside repository"],
  ]) {
    const problems = broken((dir) =>
      edit(
        path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"),
        (text) => `${text}\n[Reference](${reference})\n`,
      ),
    );
    assert.ok(problems.some((problem) => problem.includes(expected ?? "")));
  }
});

test("duplicate frontmatter fields are rejected", () => {
  const problems = broken((dir) =>
    edit(path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"), (text) =>
      text.replace("name: prepare-delivery", "name: prepare-delivery\nname: prepare-delivery"),
    ),
  );
  assert.ok(problems.some((problem) => problem.includes("duplicate frontmatter field name")));
});

test("skill entry links and escaped resource realpaths are rejected", () => {
  const linked = broken((dir) => {
    const adapter = path.join(dir, ".claude/skills/prepare-delivery/SKILL.md");
    rmSync(adapter);
    symlinkSync("../../../.agents/skills/prepare-delivery/SKILL.md", adapter);
  });
  assert.ok(linked.some((problem) => problem.includes("entries must be regular files")));
  const escaped = broken((dir) => {
    const reference = path.join(dir, ".agents/skills/prepare-delivery/references");
    mkdirSync(reference);
    symlinkSync("/tmp", path.join(reference, "outside"), "dir");
    edit(
      path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"),
      (text) => `${text}\n[Reference](references/outside)\n`,
    );
  });
  assert.ok(escaped.some((problem) => problem.includes("outside repository skill resource")));
  assert.ok(escaped.some((problem) => problem.includes("reference outside repository")));
});

test("skill catalogs keep real directories while confined resource links stay valid", () => {
  const catalog = broken((dir) => {
    rmSync(path.join(dir, ".claude/skills"), { recursive: true });
    symlinkSync("../.agents/skills", path.join(dir, ".claude/skills"), "dir");
  });
  assert.ok(catalog.some((problem) => problem.includes("catalog must be a real directory")));
  const internal = broken((dir) => {
    const reference = path.join(dir, ".agents/skills/prepare-delivery/references");
    mkdirSync(reference);
    symlinkSync("../../../../docs/architecture.md", path.join(reference, "guide.md"));
    edit(
      path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"),
      (text) => `${text}\n[Reference](references/guide.md)\n`,
    );
  });
  assert.deepEqual(internal, []);
});
