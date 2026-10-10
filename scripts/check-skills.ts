// Validates agent skills: canonical procedures in .agents/skills (Codex) and thin adapters in
// .claude/skills (Claude Code) that point to them. Frontmatter is name + description only, so it
// is parsed without a YAML dependency. Usage: `node scripts/check-skills.ts` (exit 1 on problems).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Parsed = { meta: Record<string, string>; body: string };

const SECRET =
  /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|EAA[A-Za-z0-9]{20,})/;
const PRIVATE_PATH = /\/home\/|\/Users\/|[A-Z]:\\/;
const REPO_FILE = /`((?:scripts|tests|docs|config|src)\/[\w./-]+\.(?:ts|tsx|md|json))`/g;

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
  const canonical = list(path.join(root, ".agents/skills"));
  const adapters = list(path.join(root, ".claude/skills"));
  if (!canonical.length) problems.push("no skills in .agents/skills");
  if (JSON.stringify(canonical) !== JSON.stringify(adapters))
    problems.push("skill catalogs differ between .agents/skills and .claude/skills");
  const claude = path.join(root, "CLAUDE.md");
  if (!existsSync(claude) || readFileSync(claude, "utf8") !== "@AGENTS.md\n")
    problems.push("CLAUDE.md must be exactly @AGENTS.md");
  const descriptions = new Map<string, string>();

  for (const name of canonical) {
    const source = path.join(root, ".agents/skills", name, "SKILL.md");
    const adapterFile = path.join(root, ".claude/skills", name, "SKILL.md");
    if (!existsSync(source) || !existsSync(adapterFile)) {
      problems.push(`${name}: SKILL.md missing in .agents or .claude`);
      continue;
    }
    const skill = parse(source, problems);
    const adapter = parse(adapterFile, problems);
    if (!skill || !adapter) continue;
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
    if (JSON.stringify(adapter.meta) !== JSON.stringify(skill.meta))
      problems.push(`${name}: adapter frontmatter drifted from the canonical skill`);
    if (
      !adapter.body.includes(`.agents/skills/${name}/SKILL.md`) ||
      adapter.body.trim().split("\n").length > 3
    )
      problems.push(`${name}: adapter must be a thin pointer to .agents/skills/${name}/SKILL.md`);
    if (!/^## Limits$/m.test(skill.body)) problems.push(`${name}: missing "## Limits" section`);
    if (/\b(TODO|FIXME|TBD)\b/.test(skill.body)) problems.push(`${name}: placeholder text`);
    if (PRIVATE_PATH.test(skill.body)) problems.push(`${name}: absolute private path`);
    if (SECRET.test(skill.body) || SECRET.test(adapter.body)) problems.push(`${name}: secret-like token`);
    for (const [, target = ""] of skill.body.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      if (!existsSync(path.resolve(path.dirname(source), target.split("#")[0] ?? "")))
        problems.push(`${name}: broken link ${target}`);
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
