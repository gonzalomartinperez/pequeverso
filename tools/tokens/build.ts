/**
 * Design-token build (ADR-0012): reads the DTCG source `design/tokens/pequeverso.tokens.json` and
 * writes `src/shared/tokens/theme.css`. Style Dictionary was deferred (ADR-0012), so this is the
 * whole pipeline: `node tools/tokens/build.ts`. The unit test regenerates in memory and fails when
 * the committed file is stale.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SOURCE = "design/tokens/pequeverso.tokens.json";
export const OUTPUT = "src/shared/tokens/theme.css";
const SEMANTIC_GROUP = "color.semantic";
const EXTENSION = "com.pequeverso";

export interface Token {
  $value: string;
  $type?: string;
  $description?: string;
  $extensions?: Record<string, { dark?: string } | undefined>;
}
export interface TokenGroup {
  [key: string]: Token | TokenGroup | string | Record<string, unknown> | undefined;
}
export interface ResolvedToken {
  path: string;
  name: string;
  token: Token;
}

const isToken = (node: unknown): node is Token =>
  typeof node === "object" && node !== null && "$value" in node;

/** Every token in source order; keys starting with `$` are metadata, not groups. */
export function collectTokens(group: TokenGroup, prefix: string[] = []): ResolvedToken[] {
  const found: ResolvedToken[] = [];
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith("$") || typeof node !== "object" || node === null) continue;
    const path = [...prefix, key];
    if (isToken(node)) found.push({ path: path.join("."), name: key, token: node });
    else found.push(...collectTokens(node as TokenGroup, path));
  }
  return found;
}

/** `{color.neutral.pv-cream}` becomes `var(--pv-cream)`; an unknown reference throws. */
export function resolveReferences(value: string, names: ReadonlyMap<string, string>): string {
  return value.replace(REFERENCE, (_match, path: string) => {
    const name = names.get(path);
    if (name === undefined) throw new Error(`Unknown token reference {${path}}`);
    return `var(--${name})`;
  });
}

const REFERENCE = /\{([\w.-]+)\}/g;
const referencesOf = (value: string): string[] =>
  [...value.matchAll(REFERENCE)].map((m) => m[1] ?? "");
const darkOf = (token: Token): string | undefined => token.$extensions?.[EXTENSION]?.dark;

/** Shape checks and cycle detection (DFS over light and dark reference edges). */
export function validateTokens(tokens: readonly ResolvedToken[]): void {
  const byPath = new Map(tokens.map((entry) => [entry.path, entry]));
  const edges = new Map<string, string[]>();
  for (const { path, token } of tokens) {
    if (typeof token.$value !== "string") throw new Error(`${path}: $value must be a string`);
    const dark = darkOf(token);
    if (dark !== undefined && typeof dark !== "string") {
      throw new Error(`${path}: dark extension must be a string`);
    }
    if (token.$description?.includes("*/")) {
      throw new Error(`${path}: $description must not contain a CSS comment terminator`);
    }
    edges.set(path, [...referencesOf(token.$value), ...referencesOf(dark ?? "")]);
  }
  const state = new Map<string, "visiting" | "done">();
  const visit = (path: string, trail: string[]): void => {
    if (state.get(path) === "done") return;
    if (state.get(path) === "visiting") {
      throw new Error(`Token reference cycle: ${[...trail, path].join(" -> ")}`);
    }
    state.set(path, "visiting");
    for (const next of edges.get(path) ?? []) {
      if (byPath.has(next)) visit(next, [...trail, path]);
    }
    state.set(path, "done");
  };
  for (const path of byPath.keys()) visit(path, []);
}

/**
 * Plain light values first (every browser), then the semantic colors upgraded to light-dark()
 * inside @supports (Chrome/Edge 123, Safari 17.5, Firefox 120): an unsupported light-dark()
 * would make every var(--role) invalid at computed-value time.
 */
export function renderTheme(source: TokenGroup): string {
  const tokens = collectTokens(source);
  validateTokens(tokens);
  const names = new Map(tokens.map((entry) => [entry.path, entry.name]));
  const seen = new Set<string>();
  const lines: string[] = [];
  const upgrades: string[] = [];
  let group = "";
  for (const { path, name, token } of tokens) {
    if (seen.has(name)) throw new Error(`Duplicate CSS name --${name} (${path})`);
    seen.add(name);
    const top = path.split(".").slice(0, -1).join(".");
    if (top !== group) {
      if (group !== "") lines.push("");
      lines.push(`  /* ${top} */`);
      group = top;
    }
    const light = resolveReferences(token.$value, names);
    const note = token.$description === undefined ? "" : ` /* ${token.$description} */`;
    lines.push(`  --${name}: ${light};${note}`);
    if (top === SEMANTIC_GROUP) {
      // Light-only today (ADR-0006): dark defaults to light, so a dark theme is a token change.
      const dark = darkOf(token);
      const darkValue = dark === undefined ? light : resolveReferences(dark, names);
      upgrades.push(`    --${name}: light-dark(${light}, ${darkValue});`);
    }
  }
  return [
    "/* Generated by tools/tokens/build.ts from design/tokens/pequeverso.tokens.json (ADR-0012). */",
    "/* Generated, do not edit: change the JSON and run `node tools/tokens/build.ts`. */",
    ":root {",
    "  color-scheme: light;",
    "",
    ...lines,
    "}",
    "",
    "@supports (color: light-dark(white, black)) {",
    "  :root {",
    ...upgrades,
    "  }",
    "}",
    "",
  ].join("\n");
}

export function readSource(file: string = SOURCE): TokenGroup {
  return JSON.parse(readFileSync(file, "utf8")) as TokenGroup;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(OUTPUT, renderTheme(readSource()));
  console.log(`tokens: wrote ${OUTPUT}`);
}
