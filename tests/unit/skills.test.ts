import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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
    for (const entry of [
      ".agents",
      ".claude",
      "CLAUDE.md",
      "package.json",
      "docs",
      "tools",
      "config",
      "src",
    ])
      cpSync(path.join(root, entry), path.join(dir, entry), {
        recursive: true,
        verbatimSymlinks: true,
      });
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

test("a skill without limits or exclusions is rejected", () => {
  const problems = broken((dir) => {
    edit(path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"), (t) =>
      t.replace(" Not an authorization to release or deploy.", "").replace(/## Limits[\s\S]*$/, ""),
    );
  });
  assert.ok(problems.some((p) => p.includes('prepare-delivery: missing "## Limits" section')));
  assert.ok(
    problems.some((p) =>
      p.includes("prepare-delivery: description must state what the skill is not for"),
    ),
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

test("skill frontmatter naming and canonical references remain enforced", () => {
  const named = broken((dir) =>
    edit(path.join(dir, ".agents/skills/prepare-delivery/SKILL.md"), (text) =>
      text.replace("name: prepare-delivery", "name: wrong-name"),
    ),
  );
  assert.ok(named.some((problem) => problem.includes("name must match its folder")));
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

const link = ".claude/skills/prepare-delivery";

test("a missing Claude symlink is rejected", () => {
  const problems = broken((dir) => rmSync(path.join(dir, link)));
  assert.ok(problems.some((p) => p.includes("prepare-delivery: missing .claude/skills symlink")));
});

test("a Claude adapter that is a regular directory is rejected", () => {
  const problems = broken((dir) => {
    rmSync(path.join(dir, link));
    mkdirSync(path.join(dir, link));
    writeFileSync(path.join(dir, link, "SKILL.md"), "---\nname: prepare-delivery\n---\n");
  });
  assert.ok(
    problems.some((p) => p.includes("prepare-delivery: .claude/skills entry must be a symlink")),
  );
});

test("a Claude symlink pointing elsewhere or with an absolute target is rejected", () => {
  for (const target of [
    "../../.agents/skills/review-change",
    path.join(root, ".agents/skills/prepare-delivery"),
  ]) {
    const problems = broken((dir) => {
      rmSync(path.join(dir, link));
      symlinkSync(target, path.join(dir, link), "dir");
    });
    assert.ok(
      problems.some((p) =>
        p.includes("link must be exactly ../../.agents/skills/prepare-delivery"),
      ),
    );
  }
});

test("a stale repo link and a regular extra entry are rejected, external links are ignored", () => {
  const problems = broken((dir) => {
    symlinkSync("../../.agents/skills/ghost", path.join(dir, ".claude/skills/ghost"), "dir");
    mkdirSync(path.join(dir, ".claude/skills/stray"));
  });
  assert.ok(
    problems.some((p) =>
      p.includes("ghost: .claude/skills link targets a missing canonical skill"),
    ),
  );
  assert.ok(problems.some((p) => p.includes("stray: .claude/skills entry has no canonical")));
  assert.deepEqual(
    broken((dir) => {
      symlinkSync("/tmp", path.join(dir, ".claude/skills/external"), "dir");
      symlinkSync("/tmp", path.join(dir, ".agents/skills/external"), "dir");
    }),
    [],
  );
});

test("escaped resource realpaths are rejected", () => {
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

const hasGit = (() => {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

test("a tracked external-looking skill link fails closed", { skip: !hasGit }, () => {
  const problems = broken((dir) => {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", dir, ...args], { stdio: "ignore" });
    git("init", "-q");
    symlinkSync("/tmp", path.join(dir, ".claude/skills/external"), "dir");
    symlinkSync("/tmp", path.join(dir, ".agents/skills/external"), "dir");
    git("add", ".claude/skills", ".agents/skills");
  });
  assert.ok(problems.some((p) => p.includes(".claude/skills/external: tracked")));
  assert.ok(problems.some((p) => p.includes(".agents/skills/external: tracked")));
});
