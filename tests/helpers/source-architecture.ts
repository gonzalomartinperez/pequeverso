import { existsSync, readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { parseSync, Visitor } from "oxc-parser";

export interface SourceImport {
  specifier: string | null;
  typeOnly: boolean;
}

export interface SourceModule {
  imports: SourceImport[];
  client: boolean;
  platformDeadline?: boolean;
}

export const posixPath = (path: string) => path.replaceAll("\\", "/");

export function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(ts|tsx|js)$/.test(file) ? [posixPath(file)] : [];
  });
}

/** Parse TypeScript syntax, including side effects, re-exports and import types; never execute it. */
export function sourceModule(file: string, source = readFileSync(file, "utf8")): SourceModule {
  const parsed = parseSync(file, source);
  if (parsed.errors.length)
    throw new Error(`${file}: ${parsed.errors.map((error) => error.message).join("; ")}`);
  const imports: SourceImport[] = [];
  let platformDeadline = false;
  const add = (specifier: string | null, typeOnly = false) => imports.push({ specifier, typeOnly });
  new Visitor({
    ImportDeclaration(node) {
      add(
        node.source.value,
        node.importKind === "type" ||
          (node.specifiers.length > 0 &&
            node.specifiers.every((item) => item.type === "ImportSpecifier" && item.importKind === "type")),
      );
    },
    ExportNamedDeclaration(node) {
      if (node.source)
        add(
          node.source.value,
          node.exportKind === "type" ||
            (node.specifiers.length > 0 && node.specifiers.every((item) => item.exportKind === "type")),
        );
    },
    ExportAllDeclaration(node) {
      add(node.source.value, node.exportKind === "type");
    },
    ImportExpression(node) {
      add(node.source.type === "Literal" && typeof node.source.value === "string" ? node.source.value : null);
    },
    TSImportEqualsDeclaration(node) {
      if (node.moduleReference.type === "TSExternalModuleReference")
        add(node.moduleReference.expression.value, node.importKind === "type");
    },
    MemberExpression(node) {
      if (
        node.object.type === "Identifier" &&
        node.object.name === "AbortSignal" &&
        ((node.property.type === "Identifier" && node.property.name === "timeout") ||
          (node.property.type === "Literal" && node.property.value === "timeout"))
      )
        platformDeadline = true;
    },
    TSImportType(node) {
      add(node.source.value, true);
    },
    CallExpression(node) {
      if (node.callee.type !== "Identifier" || node.callee.name !== "require") return;
      const argument = node.arguments[0];
      add(argument?.type === "Literal" && typeof argument.value === "string" ? argument.value : null);
    },
  }).visit(parsed.program);
  return {
    imports,
    platformDeadline,
    client: parsed.program.body.some(
      (node) => node.type === "ExpressionStatement" && node.directive === "use client",
    ),
  };
}

export function sourceImports(file: string, source = readFileSync(file, "utf8")): SourceImport[] {
  return sourceModule(file, source).imports;
}

/** Resolve the repository's explicit aliases before applying dependency rules. */
export function sourceTarget(file: string, specifier: string): string | null {
  const aliases = { "@/": "src/", "@config/": "config/", "@content/": "content/", "@server/": "server/" };
  const alias = Object.entries(aliases).find(([prefix]) => specifier.startsWith(prefix));
  const path = alias
    ? resolve(alias[1], specifier.slice(alias[0].length))
    : specifier.startsWith(".")
      ? resolve(dirname(file), specifier)
      : null;
  return path === null ? null : posixPath(relative(process.cwd(), path));
}

function graphTarget(
  file: string,
  specifier: string,
  modules: ReadonlyMap<string, SourceModule>,
): string | null {
  const target = sourceTarget(file, specifier);
  if (target === null) return null;
  const stem = target.replace(/\.jsx?$/, "");
  return (
    [target, `${stem}.ts`, `${stem}.tsx`, `${stem}.js`, `${target}/index.ts`, `${target}/index.tsx`].find(
      (candidate) => modules.has(candidate),
    ) ?? null
  );
}

export function runtimeGraph(modules: ReadonlyMap<string, SourceModule>): Map<string, string[]> {
  return new Map(
    [...modules].map(([file, module]) => [
      file,
      module.imports.flatMap(({ specifier, typeOnly }) => {
        const target = !typeOnly && specifier !== null ? graphTarget(file, specifier, modules) : null;
        return target === null ? [] : [target];
      }),
    ]),
  );
}

export function firstRuntimeCycle(graph: ReadonlyMap<string, readonly string[]>): string[] | null {
  const visited = new Set<string>();
  const active = new Map<string, number>();
  const path: string[] = [];
  const visit = (file: string): string[] | null => {
    const position = active.get(file);
    if (position !== undefined) return [...path.slice(position), file];
    if (visited.has(file)) return null;
    active.set(file, path.length);
    path.push(file);
    for (const target of graph.get(file) ?? []) {
      const cycle = visit(target);
      if (cycle) return cycle;
    }
    path.pop();
    active.delete(file);
    visited.add(file);
    return null;
  };
  for (const file of graph.keys()) {
    const cycle = visit(file);
    if (cycle) return cycle;
  }
  return null;
}

/** Follow every runtime edge, including barrels, before declaring a client tree safe. */
export function clientBoundaryViolations(modules: ReadonlyMap<string, SourceModule>): string[] {
  const graph = runtimeGraph(modules);
  const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));
  const violations: string[] = [];
  for (const [entry, module] of modules) {
    if (!module.client) continue;
    const visited = new Set<string>();
    const visit = (file: string, chain: string[]) => {
      if (visited.has(file)) return;
      visited.add(file);
      const current = modules.get(file);
      if (!current) return;
      const forbiddenFile = file.startsWith("server/") || /^src\/products\/(index|schema)\.ts$/.test(file);
      if (forbiddenFile) violations.push(`${entry}: ${chain.join(" -> ")}`);
      for (const { specifier, typeOnly } of current.imports) {
        if (typeOnly) continue;
        if (specifier !== null) {
          const local = sourceTarget(file, specifier);
          if (
            local !== null &&
            graphTarget(file, specifier, modules) === null &&
            local !== "src/lib/cn-tables" &&
            !(
              existsSync(local) &&
              (/^(?:src|content)\//.test(local) || local === "media/manifest.json") &&
              /\.(?:css|json|svg|png|jpe?g|webp|avif|woff2?)$/.test(local)
            )
          )
            violations.push(`${entry}: ${chain.join(" -> ")} -> unscanned local module ${local}`);
        }
        if (
          specifier === null ||
          builtins.has(specifier.replace(/^node:/, "")) ||
          specifier.startsWith("/") ||
          specifier.startsWith("#") ||
          /^(?:node:|server-only$|next\/(?:headers|server)$|openai(?:\/|$)|pg$|postgres$)/.test(specifier)
        )
          violations.push(`${entry}: ${chain.join(" -> ")} -> ${specifier ?? "nonliteral import"}`);
      }
      for (const target of graph.get(file) ?? []) visit(target, [...chain, target]);
    };
    visit(entry, [entry]);
  }
  return violations;
}

const assistantRoot = "src/features/assistant";
export function assistantLayer(path: string): string | null {
  return path.startsWith(`${assistantRoot}/`)
    ? (path.slice(assistantRoot.length + 1).split("/")[0] ?? null)
    : null;
}

export function assistantDependencyAllowed(
  file: string,
  specifier: string | null,
  typeOnly = false,
): boolean {
  const from = assistantLayer(file);
  if (specifier === null) return !["domain", "application", "adapters", "presentation"].includes(from ?? "");
  const target = sourceTarget(file, specifier);
  const to = target === null ? null : assistantLayer(target);
  if (from === "domain") return to === "domain";
  if (from === "application") return to === "domain" || to === "application";
  if (from === "adapters") return to === "domain" || to === "application" || to === "adapters";
  if (from === "presentation")
    return to === null || to === "domain" || to === "presentation" || (to === "application" && typeOnly);
  return true;
}
