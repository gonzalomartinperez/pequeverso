import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * CI profile map (.github/ci-profile.json, ecosystem 6.0). The engineering-standards `classify`
 * workflow applies it; these tests keep the map and ci.yml consistent and fail closed:
 * every tracked file belongs to a profile, every job the map names exists, and every gated job
 * reaches `ci-gate`.
 */
type Profile = { paths?: string[]; adds?: string[]; trigger?: string; all?: boolean };
type ProfileMap = { version: number; base: string[]; profiles: Record<string, Profile>; required: string };

const map = JSON.parse(readFileSync(".github/ci-profile.json", "utf8")) as ProfileMap;
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const jobsSection = ci.slice(ci.indexOf("\njobs:\n"));
const jobIds = [...jobsSection.matchAll(/^ {2}([a-z][a-z0-9-]*):$/gm)].map((match) => match[1] ?? "");
const gateOnly = new Set(["classify", "ci-gate", "ci"]);
const gatedJobs = jobIds.filter((job) => !gateOnly.has(job));

/** Same glob semantics as the classify workflow: a double star spans directories, `*` and `?` stay in one segment. */
function globToRegex(pattern: string): RegExp {
  let out = "";
  for (let i = 0; i < pattern.length; ) {
    if (pattern.startsWith("**/", i)) {
      out += "(?:.*/)?";
      i += 3;
    } else if (pattern.startsWith("**", i)) {
      out += ".*";
      i += 2;
    } else if (pattern[i] === "*") {
      out += "[^/]*";
      i += 1;
    } else if (pattern[i] === "?") {
      out += "[^/]";
      i += 1;
    } else {
      out += (pattern[i] ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i += 1;
    }
  }
  return new RegExp(`^${out}$`);
}

const pathProfiles = Object.entries(map.profiles).filter(([, profile]) => profile.paths?.length);
const profilesFor = (file: string): string[] =>
  pathProfiles
    .filter(([, profile]) => (profile.paths ?? []).some((pattern) => globToRegex(pattern).test(file)))
    .map(([name]) => name);

test("every tracked file belongs to at least one path profile (no silent fail-closed runs)", () => {
  const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", timeout: 10_000 })
    .split("\0")
    .filter(Boolean);
  assert.ok(files.length > 100);
  assert.deepEqual(
    files.filter((file) => profilesFor(file).length === 0),
    [],
    "add these paths to a profile in .github/ci-profile.json",
  );
});

test("profile routing: docs stay on the fast path, code and workflows run everything", () => {
  assert.deepEqual(profilesFor("docs/architecture.md"), ["docs"]);
  assert.deepEqual(profilesFor(".agents/skills/review-change/SKILL.md"), ["docs"]);
  assert.deepEqual(profilesFor("docs/generated/htaccess.txt").sort(), ["code", "docs"]);
  assert.deepEqual(profilesFor("src/app/page.tsx"), ["code"]);
  assert.deepEqual(profilesFor(".github/workflows/ci.yml"), ["workflow"]);
  assert.deepEqual(profilesFor("unknown-top-level-file"), []);
  const everything = ["docs", "quality", "build", "hosting", "browser", "performance"];
  for (const name of ["code", "workflow"]) assert.deepEqual(map.profiles[name]?.adds, everything);
  for (const name of ["deps-weekly", "release", "hotfix"])
    assert.ok(map.profiles[name]?.adds?.includes("all-profiles"), `${name} must run every job`);
});

test("every job named by the map exists in ci.yml and every ci.yml job is reachable", () => {
  const named = new Set([
    ...map.base,
    ...Object.values(map.profiles).flatMap((profile) =>
      (profile.adds ?? []).filter((job) => job !== "all-profiles"),
    ),
  ]);
  assert.deepEqual(
    [...named].filter((job) => !gatedJobs.includes(job)),
    [],
    "unknown job in the map",
  );
  assert.deepEqual(
    gatedJobs.filter((job) => !named.has(job)),
    [],
    "ci.yml job no profile can select",
  );
  assert.equal(map.required, "ci-gate");
});

test("every gated job runs only when classify selects it, and ci-gate needs all of them", () => {
  assert.ok(jobIds.includes("classify") && jobIds.includes("ci-gate") && jobIds.includes("ci"));
  for (const job of gatedJobs) {
    const start = jobsSection.indexOf(`\n  ${job}:\n`);
    const next = jobsSection.slice(start + 1).search(/\n {2}[a-z][a-z0-9-]*:\n/);
    const body = jobsSection.slice(start, next === -1 ? undefined : start + 1 + next);
    assert.match(
      body,
      new RegExp(`if: contains\\(fromJSON\\(needs\\.classify\\.outputs\\.jobs\\), '${job}'\\)`),
      `${job} must be gated on classify`,
    );
  }
  const gate = jobsSection.slice(jobsSection.indexOf("\n  ci-gate:\n"), jobsSection.indexOf("\n  ci:\n"));
  for (const job of ["classify", ...gatedJobs]) assert.match(gate, new RegExp(`\\n {6}- ${job}\\n`), job);
});
