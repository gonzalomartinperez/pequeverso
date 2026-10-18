import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  clientBoundaryViolations,
  firstRuntimeCycle,
  runtimeGraph,
  sourceFiles,
  sourceModule,
  sourcePlacementViolations,
} from "../helpers/source-architecture.ts";

const modules = new Map(
  ["src", "content", "config", "server"].flatMap((directory) =>
    sourceFiles(directory).map((file) => [file, sourceModule(file)] as const),
  ),
);

describe("store architecture", () => {
  it("classifies every source module using the existing store topology", () => {
    assert.deepEqual(sourcePlacementViolations(modules), []);
  });

  it("rejects importless modules outside declared roots and component or feature groups", () => {
    for (const file of [
      "src/unclassified/policy.ts",
      "src/unchecked.ts",
      "src/components/unclassified/empty.tsx",
      "src/components/layout.tsx",
      "src/features/unclassified/empty.ts",
      "src/features/home.ts",
      "src/Features/home/empty.ts",
      "src/features/home/../unclassified/empty.ts",
    ]) {
      const module = sourceModule(file, "export const value = 1;");
      assert.deepEqual(module.imports, []);
      assert.deepEqual(sourcePlacementViolations(new Map([[file, module]])), [file]);
    }
  });

  it("preserves existing route, component, feature, generated and public-content placements", () => {
    const files = [
      "src/app/[product]/page.tsx",
      "src/app/api/meta/events/route.standalone.ts",
      "src/components/blocks/section.tsx",
      "src/components/layout/header.tsx",
      "src/components/ui/button.tsx",
      "src/features/assistant/entry.ts",
      "src/features/commerce/checkout-url.ts",
      "src/features/gallery/gallery.tsx",
      "src/features/home/page.tsx",
      "src/features/hub/hub-products.ts",
      "src/features/landing/core-landing.tsx",
      "src/features/playground/index.tsx",
      "src/features/tracking/consent.ts",
      "src/lib/cn-tables.d.ts",
      "src/lib/cn-tables.js",
      "src/motion/scene/runtime.ts",
      "src/products/grafismo-fonetico.ts",
      "content/es/home.ts",
      "config/commerce.ts",
      "server/meta-capi.ts",
    ];
    assert.deepEqual(
      sourcePlacementViolations(new Map(files.map((file) => [file, sourceModule(file, "export {};")]))),
      [],
    );
  });

  it("keeps runtime dependencies acyclic across source, public content, config and server", () => {
    assert.equal(firstRuntimeCycle(runtimeGraph(modules)), null);
  });

  it("keeps the entire client import graph away from server code, credentials and the build-time registry", () => {
    assert.deepEqual(clientBoundaryViolations(modules), []);
  });

  it("fails for indirect server imports, alias barrels, dynamic imports and runtime cycles", () => {
    const fixtures = new Map([
      ["src/client.tsx", sourceModule("client.tsx", '"use client"; import "./barrel";')],
      ["src/barrel.ts", sourceModule("barrel.ts", 'export * from "@server/private";')],
      ["server/private.ts", sourceModule("private.ts", 'import "server-only"; import "node:fs";')],
    ]);
    assert.match(clientBoundaryViolations(fixtures).join("\n"), /client.tsx.*barrel.ts.*server\/private.ts/);
    fixtures.set(
      "src/barrel.ts",
      sourceModule("barrel.ts", 'export const load = () => import("@server/private");'),
    );
    assert.notEqual(clientBoundaryViolations(fixtures).length, 0);
    fixtures.set("src/barrel.ts", sourceModule("barrel.ts", 'export * from "../scripts/unscanned";'));
    assert.match(clientBoundaryViolations(fixtures).join("\n"), /unscanned local module/);
    fixtures.set("src/barrel.ts", sourceModule("barrel.ts", 'import filesystem = require("node:fs");'));
    assert.match(clientBoundaryViolations(fixtures).join("\n"), /node:fs/);
    fixtures.set("src/barrel.ts", sourceModule("barrel.ts", 'export { value } from "./client";'));
    assert.deepEqual(firstRuntimeCycle(runtimeGraph(fixtures)), [
      "src/client.tsx",
      "src/barrel.ts",
      "src/client.tsx",
    ]);
  });

  it("preserves erased type imports without treating comments or ordinary strings as a client directive", () => {
    const fixtures = new Map([
      [
        "src/client.tsx",
        sourceModule("client.tsx", '"use client"; import type { DTO } from "@server/private";'),
      ],
      [
        "server/private.ts",
        sourceModule("private.ts", 'import "server-only"; export type DTO = { value: string };'),
      ],
    ]);
    assert.deepEqual(clientBoundaryViolations(fixtures), []);
    assert.equal(
      sourceModule("plain.ts", '// "use client";\nexport const text = "use client";').client,
      false,
    );
    assert.equal(sourceModule("client.ts", '/* comment */ "use client";').client, true);
  });

  it("requires explicit review when TypeScript path aliases change", () => {
    const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8")) as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    assert.deepEqual(tsconfig.compilerOptions.paths, {
      "@/*": ["./src/*"],
      "@content/*": ["./content/*"],
      "@config/*": ["./config/*"],
      "@server/*": ["./server/*"],
    });
  });
});
