/**
 * Assembles the deployable standalone tree, minus node_modules, into a NEW directory:
 *
 *   NEXT_OUTPUT=standalone npm run build && node tools/ci/assemble-site.ts [site]
 *
 * `site/` is what Hostinger's Node.js Web App serves after its own build: the standalone
 * `server.js`, `package.json`, `.next/` and `media/`, plus `.next/static` and `public/` (which
 * `next build` does not copy into `.next/standalone`). Nothing is trusted by default: only an
 * allowlist of standalone top-level entries is copied, only regular files and directories, and
 * the copy plan is validated from metadata before the target directory is created. If copying
 * itself fails, the partial target is removed so it can never be mistaken for a built site. `tools/ci/artifacts.ts` is the
 * transfer between jobs; this tool only builds the tree it verifies (ADR-0010).
 */

import {
  constants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type Kind = "file" | "dir" | "symlink" | "other";
export type Entry = { name: string; kind: Kind };
/** A validated copy plan: directories first (parents before children), then files. */
export type Plan = { dirs: string[]; files: { from: string; to: string }[] };

/** Standalone top-level entries that may be copied, and the kind each must have. */
export const standaloneAllowlist: Readonly<Record<string, Kind>> = {
  "server.js": "file",
  "package.json": "file",
  ".next": "dir",
  media: "dir",
};
export const standaloneRequired: readonly string[] = ["server.js", "package.json", ".next"];

/** `node_modules` is never copied (a directory or a symlink to another install). */
const skipped = "node_modules";

export function kindOf(stat: {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}): Kind {
  if (stat.isSymbolicLink()) return "symlink";
  if (stat.isDirectory()) return "dir";
  return stat.isFile() ? "file" : "other";
}

/** Top-level entries of `.next/standalone` to copy; anything outside the allowlist fails closed. */
export function selectStandaloneEntries(entries: readonly Entry[]): string[] {
  const selected: string[] = [];
  for (const { name, kind } of entries) {
    if (name === skipped) continue;
    if (!Object.hasOwn(standaloneAllowlist, name)) {
      throw new Error(`unexpected entry in .next/standalone: ${name}`);
    }
    if (kind !== standaloneAllowlist[name]) {
      throw new Error(`${name} in .next/standalone must be a regular ${standaloneAllowlist[name]}`);
    }
    selected.push(name);
  }
  const missing = standaloneRequired.filter((name) => !selected.includes(name));
  if (missing.length) throw new Error(`.next/standalone is missing: ${missing.join(", ")}`);
  return selected;
}

/** `public/build-info.json` must record a standalone build (not the static export). */
export function requireStandaloneBuildInfo(text: string): void {
  let output: unknown;
  try {
    output = (JSON.parse(text) as { output?: unknown } | null)?.output;
  } catch {
    throw new Error("public/build-info.json is not valid JSON");
  }
  if (output !== "standalone") {
    throw new Error('public/build-info.json must have "output": "standalone"');
  }
}

function list(directory: string): Entry[] {
  return readdirSync(directory, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    kind: kindOf(entry),
  }));
}

/** Adds `from` (a regular directory tree) to the plan as `to`; a symlink anywhere fails. */
export function planTree(from: string, to: string, plan: Plan): void {
  plan.dirs.push(to);
  for (const { name, kind } of list(from).sort((a, b) => a.name.localeCompare(b.name))) {
    const source = join(from, name);
    const target = join(to, name);
    if (kind === "dir") planTree(source, target, plan);
    else if (kind === "file") plan.files.push({ from: source, to: target });
    else throw new Error(`only regular files and directories may be copied: ${source} (${kind})`);
  }
}

function requireDirectory(path: string, label: string): void {
  if (kindOf(lstatSync(path)) !== "dir") throw new Error(`${label} must be a regular directory`);
}

/** Validates the build outputs under `root` and returns the copy plan into `site`. */
export function planSite(root: string, site: string): Plan {
  const standalone = join(root, ".next/standalone");
  requireDirectory(standalone, ".next/standalone");
  requireDirectory(join(root, ".next/static"), ".next/static");
  requireDirectory(join(root, "public"), "public");
  requireStandaloneBuildInfo(readFileSync(join(root, "public/build-info.json"), "utf8"));
  const plan: Plan = { dirs: [], files: [] };
  for (const name of selectStandaloneEntries(list(standalone))) {
    const source = join(standalone, name);
    if (standaloneAllowlist[name] === "dir") planTree(source, join(site, name), plan);
    else plan.files.push({ from: source, to: join(site, name) });
  }
  if (plan.dirs.includes(join(site, ".next/static"))) {
    throw new Error(".next/standalone already contains .next/static");
  }
  planTree(join(root, ".next/static"), join(site, ".next/static"), plan);
  planTree(join(root, "public"), join(site, "public"), plan);
  return plan;
}

/** True when anything (even a dangling symlink) occupies `path`. */
function occupied(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

/** Creates `site` (which must not exist) from the standalone build under `root`. */
export function assembleSite(root: string, site: string): number {
  if (occupied(site)) throw new Error(`${site} already exists; remove it first`);
  const plan = planSite(root, site);
  mkdirSync(site, { recursive: true });
  try {
    for (const directory of plan.dirs) mkdirSync(directory, { recursive: true });
    for (const { from, to } of plan.files) copyFileSync(from, to, constants.COPYFILE_EXCL);
  } catch (error) {
    rmSync(site, { recursive: true, force: true });
    throw error;
  }
  return plan.files.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const site = resolve(root, process.argv[2] || "site");
  try {
    const count = assembleSite(root, site);
    console.log(
      `assemble-site: ${count} files into ${process.argv[2] || "site"}/ (no node_modules)`,
    );
  } catch (error) {
    console.error(`assemble-site: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
