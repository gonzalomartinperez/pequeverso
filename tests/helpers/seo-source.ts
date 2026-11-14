import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Metadata } from "next";
import { parseSync } from "oxc-parser";
import { coreProducts, products } from "../../config/products/index.ts";
import { sourceFiles } from "./source-architecture.ts";

const { compilerOptions } = JSON.parse(readFileSync("tsconfig.json", "utf8")) as {
  compilerOptions: { paths: Record<string, string[]> };
};
const aliases = Object.entries(compilerOptions.paths).map(([key, targets]) => {
  assert.ok(targets[0], key);
  return [key.replace(/\*$/, ""), targets[0].replace(/\*$/, "")] as const;
});
const appUrl = pathToFileURL(`${resolve("src/app")}/`).href;

// Real file URLs preserve relative imports and module identity with ordinary test imports.
// Only page UI is removed; metadata bodies and all other modules execute unchanged.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = aliases.find(([prefix]) => specifier.startsWith(prefix));
    if (!alias) return nextResolve(specifier, context);
    const base = resolve(alias[1], specifier.slice(alias[0].length));
    const target = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(existsSync);
    assert.ok(target, `unresolved SEO dependency: ${specifier}`);
    return nextResolve(pathToFileURL(target).href, context);
  },
  load(url, context, nextLoad) {
    if (!url.startsWith(appUrl) || !url.endsWith("/page.tsx")) return nextLoad(url, context);
    const file = fileURLToPath(url);
    const source = readFileSync(file, "utf8");
    const parsed = parseSync(file, source);
    assert.deepEqual(parsed.errors, [], file);
    const chunks = parsed.program.body.flatMap((node) => {
      if (node.type === "ExportDefaultDeclaration") return [];
      if (
        node.type === "ExportNamedDeclaration" &&
        node.source &&
        node.specifiers.some(
          (item) => item.exported.type === "Identifier" && item.exported.name === "default",
        )
      )
        return [];
      if (
        node.type === "ImportDeclaration" &&
        node.importKind !== "type" &&
        !/^(?:@config\/|@content\/|@\/views\/metadata\.ts$|@\/shared\/media\/media\.ts$)/.test(
          node.source.value,
        )
      )
        return [];
      return [source.slice(node.start, node.end)];
    });
    return {
      format: "module",
      source: stripTypeScriptTypes(chunks.join("\n")),
      shortCircuit: true,
    };
  },
});

export async function seoModule(file: string): Promise<Record<string, unknown>> {
  return import(pathToFileURL(resolve(file)).href);
}

export async function routeMetadata(): Promise<Map<string, Metadata>> {
  const routes = new Map<string, Metadata>();
  for (const file of sourceFiles("src/app").filter((file) => file.endsWith("/page.tsx"))) {
    const module = await seoModule(file);
    if (!file.includes("[product]")) {
      routes.set(file.slice("src/app".length, -"page.tsx".length), module.metadata as Metadata);
    } else {
      const generate = module.generateMetadata as (props: {
        params: Promise<{ product: string }>;
      }) => Promise<Metadata>;
      const thanks = file.includes("/gracias/");
      for (const product of thanks ? coreProducts() : products) {
        const path = thanks && product.kind === "core" ? product.funnel.thanksPath : product.path;
        routes.set(path, await generate({ params: Promise.resolve({ product: product.slug }) }));
      }
    }
  }
  return routes;
}
