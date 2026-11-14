// Validates agent skills: canonical procedures in .agents/skills (Codex) and relative directory
// symlinks in .claude/skills (Claude Code) that point to them. Frontmatter is name + description only, so it
// is parsed without a YAML dependency. Usage: `node tools/check-skills.ts` (exit 1 on problems).

import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
} from "node:fs";
import path from "node:path";

type Parsed = { meta: Record<string, string>; body: string };

const SECRET =
  /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|EAA[A-Za-z0-9]{20,})/;
const PRIVATE_PATH = /\/home\/|\/Users\/|[A-Z]:\\/;
const REPO_FILE = /`((?:tools|tests|docs|config|src)\/[\w./-]+\.(?:ts|tsx|md|json))`/g;

function parse(file: string, problems: string[]): Parsed | undefined {
  const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    problems.push(`${file}: missing frontmatter`);
    return undefined;
  }
  const meta: Record<string, string> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const field = line.match(/^([a-z]+): (.+)$/);
    if (!field?.[1] || !field[2]) problems.push(`${file}: unsupported frontmatter line "${line}"`);
    else if (Object.hasOwn(meta, field[1]))
      problems.push(`${file}: duplicate frontmatter field ${field[1]}`);
    else meta[field[1]] = field[2];
  }
  return { meta, body: match[2] ?? "" };
}

const list = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);

/** Every problem found in the skill catalogs under `root`; empty when the catalog is valid. */
export function checkSkills(root: string): string[] {
  const problems: string[] = [];
  const scripts =
    (
      JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
        scripts?: Record<string, string>;
      }
    ).scripts ?? {};
  for (const catalog of [".agents/skills", ".claude/skills"]) {
    const directory = path.join(root, catalog);
    if (
      !existsSync(directory) ||
      !lstatSync(directory).isDirectory() ||
      lstatSync(directory).isSymbolicLink()
    ) {
      problems.push(`${catalog}: skill catalog must be a real directory`);
      return problems;
    }
  }
  // Repo skills are the real (non-symlink) directories of .agents/skills. Entries that are symlinks
  // there, or symlinks in .claude/skills with other names, are machine-local external skills
  // (locally excluded from git): they are never validated and never make the check fail.
  const canonical = list(path.join(root, ".agents/skills")).filter((name) => {
    const entry = path.join(root, ".agents/skills", name);
    return !lstatSync(entry).isSymbolicLink() && lstatSync(entry).isDirectory();
  });
  if (!canonical.length) problems.push("no skills in .agents/skills");
  const linkPrefix = "../../.agents/skills/";
  // Fail closed for tracked entries: when the root is a git checkout, nothing tracked under the
  // catalogs may be an external or unexpected link; only untracked entries are ignored.
  if (existsSync(path.join(root, ".git"))) {
    const tracked = execFileSync(
      "git",
      ["-C", root, "ls-files", "-s", "--", ".claude/skills", ".agents/skills"],
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean);
    for (const line of tracked) {
      const [info = "", file = ""] = line.split("\t");
      const mode = info.split(" ")[0];
      const parts = file.split("/");
      const name = parts[2] ?? "";
      if (parts[0] === ".agents") {
        if (mode === "120000" || parts.length < 4 || !canonical.includes(name))
          problems.push(
            `${file}: tracked entry in .agents/skills must be a file inside a real skill directory`,
          );
      } else if (parts.length !== 3 || mode !== "120000") {
        problems.push(`${file}: tracked entry in .claude/skills must be a single symlink`);
      } else if (
        readlinkSync(path.join(root, file)) !== `${linkPrefix}${name}` ||
        !canonical.includes(name)
      ) {
        problems.push(`${file}: tracked link must target ${linkPrefix}<canonical skill name>`);
      }
    }
  }
  const rootReal = realpathSync(root);
  for (const name of list(path.join(root, ".claude/skills"))) {
    const entry = path.join(root, ".claude/skills", name);
    const stat = lstatSync(entry);
    const link = stat.isSymbolicLink() ? readlinkSync(entry) : "";
    if (canonical.includes(name)) {
      const expected = `${linkPrefix}${name}`;
      if (!stat.isSymbolicLink())
        problems.push(`${name}: .claude/skills entry must be a symlink to ${expected}`);
      else if (link !== expected)
        problems.push(`${name}: .claude/skills link must be exactly ${expected}, found ${link}`);
      else if (!existsSync(entry)) problems.push(`${name}: .claude/skills link is broken`);
      else if (!realpathSync(entry).startsWith(`${rootReal}${path.sep}`))
        problems.push(`${name}: .claude/skills link resolves outside the repository`);
    } else if (!stat.isSymbolicLink()) {
      problems.push(`${name}: .claude/skills entry has no canonical .agents/skills/${name}`);
    } else if (link.startsWith(linkPrefix)) {
      problems.push(`${name}: .claude/skills link targets a missing canonical skill`);
    }
  }
  for (const name of canonical)
    if (!list(path.join(root, ".claude/skills")).includes(name))
      problems.push(`${name}: missing .claude/skills symlink`);
  const claude = path.join(root, "CLAUDE.md");
  if (!existsSync(claude) || readFileSync(claude, "utf8") !== "@AGENTS.md\n")
    problems.push("CLAUDE.md must be exactly @AGENTS.md");
  const descriptions = new Map<string, string>();
  const rootPath = realpathSync(root);
  const confined = (file: string): boolean => {
    try {
      const resolved = realpathSync(file);
      return resolved === rootPath || resolved.startsWith(`${rootPath}${path.sep}`);
    } catch {
      return false;
    }
  };
  const resources = (directory: string, name: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (!confined(file))
        problems.push(`${name}: broken or outside repository skill resource ${entry.name}`);
      else if (entry.isDirectory() && !entry.isSymbolicLink()) resources(file, name);
    }
  };

  for (const name of canonical) {
    const source = path.join(root, ".agents/skills", name, "SKILL.md");
    if (
      !existsSync(source) ||
      !confined(source) ||
      lstatSync(source).isSymbolicLink() ||
      !lstatSync(source).isFile()
    ) {
      problems.push(`${name}: canonical entry must be a regular SKILL.md file`);
      continue;
    }
    resources(path.dirname(source), name);
    const skill = parse(source, problems);
    if (!skill) continue;
    const description = skill.meta.description ?? "";
    if (Object.keys(skill.meta).sort().join(",") !== "description,name")
      problems.push(`${name}: frontmatter must contain only name and description`);
    if (skill.meta.name !== name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))
      problems.push(`${name}: name must match its folder (kebab-case)`);
    if (description.length < 40 || description.length > 1024)
      problems.push(`${name}: description must be 40-1024 characters`);
    if (!/\bNot (for|an authorization)\b/.test(description))
      problems.push(`${name}: description must state what the skill is not for`);
    const twin = descriptions.get(description);
    if (twin) problems.push(`${name}: same description as ${twin}`);
    descriptions.set(description, name);
    if (!/^## Limits$/m.test(skill.body)) problems.push(`${name}: missing "## Limits" section`);
    if (/\b(TODO|FIXME|TBD)\b/.test(skill.body)) problems.push(`${name}: placeholder text`);
    if (PRIVATE_PATH.test(skill.body)) problems.push(`${name}: absolute private path`);
    if (SECRET.test(skill.body)) problems.push(`${name}: secret-like token`);
    for (const [, target = ""] of skill.body.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const destination = path.resolve(path.dirname(source), target.split("#")[0] ?? "");
      if (destination !== rootPath && !destination.startsWith(`${rootPath}${path.sep}`))
        problems.push(`${name}: reference outside repository ${target}`);
      else if (!existsSync(destination)) problems.push(`${name}: broken link ${target}`);
      else if (!confined(destination))
        problems.push(`${name}: reference outside repository ${target}`);
    }
    for (const [, script = ""] of skill.body.matchAll(/npm run ([a-z0-9:-]+)/g))
      if (!scripts[script]) problems.push(`${name}: unknown npm script ${script}`);
    for (const [, file = ""] of skill.body.matchAll(REPO_FILE))
      if (!existsSync(path.join(root, file))) problems.push(`${name}: missing ${file}`);
  }
  return problems;
}

if (import.meta.main) {
  const problems = checkSkills(path.resolve(import.meta.dirname, ".."));
  for (const problem of problems) console.error(`check-skills: ${problem}`);
  if (problems.length) process.exit(1);
  console.log("check-skills: catalog valid");
}
