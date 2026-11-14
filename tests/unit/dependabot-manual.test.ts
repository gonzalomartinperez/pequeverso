import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Dependabot assessment cannot acquire a write token or perform a merge", () => {
  const workflow = readFileSync(".github/workflows/dependency-policy.yml", "utf8");
  assert.doesNotMatch(workflow, /(?:^|[\s{,])["']?[\w-]+["']?\s*:\s*["']?write(?:-all)?["']?(?=$|[\s,}])/m);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge|enablePullRequestAutoMerge/);
  assert.match(workflow, /pull-requests: read/);
});

/**
 * Weekly single dependency PR (ecosystem 5, OD-22, OD-75; verified Dependabot constraints in the
 * shared dependabot-rule.md): one multi-ecosystem group carries schedule, target, PR limit and
 * commit message; entries only join it; semver cooldowns only on package ecosystems.
 */
test("Dependabot config is one weekly group on Monday 09:00 ART targeting develop", () => {
  const config = readFileSync(".github/dependabot.yml", "utf8");
  const groups = config.slice(config.indexOf("multi-ecosystem-groups:"), config.indexOf("\nupdates:"));
  assert.equal((groups.match(/^ {2}[a-z][\w-]*:$/gm) ?? []).length, 1, "exactly one group");
  assert.match(groups, /interval: weekly/);
  assert.match(groups, /day: monday/);
  assert.match(groups, /time: "09:00"/);
  assert.match(groups, /timezone: America\/Argentina\/Buenos_Aires/);
  assert.match(groups, /target-branch: develop/);
  assert.match(groups, /open-pull-requests-limit: 1/);
  const group = /^ {2}([a-z][\w-]*):$/m.exec(groups)?.[1] ?? "";

  const entries = config
    .slice(config.indexOf("\nupdates:"))
    .split(/\n {2}- package-ecosystem: /)
    .slice(1);
  assert.ok(entries.length >= 3, "npm (root and tools/media) and github-actions");
  for (const entry of entries) {
    const ecosystem = entry.split("\n")[0]?.trim() ?? "";
    assert.match(entry, new RegExp(`multi-ecosystem-group: ${group}\\n`), `${ecosystem} joins the group`);
    assert.match(entry, /patterns: \["\*"\]/, `${ecosystem} groups every dependency`);
    for (const key of ["open-pull-requests-limit", "commit-message", "schedule", "target-branch"])
      assert.doesNotMatch(entry, new RegExp(`\\n {4}${key}:`), `${ecosystem}: ${key} belongs on the group`);
    assert.match(entry, /cooldown:\n {6}default-days: 7/, `${ecosystem} keeps the 7-day cooldown`);
    if (ecosystem !== "npm" && ecosystem !== "uv" && ecosystem !== "pip")
      assert.doesNotMatch(entry, /semver-(major|minor|patch)-days/, `${ecosystem} rejects semver cooldowns`);
  }
});

test("the weekly guard and the daily vulnerability job reuse the pinned standards workflows", () => {
  for (const [file, workflow] of [
    [".github/workflows/deps-weekly-guard.yml", "deps-weekly-guard.yml"],
    [".github/workflows/vuln-daily.yml", "vuln-daily.yml"],
  ] as const) {
    const source = readFileSync(file, "utf8");
    assert.match(
      source,
      new RegExp(
        `uses: gonzalomartinperez/engineering-standards/\\.github/workflows/${workflow.replace(".", "\\.")}@[0-9a-f]{40} `,
      ),
    );
    assert.match(source, /^permissions: \{\}$/m);
    assert.doesNotMatch(source, /contents: write|@\w+ rebase/);
  }
  assert.match(readFileSync(".github/workflows/deps-weekly-guard.yml", "utf8"), /group-name: weekly-all/);
});
