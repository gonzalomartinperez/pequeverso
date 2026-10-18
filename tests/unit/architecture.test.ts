import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  clientBoundaryViolations,
  firstRuntimeCycle,
  ownedImportViolations,
  runtimeGraph,
  siteDependencyAllowed,
  sourceFiles,
  sourceModule,
  sourcePlacementViolations,
} from "../helpers/source-architecture.ts";

const modules = new Map(
  ["src", "content", "config"].flatMap((directory) =>
    sourceFiles(directory).map((file) => [file, sourceModule(file)] as const),
  ),
);

describe("store architecture", () => {
  it("excludes installed packages at every depth while retaining owned tool modules", () => {
    const root = mkdtempSync(join(tmpdir(), "pv-architecture-owned-"));
    try {
      const owned = ["tools/media/cli.ts", "tools/custom/unchecked.ts", "src/shared/ui/button.tsx"];
      const dependencies = [
        "node_modules/vendor/index.ts",
        "tools/media/node_modules/vendor/index.ts",
        "tools/media/node_modules/vendor/node_modules/nested/index.js",
      ];
      for (const file of [...owned, ...dependencies]) {
        const target = join(root, file);
        mkdirSync(join(target, ".."), { recursive: true });
        writeFileSync(target, "export const value = 1;\n");
      }
      assert.deepEqual(sourceFiles(root).sort(), owned.map((file) => join(root, file)).sort());
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("resolves all owned server, CLI, source and test imports, rejecting malformed relay paths", () => {
    const all = new Map(
      ["src", "content", "config", "tools", "tests"].flatMap((directory) =>
        sourceFiles(directory).map((file) => [file, sourceModule(file)] as const),
      ),
    );
    assert.deepEqual(ownedImportViolations(all), []);
    for (const specifier of [
      "@src/features/tracking/adapters/server/meta-capi.ts",
      "../src/features/tracking/adapters/src/features/tracking/adapters/server/meta-capi.ts",
    ]) {
      const fixture = new Map([
        ["tools/start.ts", sourceModule("start.ts", `import { relay } from "${specifier}";`)],
      ]);
      assert.equal(ownedImportViolations(fixture).length, 1);
    }
    const positive = new Map([
      [
        "src/app/api/meta/events/route.standalone.ts",
        sourceModule("route.standalone.ts", 'import { relay } from "@server/meta-capi.ts";'),
      ],
      [
        "src/features/tracking/adapters/server/meta-capi.ts",
        sourceModule("meta-capi.ts", "export const relay = 1;"),
      ],
    ]);
    assert.deepEqual(ownedImportViolations(positive), []);
  });

  it("enforces named shared and feature dependency directions", () => {
    for (const [file, specifier] of [
      ["src/shared/editorial/card.tsx", "@/views/home-view"],
      ["src/shared/ui/button.tsx", "@/features/commerce/presentation/checkout-link"],
      ["src/features/gallery/presentation/gallery.tsx", "@/shell/site-header"],
      ["src/features/landing/presentation/gallery.tsx", "@/views/product/core-landing-view"],
    ])
      assert.equal(siteDependencyAllowed(file ?? "", specifier ?? null), false);
    assert.equal(
      siteDependencyAllowed("src/views/home-view.tsx", "@/features/hub/presentation/hub-sticky-bar"),
      true,
    );
    assert.equal(siteDependencyAllowed("src/shared/editorial/card.tsx", "@/shared/styles/cn"), true);
    for (const [file, module] of modules)
      for (const edge of module.imports)
        assert.ok(siteDependencyAllowed(file, edge.specifier), `${file}: ${edge.specifier}`);
  });

  it("rejects relocated catalog and server glue through client barrels and dynamic imports", () => {
    for (const target of [
      "config/products/index.ts",
      "config/products/schema.ts",
      "src/features/tracking/adapters/server/meta-capi.ts",
    ]) {
      const fixture = new Map([
        [
          "src/features/gallery/presentation/client.tsx",
          sourceModule("client.tsx", '"use client"; import("./barrel");'),
        ],
        [
          "src/features/gallery/presentation/barrel.ts",
          sourceModule("barrel.ts", `export { value } from "../../../../${target}";`),
        ],
        [target, sourceModule("private.ts", "export const value = 1;")],
      ]);
      assert.notDeepEqual(clientBoundaryViolations(fixture), []);
    }
  });

  it("classifies every source module using the existing store topology", () => {
    assert.deepEqual(sourcePlacementViolations(modules), []);
  });

  it("rejects importless modules outside declared roots and component or feature groups", () => {
    for (const file of [
      "src/unclassified/policy.ts",
      "src/lib/empty.ts",
      "src/motion/empty.mts",
      "src/products/empty.ts",
      "src/shared/unknown/empty.css",
      "src/features/gallery/domain/empty.cts",
      "src/features/gallery/entry.ts",
      "server/empty.ts",
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
      "src/shared/editorial/section.tsx",
      "src/shell/site-header.tsx",
      "src/shared/ui/button.tsx",
      "src/features/assistant/entry.ts",
      "src/features/commerce/domain/checkout-url.ts",
      "src/features/gallery/presentation/gallery.tsx",
      "src/views/home-view.tsx",
      "src/features/hub/adapters/hub-products.ts",
      "src/views/product/core-landing-view.tsx",
      "src/features/playground/presentation/playground-game.tsx",
      "src/features/tracking/adapters/consent.ts",
      "src/shared/styles/cn-tables.d.ts",
      "src/shared/styles/cn-tables.js",
      "src/shared/motion/scene/runtime.ts",
      "config/products/grafismo-fonetico.ts",
      "src/shared/motion/scene/static.css",
      "src/shared/styles/module.mts",
      "content/es/home.ts",
      "config/commerce.ts",
      "src/features/tracking/adapters/server/meta-capi.ts",
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
      [
        "src/features/tracking/adapters/server/private.ts",
        sourceModule("private.ts", 'import "server-only"; import "node:fs";'),
      ],
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
        "src/features/tracking/adapters/server/private.ts",
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
      "@server/*": ["./src/features/tracking/adapters/server/*"],
    });
  });
});
