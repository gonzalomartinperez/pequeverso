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
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.(?:[cm]?[jt]sx?|css)$/.test(file)
        ? [posixPath(file)]
        : [];
  });
}

/** Keep the documented store topology explicit, including modules with no imports. */
export function sourcePlacementViolations(modules: ReadonlyMap<string, SourceModule>): string[] {
  const roots = new Set(["app", "views", "shell", "features", "shared"]);
  const shared = new Set(["ui", "styles", "motion", "editorial", "identity", "media", "navigation"]);
  const layers: Record<string, ReadonlySet<string>> = {
    assistant: new Set(["domain", "application", "adapters", "presentation"]),
    commerce: new Set(["domain", "presentation"]),
    gallery: new Set(["presentation"]),
    hub: new Set(["domain", "adapters", "presentation"]),
    landing: new Set(["presentation"]),
    playground: new Set(["domain", "presentation"]),
    tracking: new Set(["adapters", "presentation"]),
  };
  return [...modules.keys()].filter((file) => {
    const parts = posixPath(file).split("/");
    if (parts.some((part) => !part || part === "." || part === "..")) return true;
    if (["content", "config"].includes(parts[0] ?? "")) return parts.length < 2;
    if (parts[0] !== "src" || parts.length < 3 || !roots.has(parts[1] ?? "")) return true;
    if (parts[1] === "shared") return parts.length < 4 || !shared.has(parts[2] ?? "");
    if (parts[1] === "features") {
      if (parts[2] === "assistant") return !assistantSourcePlacementAllowed(file);
      return parts.length < 5 || !layers[parts[2] ?? ""]?.has(parts[3] ?? "");
    }
    return false;
  });
}

/** Composition owns features; reused capabilities never depend on composition or features. */
export function siteDependencyAllowed(file: string, specifier: string | null): boolean {
  if (specifier === null) return true;
  const target = sourceTarget(file, specifier);
  if (target === null) return true;
  if (file.startsWith("src/shared/")) return !/^src\/(?:app|views|shell|features)\//.test(target);
  if (file.startsWith("src/features/")) return !/^src\/(?:app|views|shell)\//.test(target);
  if (file.startsWith("src/shell/")) return !/^src\/(?:app|views)\//.test(target);
  if (file.startsWith("src/views/")) return !target.startsWith("src/app/");
  return true;
}

/** Parse TypeScript syntax, including side effects, re-exports and import types; never execute it. */
export function sourceModule(file: string, source = readFileSync(file, "utf8")): SourceModule {
  if (file.endsWith(".css")) return { imports: [], client: false };
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
  const aliases = {
    "@/": "src/",
    "@config/": "config/",
    "@content/": "content/",
    "@server/": "src/features/tracking/adapters/server/",
  };
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

/** Resolve every owned local import, including server/CLI consumers outside client graphs. */
export function ownedImportViolations(modules: ReadonlyMap<string, SourceModule>): string[] {
  const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));
  const manifests = new Map<string, Set<string>>();
  const declared = (file: string): Set<string> => {
    const manifest = file.startsWith("tools/media/") ? "tools/media/package.json" : "package.json";
    let names = manifests.get(manifest);
    if (!names) {
      const value = JSON.parse(readFileSync(manifest, "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      names = new Set([
        ...Object.keys(value.dependencies ?? {}),
        ...Object.keys(value.devDependencies ?? {}),
      ]);
      manifests.set(manifest, names);
    }
    return names;
  };
  const problems: string[] = [];
  for (const [file, module] of modules) {
    for (const { specifier } of module.imports) {
      if (specifier === null) continue; // Existing launcher expressions retain their own bounded policy.
      const local = sourceTarget(file, specifier);
      if (local !== null) {
        const generated = ["src/shared/styles/cn-tables", "src/shared/styles/cn-tables.js"].includes(local);
        const asset = /\.(?:css|json|svg|png|jpe?g|webp|avif|woff2?)$/.test(local) && existsSync(local);
        if (!generated && !asset && graphTarget(file, specifier, modules) === null)
          problems.push(`${file}: unresolved owned import ${specifier}`);
      } else {
        const name = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : (specifier.split("/")[0] ?? "");
        if (
          !builtins.has(specifier.replace(/^node:/, "")) &&
          specifier !== "server-only" &&
          !declared(file).has(name)
        )
          problems.push(`${file}: undeclared package or alias ${specifier}`);
      }
    }
  }
  return problems;
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
      const forbiddenFile =
        file.startsWith("src/features/tracking/adapters/server/") ||
        /^config\/products\/(index|schema)\.ts$/.test(file);
      if (forbiddenFile) violations.push(`${entry}: ${chain.join(" -> ")}`);
      for (const { specifier, typeOnly } of current.imports) {
        if (typeOnly) continue;
        if (specifier !== null) {
          const local = sourceTarget(file, specifier);
          if (
            local !== null &&
            graphTarget(file, specifier, modules) === null &&
            local !== "src/shared/styles/cn-tables" &&
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

/** Only the named composition modules may live outside the assistant's four layers. */
export function assistantSourcePlacementAllowed(path: string): boolean {
  const layer = assistantLayer(path);
  if (["domain", "application", "adapters", "presentation"].includes(layer ?? "")) return true;
  return ["entry.ts", "flag.ts", "mount.tsx", "runtime.tsx", "slot.tsx"].some(
    (file) => path === `${assistantRoot}/${file}`,
  );
}

export function assistantDependencyAllowed(
  file: string,
  specifier: string | null,
  typeOnly = false,
): boolean {
  if (!assistantSourcePlacementAllowed(file)) return false;
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
