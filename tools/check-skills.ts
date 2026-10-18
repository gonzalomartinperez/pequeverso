// Validates agent skills: canonical procedures in .agents/skills (Codex) and thin adapters in
// .claude/skills (Claude Code) that point to them. Frontmatter is name + description only, so it
// is parsed without a YAML dependency. Usage: `node tools/check-skills.ts` (exit 1 on problems).
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
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
    else if (Object.hasOwn(meta, field[1])) problems.push(`${file}: duplicate frontmatter field ${field[1]}`);
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
  const canonical = list(path.join(root, ".agents/skills"));
  const adapters = list(path.join(root, ".claude/skills"));
  if (!canonical.length) problems.push("no skills in .agents/skills");
  if (JSON.stringify(canonical) !== JSON.stringify(adapters))
    problems.push("skill catalogs differ between .agents/skills and .claude/skills");
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
    const adapterFile = path.join(root, ".claude/skills", name, "SKILL.md");
    let regular = true;
    for (const file of [source, adapterFile]) {
      const folder = path.dirname(file);
      if (
        !existsSync(file) ||
        !confined(file) ||
        lstatSync(file).isSymbolicLink() ||
        !lstatSync(file).isFile() ||
        lstatSync(folder).isSymbolicLink() ||
        !lstatSync(folder).isDirectory()
      ) {
        problems.push(
          `${name}: canonical and adapter entries must be regular files in real skill directories`,
        );
        regular = false;
      }
    }
    if (!regular) continue;
    resources(path.dirname(source), name);
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
    const pointer = `This adapter points to the canonical skill. Read and follow \`.agents/skills/${name}/SKILL.md\`.`;
    if (adapter.body.trim() !== pointer)
      problems.push(`${name}: adapter must contain only the canonical skill reference`);
    if (!/^## Limits$/m.test(skill.body)) problems.push(`${name}: missing "## Limits" section`);
    if (/\b(TODO|FIXME|TBD)\b/.test(skill.body)) problems.push(`${name}: placeholder text`);
    if (PRIVATE_PATH.test(skill.body)) problems.push(`${name}: absolute private path`);
    if (SECRET.test(skill.body) || SECRET.test(adapter.body)) problems.push(`${name}: secret-like token`);
    for (const [, target = ""] of skill.body.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const destination = path.resolve(path.dirname(source), target.split("#")[0] ?? "");
      if (destination !== rootPath && !destination.startsWith(`${rootPath}${path.sep}`))
        problems.push(`${name}: reference outside repository ${target}`);
      else if (!existsSync(destination)) problems.push(`${name}: broken link ${target}`);
      else if (!confined(destination)) problems.push(`${name}: reference outside repository ${target}`);
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
