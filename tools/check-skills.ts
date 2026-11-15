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

type FrontmatterState = {
  meta: Record<string, string>;
  metadata: Record<string, string>;
  block: string;
};

/** Handles a two-space indented `metadata` child line; false when the line is not one. */
function parseNested(
  line: string,
  state: FrontmatterState,
  file: string,
  problems: string[],
): boolean {
  const nested = line.match(/^ {2}([a-z-]+): (.+)$/);
  const key = nested?.[1];
  const value = nested?.[2];
  if (!key || !value || state.block !== "metadata") return false;
  if (Object.hasOwn(state.metadata, key)) problems.push(`${file}: duplicate metadata field ${key}`);
  else state.metadata[key] = scalar(value, `${file}: metadata ${key}`, problems);
  return true;
}

/** Handles a top-level frontmatter line (and resets the nested block). */
function parseTopLevel(
  line: string,
  state: FrontmatterState,
  file: string,
  problems: string[],
): void {
  state.block = "";
  const field = line.match(/^([a-z-]+):(?: (.+))?$/);
  const key = field?.[1];
  if (!key) {
    problems.push(`${file}: unsupported frontmatter line "${line}"`);
    return;
  }
  if (Object.hasOwn(state.meta, key)) {
    problems.push(`${file}: duplicate frontmatter field ${key}`);
    return;
  }
  const value = field?.[2];
  if (value) {
    if (key === "description" && !value.startsWith('"'))
      problems.push(`${file}: description must be double-quoted`);
    state.meta[key] = scalar(value, `${file}: ${key}`, problems);
  } else if (key === "metadata") {
    state.meta.metadata = "";
    state.block = "metadata";
  } else problems.push(`${file}: unsupported frontmatter line "${line}"`);
}

function parse(file: string, problems: string[]): Parsed | undefined {
  const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    problems.push(`${file}: missing frontmatter`);
    return undefined;
  }
  const state: FrontmatterState = { meta: {}, metadata: {}, block: "" };
  for (const line of (match[1] ?? "").split("\n"))
    if (!parseNested(line, state, file, problems)) parseTopLevel(line, state, file, problems);
  return { meta: state.meta, metadata: state.metadata, body: match[2] ?? "" };
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

type QueryCount = {
  positive: number;
  negative: number;
  validation: number;
  validationPositive: number;
};
type Query = { text: string; shouldTrigger: boolean; validation: boolean };

/** A well-formed trigger query, or undefined when it lacks query, should_trigger or split. */
function toQuery(entry: unknown): Query | undefined {
  const q = isRecord(entry) ? entry : {};
  const text = typeof q.query === "string" ? q.query.trim() : "";
  const validSplit = q.split === "train" || q.split === "validation";
  if (!text || typeof q.should_trigger !== "boolean" || !validSplit) return undefined;
  return { text, shouldTrigger: q.should_trigger, validation: q.split === "validation" };
}

function addToCount(count: QueryCount, query: Query): void {
  count[query.shouldTrigger ? "positive" : "negative"] += 1;
  if (!query.validation) return;
  count.validation += 1;
  if (query.shouldTrigger) count.validationPositive += 1;
}

function tallyQueries(queries: unknown[], label: string, problems: string[]): QueryCount {
  const seen = new Set<string>();
  const count: QueryCount = { positive: 0, negative: 0, validation: 0, validationPositive: 0 };
  for (const entry of queries) {
    const query = toQuery(entry);
    if (!query) {
      problems.push(
        `${label}: each query needs query, boolean should_trigger and split train|validation`,
      );
      continue;
    }
    if (seen.has(query.text.toLowerCase()))
      problems.push(`${label}: duplicate query "${query.text}"`);
    seen.add(query.text.toLowerCase());
    addToCount(count, query);
  }
  return count;
}

function checkQueryCounts(count: QueryCount, label: string, problems: string[]): void {
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

function checkTriggers(
  bank: Record<string, unknown>,
  name: string,
  label: string,
  problems: string[],
): void {
  if (bank.skill !== name) problems.push(`${label}: skill must be "${name}"`);
  if (bank.runs_per_query !== 3) problems.push(`${label}: runs_per_query must be 3`);
  const queries = Array.isArray(bank.queries) ? bank.queries : [];
  checkQueryCounts(tallyQueries(queries, label, problems), label, problems);
}

function checkOutputEval(
  entry: unknown,
  ids: Set<string>,
  label: string,
  problems: string[],
): void {
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

function checkOutputs(
  outputs: Record<string, unknown>,
  name: string,
  label: string,
  problems: string[],
): void {
  if (outputs.skill !== name) problems.push(`${label}: skill must be "${name}"`);
  if (typeof outputs.compare !== "string" || !outputs.compare)
    problems.push(`${label}: compare is required`);
  const evals = Array.isArray(outputs.evals) ? outputs.evals : [];
  if (evals.length < 2 || evals.length > 3)
    problems.push(`${label}: needs 2-3 output evals, found ${evals.length}`);
  const ids = new Set<string>();
  for (const entry of evals) checkOutputEval(entry, ids, label, problems);
}

/** Validates evals/triggers.json (activation bank) and evals/evals.json (output evals) of a skill. */
function checkEvals(dir: string, name: string, problems: string[]): void {
  const triggersLabel = `${name}: evals/triggers.json`;
  const bank = readJson(path.join(dir, "evals/triggers.json"), triggersLabel, problems);
  if (bank) checkTriggers(bank, name, triggersLabel, problems);
  const outputsLabel = `${name}: evals/evals.json`;
  const outputs = readJson(path.join(dir, "evals/evals.json"), outputsLabel, problems);
  if (outputs) checkOutputs(outputs, name, outputsLabel, problems);
}

const list = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);

const LINK_PREFIX = "../../.agents/skills/";
const CATALOGS = [".agents/skills", ".claude/skills"];

type Context = {
  root: string;
  rootPath: string;
  scripts: Record<string, string>;
  problems: string[];
  warnings: string[];
  now: Date;
};

const isRealDirectory = (directory: string): boolean =>
  existsSync(directory) &&
  lstatSync(directory).isDirectory() &&
  !lstatSync(directory).isSymbolicLink();

const isInside = (root: string, resolved: string): boolean =>
  resolved === root || resolved.startsWith(`${root}${path.sep}`);

const confined = (ctx: Context, file: string): boolean => {
  try {
    return isInside(ctx.rootPath, realpathSync(file));
  } catch {
    return false;
  }
};

/** Repo skills are the real (non-symlink) directories of .agents/skills. Entries that are symlinks
 * there, or symlinks in .claude/skills with other names, are machine-local external skills
 * (locally excluded from git): they are never validated and never make the check fail. */
function canonicalSkills(root: string): string[] {
  return list(path.join(root, ".agents/skills")).filter((name) => {
    const entry = path.join(root, ".agents/skills", name);
    return !lstatSync(entry).isSymbolicLink() && lstatSync(entry).isDirectory();
  });
}

function checkTrackedLine(line: string, ctx: Context, canonical: string[]): void {
  const [info = "", file = ""] = line.split("\t");
  const mode = info.split(" ")[0];
  const parts = file.split("/");
  const name = parts[2] ?? "";
  if (parts[0] === ".agents") {
    if (mode === "120000" || parts.length < 4 || !canonical.includes(name))
      ctx.problems.push(
        `${file}: tracked entry in .agents/skills must be a file inside a real skill directory`,
      );
    return;
  }
  if (parts.length !== 3 || mode !== "120000") {
    ctx.problems.push(`${file}: tracked entry in .claude/skills must be a single symlink`);
    return;
  }
  if (
    readlinkSync(path.join(ctx.root, file)) !== `${LINK_PREFIX}${name}` ||
    !canonical.includes(name)
  )
    ctx.problems.push(`${file}: tracked link must target ${LINK_PREFIX}<canonical skill name>`);
}

/** Fail closed for tracked entries: when the root is a git checkout, nothing tracked under the
 * catalogs may be an external or unexpected link; only untracked entries are ignored. */
function checkTracked(ctx: Context, canonical: string[]): void {
  if (!existsSync(path.join(ctx.root, ".git"))) return;
  const tracked = execFileSync(
    "git",
    ["-C", ctx.root, "ls-files", "-s", "--", ".claude/skills", ".agents/skills"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);
  for (const line of tracked) checkTrackedLine(line, ctx, canonical);
}

/** The first problem with a link in .claude/skills for a canonical skill, if any. */
function canonicalLinkProblem(entry: string, name: string, rootReal: string): string | undefined {
  const expected = `${LINK_PREFIX}${name}`;
  if (!lstatSync(entry).isSymbolicLink())
    return `${name}: .claude/skills entry must be a symlink to ${expected}`;
  const link = readlinkSync(entry);
  if (link !== expected)
    return `${name}: .claude/skills link must be exactly ${expected}, found ${link}`;
  if (!existsSync(entry)) return `${name}: .claude/skills link is broken`;
  if (!realpathSync(entry).startsWith(`${rootReal}${path.sep}`))
    return `${name}: .claude/skills link resolves outside the repository`;
  return undefined;
}

function checkClaudeEntry(ctx: Context, name: string, canonical: string[]): void {
  const entry = path.join(ctx.root, ".claude/skills", name);
  if (canonical.includes(name)) {
    const problem = canonicalLinkProblem(entry, name, ctx.rootPath);
    if (problem) ctx.problems.push(problem);
    return;
  }
  if (!lstatSync(entry).isSymbolicLink())
    ctx.problems.push(`${name}: .claude/skills entry has no canonical .agents/skills/${name}`);
  else if (readlinkSync(entry).startsWith(LINK_PREFIX))
    ctx.problems.push(`${name}: .claude/skills link targets a missing canonical skill`);
}

function checkClaudeLinks(ctx: Context, canonical: string[]): void {
  const linked = list(path.join(ctx.root, ".claude/skills"));
  for (const name of linked) checkClaudeEntry(ctx, name, canonical);
  for (const name of canonical)
    if (!list(path.join(ctx.root, ".claude/skills")).includes(name))
      ctx.problems.push(`${name}: missing .claude/skills symlink`);
}

function checkClaudeMd(ctx: Context): void {
  const claude = path.join(ctx.root, "CLAUDE.md");
  if (!existsSync(claude) || readFileSync(claude, "utf8") !== "@AGENTS.md\n")
    ctx.problems.push("CLAUDE.md must be exactly @AGENTS.md");
}

function checkResources(ctx: Context, directory: string, name: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (!confined(ctx, file))
      ctx.problems.push(`${name}: broken or outside repository skill resource ${entry.name}`);
    else if (entry.isDirectory() && !entry.isSymbolicLink()) checkResources(ctx, file, name);
  }
}

const isRegularSkillFile = (ctx: Context, source: string): boolean =>
  existsSync(source) &&
  confined(ctx, source) &&
  !lstatSync(source).isSymbolicLink() &&
  lstatSync(source).isFile();

function checkFrontmatterKeys(name: string, skill: Parsed, problems: string[]): void {
  const keys = Object.keys(skill.meta);
  if (
    !["name", "description", "metadata"].every((key) => keys.includes(key)) ||
    keys.some((key) => !ALLOWED_KEYS.includes(key))
  )
    problems.push(
      `${name}: frontmatter must contain name, description, metadata (and optionally allowed-tools)`,
    );
}

function checkMetadata(ctx: Context, name: string, skill: Parsed): void {
  const { owner, version } = skill.metadata;
  const reviewed = skill.metadata["last-reviewed"] ?? "";
  const age = ctx.now.getTime() - Date.parse(reviewed);
  if (
    !owner ||
    !version ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reviewed) ||
    !/^\d+\.\d+\.\d+$/.test(version)
  )
    ctx.problems.push(
      `${name}: metadata needs owner, last-reviewed (YYYY-MM-DD) and version (x.y.z)`,
    );
  else if (!isRealDate(reviewed) || Date.parse(reviewed) > ctx.now.getTime())
    ctx.problems.push(`${name}: last-reviewed ${reviewed} must be a real date, not in the future`);
  else if (age > STALE_DAYS * 86_400_000)
    ctx.warnings.push(`${name}: last-reviewed ${reviewed} is older than ${STALE_DAYS} days`);
}

function checkSize(name: string, skill: Parsed, problems: string[]): void {
  if (skill.body.replace(/\n+$/, "").split("\n").length > MAX_BODY_LINES)
    problems.push(`${name}: body must be at most ${MAX_BODY_LINES} lines`);
  if (skill.meta.name !== name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))
    problems.push(`${name}: name must match its folder (kebab-case)`);
}

function checkDescription(name: string, description: string, problems: string[]): void {
  if (description.length < 40 || description.length > 1024)
    problems.push(`${name}: description must be 40-1024 characters`);
  if (!description.startsWith("Use when"))
    problems.push(`${name}: description must start with "Use when"`);
  if (!/\bNot for\b/.test(description))
    problems.push(`${name}: description must state what the skill is not for`);
}

function checkBodyText(name: string, body: string, problems: string[]): void {
  if (!/^## Limits$/m.test(body)) problems.push(`${name}: missing "## Limits" section`);
  if (/\b(TODO|FIXME|TBD)\b/.test(body)) problems.push(`${name}: placeholder text`);
  if (PRIVATE_PATH.test(body)) problems.push(`${name}: absolute private path`);
  if (SECRET.test(body)) problems.push(`${name}: secret-like token`);
}

function checkLinkTarget(ctx: Context, name: string, source: string, target: string): void {
  if (/^(https?:|mailto:|#)/.test(target)) return;
  const destination = path.resolve(path.dirname(source), target.split("#")[0] ?? "");
  if (!isInside(ctx.rootPath, destination))
    ctx.problems.push(`${name}: reference outside repository ${target}`);
  else if (!existsSync(destination)) ctx.problems.push(`${name}: broken link ${target}`);
  else if (!confined(ctx, destination))
    ctx.problems.push(`${name}: reference outside repository ${target}`);
}

function checkReferences(ctx: Context, name: string, source: string, body: string): void {
  for (const [, target = ""] of body.matchAll(/\]\(([^)\s]+)\)/g))
    checkLinkTarget(ctx, name, source, target);
  for (const [, script = ""] of body.matchAll(/npm run ([a-z0-9:-]+)/g))
    if (!ctx.scripts[script]) ctx.problems.push(`${name}: unknown npm script ${script}`);
  for (const pattern of [REPO_FILE, NODE_FILE])
    for (const [, file = ""] of body.matchAll(pattern))
      if (!existsSync(path.join(ctx.root, file))) ctx.problems.push(`${name}: missing ${file}`);
}

function checkSkill(ctx: Context, name: string, descriptions: Map<string, string>): void {
  const source = path.join(ctx.root, ".agents/skills", name, "SKILL.md");
  if (!isRegularSkillFile(ctx, source)) {
    ctx.problems.push(`${name}: canonical entry must be a regular SKILL.md file`);
    return;
  }
  checkResources(ctx, path.dirname(source), name);
  const skill = parse(source, ctx.problems);
  if (!skill) return;
  const description = skill.meta.description ?? "";
  checkFrontmatterKeys(name, skill, ctx.problems);
  checkMetadata(ctx, name, skill);
  checkSize(name, skill, ctx.problems);
  checkDescription(name, description, ctx.problems);
  checkEvals(path.dirname(source), name, ctx.problems);
  const twin = descriptions.get(description);
  if (twin) ctx.problems.push(`${name}: same description as ${twin}`);
  descriptions.set(description, name);
  checkBodyText(name, skill.body, ctx.problems);
  checkReferences(ctx, name, source, skill.body);
}

/** Every problem found in the skill catalogs under `root`; empty when the catalog is valid. */
export function checkSkills(root: string, warnings: string[] = [], now = new Date()): string[] {
  const problems: string[] = [];
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const ctx: Context = {
    root,
    rootPath: realpathSync(root),
    scripts: pkg.scripts ?? {},
    problems,
    warnings,
    now,
  };
  for (const catalog of CATALOGS) {
    if (!isRealDirectory(path.join(root, catalog))) {
      problems.push(`${catalog}: skill catalog must be a real directory`);
      return problems;
    }
  }
  const canonical = canonicalSkills(root);
  if (!canonical.length) problems.push("no skills in .agents/skills");
  checkTracked(ctx, canonical);
  checkClaudeLinks(ctx, canonical);
  checkClaudeMd(ctx);
  const descriptions = new Map<string, string>();
  for (const name of canonical) checkSkill(ctx, name, descriptions);
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
