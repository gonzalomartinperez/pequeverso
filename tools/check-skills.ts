// Validates agent skills: canonical procedures in .agents/skills (Codex) and relative directory
// symlinks in .claude/skills (Claude Code) that point to them. Frontmatter is a small YAML subset
// (name, description, allowed-tools and a one-level `metadata` block), parsed without a YAML
// dependency. Each skill also carries deterministic eval banks (evals/triggers.json and
// evals/evals.json, the engineering-standards harness schema, OD-79: no model calls here); the
// model-run activation scoring is a local procedure (docs/development.md).
// Usage: `node tools/check-skills.ts` (exit 1 on problems, warnings on stale reviews).

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

type Parsed = { meta: Record<string, string>; metadata: Record<string, string>; body: string };

const MAX_BODY_LINES = 120;
const STALE_DAYS = 180;
const ALLOWED_KEYS = ["name", "description", "allowed-tools", "metadata"];
/** Parses a frontmatter scalar: double-quoted values must be valid JSON strings, plain ones must not hide ": " or " #". */
const scalar = (value: string, where: string, problems: string[]): string => {
  if (value.startsWith('"')) {
    try {
      return String(JSON.parse(value));
    } catch {
      problems.push(`${where}: malformed quoted value ${value.slice(0, 30)}`);
      return value;
    }
  }
  if (/: | #/.test(value)) problems.push(`${where}: quote values that contain ": " or " #"`);
  return value;
};

const isRealDate = (value: string): boolean => {
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
};

const SECRET =
  /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|EAA[A-Za-z0-9]{20,})/;
const PRIVATE_PATH = /\/home\/|\/Users\/|[A-Z]:\\/;
const REPO_FILE =
  /`((?:tools|tests|docs|config|src|ratchets|content|\.github|\.agents)\/[\w./-]+\.(?:ts|tsx|md|json|ya?ml|mjs))`/g;
const NODE_FILE = /`node ((?:tools|tests|scripts)\/[\w./-]+)[^`]*`/g;

function parse(file: string, problems: string[]): Parsed | undefined {
  const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    problems.push(`${file}: missing frontmatter`);
    return undefined;
  }
  const meta: Record<string, string> = {};
  const metadata: Record<string, string> = {};
  let block = "";
  for (const line of (match[1] ?? "").split("\n")) {
    const nested = line.match(/^ {2}([a-z-]+): (.+)$/);
    if (nested?.[1] && nested[2] && block === "metadata") {
      if (Object.hasOwn(metadata, nested[1]))
        problems.push(`${file}: duplicate metadata field ${nested[1]}`);
      else metadata[nested[1]] = scalar(nested[2], `${file}: metadata ${nested[1]}`, problems);
      continue;
    }
    block = "";
    const field = line.match(/^([a-z-]+):(?: (.+))?$/);
    if (!field?.[1]) problems.push(`${file}: unsupported frontmatter line "${line}"`);
    else if (Object.hasOwn(meta, field[1]))
      problems.push(`${file}: duplicate frontmatter field ${field[1]}`);
    else if (field[2]) {
      if (field[1] === "description" && !field[2].startsWith('"'))
        problems.push(`${file}: description must be double-quoted`);
      meta[field[1]] = scalar(field[2], `${file}: ${field[1]}`, problems);
    } else if (field[1] === "metadata") {
      meta.metadata = "";
      block = "metadata";
    } else problems.push(`${file}: unsupported frontmatter line "${line}"`);
  }
  return { meta, metadata, body: match[2] ?? "" };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readJson(
  file: string,
  label: string,
  problems: string[],
): Record<string, unknown> | undefined {
  if (!existsSync(file)) {
    problems.push(`${label}: missing`);
    return undefined;
  }
  try {
    const data: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (isRecord(data)) return data;
  } catch {
    // reported below
  }
  problems.push(`${label}: must be a JSON object`);
  return undefined;
}

/** Validates evals/triggers.json (activation bank) and evals/evals.json (output evals) of a skill. */
function checkEvals(dir: string, name: string, problems: string[]): void {
  const bank = readJson(
    path.join(dir, "evals/triggers.json"),
    `${name}: evals/triggers.json`,
    problems,
  );
  if (bank) {
    const label = `${name}: evals/triggers.json`;
    if (bank.skill !== name) problems.push(`${label}: skill must be "${name}"`);
    if (bank.runs_per_query !== 3) problems.push(`${label}: runs_per_query must be 3`);
    const queries = Array.isArray(bank.queries) ? bank.queries : [];
    const seen = new Set<string>();
    const count = { positive: 0, negative: 0, validation: 0, validationPositive: 0 };
    for (const entry of queries) {
      const q = isRecord(entry) ? entry : {};
      const text = typeof q.query === "string" ? q.query.trim() : "";
      if (
        !text ||
        typeof q.should_trigger !== "boolean" ||
        (q.split !== "train" && q.split !== "validation")
      ) {
        problems.push(
          `${label}: each query needs query, boolean should_trigger and split train|validation`,
        );
        continue;
      }
      if (seen.has(text.toLowerCase())) problems.push(`${label}: duplicate query "${text}"`);
      seen.add(text.toLowerCase());
      count[q.should_trigger ? "positive" : "negative"] += 1;
      if (q.split === "validation") {
        count.validation += 1;
        if (q.should_trigger) count.validationPositive += 1;
      }
    }
    if (count.positive < 8 || count.positive > 10)
      problems.push(`${label}: needs 8-10 positive queries, found ${count.positive}`);
    if (count.negative < 8 || count.negative > 10)
      problems.push(`${label}: needs 8-10 near-miss negative queries, found ${count.negative}`);
    const total = count.positive + count.negative;
    if (count.validation !== Math.round(0.4 * total))
      problems.push(
        `${label}: split must be 60/40 train/validation, found ${count.validation}/${total} validation`,
      );
    if (count.validationPositive < 2 || count.validation - count.validationPositive < 2)
      problems.push(`${label}: validation needs at least 2 positive and 2 negative queries`);
  }
  const outputs = readJson(
    path.join(dir, "evals/evals.json"),
    `${name}: evals/evals.json`,
    problems,
  );
  if (outputs) {
    const label = `${name}: evals/evals.json`;
    if (outputs.skill !== name) problems.push(`${label}: skill must be "${name}"`);
    if (typeof outputs.compare !== "string" || !outputs.compare)
      problems.push(`${label}: compare is required`);
    const evals = Array.isArray(outputs.evals) ? outputs.evals : [];
    if (evals.length < 2 || evals.length > 3)
      problems.push(`${label}: needs 2-3 output evals, found ${evals.length}`);
    const ids = new Set<string>();
    for (const entry of evals) {
      const item = isRecord(entry) ? entry : {};
      const id = typeof item.id === "string" ? item.id : "";
      const assertions = Array.isArray(item.assertions) ? item.assertions : [];
      if (!id || ids.has(id)) problems.push(`${label}: each eval needs a unique id`);
      ids.add(id);
      if (typeof item.prompt !== "string" || !item.prompt.trim())
        problems.push(`${label}: eval ${id} needs a prompt`);
      if (assertions.length < 2 || assertions.some((a) => typeof a !== "string" || !a.trim()))
        problems.push(`${label}: eval ${id} needs at least 2 non-empty assertions`);
    }
  }
}

const list = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);

/** Every problem found in the skill catalogs under `root`; empty when the catalog is valid. */
export function checkSkills(root: string, warnings: string[] = [], now = new Date()): string[] {
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
    const keys = Object.keys(skill.meta);
    if (
      !["name", "description", "metadata"].every((key) => keys.includes(key)) ||
      keys.some((key) => !ALLOWED_KEYS.includes(key))
    )
      problems.push(
        `${name}: frontmatter must contain name, description, metadata (and optionally allowed-tools)`,
      );
    const { owner, version } = skill.metadata;
    const reviewed = skill.metadata["last-reviewed"] ?? "";
    if (
      !owner ||
      !version ||
      !/^\d{4}-\d{2}-\d{2}$/.test(reviewed) ||
      !/^\d+\.\d+\.\d+$/.test(version)
    )
      problems.push(
        `${name}: metadata needs owner, last-reviewed (YYYY-MM-DD) and version (x.y.z)`,
      );
    else if (!isRealDate(reviewed) || Date.parse(reviewed) > now.getTime())
      problems.push(`${name}: last-reviewed ${reviewed} must be a real date, not in the future`);
    else if (now.getTime() - Date.parse(reviewed) > STALE_DAYS * 86_400_000)
      warnings.push(`${name}: last-reviewed ${reviewed} is older than ${STALE_DAYS} days`);
    if (skill.body.replace(/\n+$/, "").split("\n").length > MAX_BODY_LINES)
      problems.push(`${name}: body must be at most ${MAX_BODY_LINES} lines`);
    if (skill.meta.name !== name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))
      problems.push(`${name}: name must match its folder (kebab-case)`);
    if (description.length < 40 || description.length > 1024)
      problems.push(`${name}: description must be 40-1024 characters`);
    if (!description.startsWith("Use when"))
      problems.push(`${name}: description must start with "Use when"`);
    if (!/\bNot for\b/.test(description))
      problems.push(`${name}: description must state what the skill is not for`);
    checkEvals(path.dirname(source), name, problems);
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
    for (const [, file = ""] of skill.body.matchAll(NODE_FILE))
      if (!existsSync(path.join(root, file))) problems.push(`${name}: missing ${file}`);
  }
  return problems;
}

if (import.meta.main) {
  const warnings: string[] = [];
  const problems = checkSkills(path.resolve(import.meta.dirname, ".."), warnings);
  for (const warning of warnings) console.warn(`check-skills: warning: ${warning}`);
  for (const problem of problems) console.error(`check-skills: ${problem}`);
  if (problems.length) process.exit(1);
  console.log("check-skills: catalog valid");
}
