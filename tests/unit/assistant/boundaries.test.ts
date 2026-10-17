import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, it } from "node:test";
import {
  assistantDependencyAllowed,
  assistantLayer,
  sourceFiles as files,
  sourceImports,
  sourceModule,
  sourceTarget,
} from "../../helpers/source-architecture.ts";

/**
 * Architecture and safety boundaries of the native assistant. Parse syntax without executing
 * modules; resolve aliases and relative traversal before checking the dependency direction.
 */
const root = "src/features/assistant";
const toPosix = (file: string) => file.split("\\").join("/");

function imports(file: string): string[] {
  return sourceImports(file).map(({ specifier }) => {
    assert.notEqual(specifier, null, `${file}: imports must have a statically reviewable module`);
    return specifier as string;
  });
}

const layer = (file: string) => toPosix(relative(root, file)).split("/")[0] ?? "";
const all = files(root);

describe("native assistant boundaries", () => {
  it("keeps domain pure, application framework-free and adapters out of presentation", () => {
    for (const file of all) {
      const name = toPosix(file);
      for (const { specifier, typeOnly } of sourceImports(file)) {
        assert.ok(assistantDependencyAllowed(name, specifier, typeOnly), `${name} imports ${specifier}`);
      }
    }
  });

  it("wires adapters only in the composition entry", () => {
    const users = all.filter((file) =>
      imports(file).some((target) => assistantLayer(sourceTarget(file, target) ?? "") === "adapters"),
    );
    assert.deepEqual(
      users.map((file) => toPosix(relative(root, file))).filter((file) => !file.startsWith("adapters/")),
      ["entry.ts"],
    );
  });

  it("uses no browser globals or platform deadlines in domain and application", () => {
    const result = spawnSync(
      "node_modules/.bin/biome",
      ["lint", `${root}/domain`, `${root}/application`, "--only=style/noRestrictedGlobals"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const file of all.filter((f) => ["domain", "application"].includes(layer(f))))
      assert.equal(sourceModule(file).platformDeadline, false, file);
  });

  it("rejects globals after URL strings without mistaking object properties for globals", () => {
    const lint = (source: string) => {
      const temporary = mkdtempSync(join(tmpdir(), "pequeverso-architecture-"));
      const probe = `${root}/domain/probe.ts`;
      const configuration = JSON.parse(readFileSync("biome.json", "utf8"));
      // Preserve the actual rules and override paths, but isolate VCS discovery from the checkout.
      configuration.vcs.enabled = false;
      mkdirSync(join(temporary, root, "domain"), { recursive: true });
      writeFileSync(join(temporary, "biome.json"), JSON.stringify(configuration));
      writeFileSync(join(temporary, probe), source);
      try {
        return spawnSync(
          resolve("node_modules/.bin/biome"),
          ["lint", probe, "--only=style/noRestrictedGlobals"],
          { encoding: "utf8", cwd: temporary },
        );
      } finally {
        rmSync(temporary, { recursive: true });
      }
    };
    for (const source of [
      'const url="https://example.invalid"; fetch(url);',
      'const url="https://example.invalid"; window.alert(url);',
      'const url="https://example.invalid"; setTimeout(() => {}, 1);',
      'globalThis.fetch("/");',
    ]) {
      const result = lint(source);
      assert.notEqual(result.status, 0, source);
      assert.match(result.stdout + result.stderr, /noRestrictedGlobals/);
    }
    assert.equal(lint('const data = {document: "https://example.invalid", window: 7};').status, 0);
    assert.equal(
      sourceModule("probe.ts", 'const url="https://example.invalid"; AbortSignal.timeout(1);')
        .platformDeadline,
      true,
    );
    assert.equal(sourceModule("probe.ts", 'const text="AbortSignal.timeout(1)";').platformDeadline, false);
  });

  it("never renders HTML, stores credentials in the browser or opens windows by itself", () => {
    for (const file of all) {
      const text = readFileSync(file, "utf8");
      assert.ok(
        !/dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML/.test(text),
        `${toPosix(file)} renders HTML`,
      );
      assert.ok(
        !/localStorage|sessionStorage|indexedDB|document\.cookie/.test(text),
        `${toPosix(file)} uses storage`,
      );
      assert.ok(!/window\.open|location\.(assign|replace|href\s*=)/.test(text), `${toPosix(file)} navigates`);
    }
  });

  it("is reachable from the app only through the build-time slot", () => {
    const outside = files("src").filter((file) => !toPosix(file).startsWith(`${root}/`));
    const users = outside.filter((file) =>
      imports(file).some((target) => (sourceTarget(file, target) ?? "").startsWith(`${root}/`)),
    );
    assert.deepEqual(users.map(toPosix), ["src/app/layout.tsx"]);
    assert.ok(imports("src/app/layout.tsx").includes("@/features/assistant/slot"));
    const slot = readFileSync(`${root}/slot.tsx`, "utf8");
    // The comparison must stay inline so the bundler folds it and drops the import when disabled.
    assert.match(
      slot,
      /process\.env\.NEXT_PUBLIC_ASSISTANT_ENABLED === "true" \? await import\("\.\/mount"\) : null/,
    );
    assert.ok(
      !/^import .*["']\.\/mount["'];?$/m.test(slot.replace(/import type .*$/gm, "")),
      "slot statically imports mount",
    );
  });

  it("rejects traversal, directory and alias imports that used to evade the layer checks", () => {
    for (const target of ["./../adapters/http.ts", "../adapters", "@/features/assistant/adapters/http"]) {
      assert.equal(assistantDependencyAllowed(`${root}/domain/models.ts`, target), false, target);
      assert.equal(assistantDependencyAllowed(`${root}/application/ports.ts`, target), false, target);
      assert.equal(assistantDependencyAllowed(`${root}/presentation/panel.tsx`, target), false, target);
    }
    assert.equal(assistantDependencyAllowed(`${root}/domain/models.ts`, "react"), false);
    assert.equal(assistantDependencyAllowed(`${root}/application/ports.ts`, "./../domain/models.ts"), true);
    assert.equal(
      assistantDependencyAllowed(`${root}/domain/models.ts`, "@/features/assistant/domain/links"),
      true,
    );
    for (const target of ["../entry", "../runtime", "../application/assistant"])
      assert.equal(assistantDependencyAllowed(`${root}/presentation/panel.tsx`, target), false, target);
    assert.equal(
      assistantDependencyAllowed(`${root}/presentation/panel.tsx`, "../application/assistant", true),
      true,
    );
  });

  it("checks side effects, re-exports, dynamic imports, require and import types as syntax", () => {
    const source = `
      // import "ignored-comment";
      const text = 'import "ignored-string"';
      import "side-effect";
      import type { A } from "type-only";
      export { A as B } from "re-export";
      export * from "star-export";
      const dynamic = import("dynamic");
      const common = require("common");
      import filesystem = require("node:fs");
      type T = import("type-expression").T;
      const unknown = import(moduleName);
    `;
    assert.deepEqual(sourceImports("fixture.ts", source), [
      { specifier: "side-effect", typeOnly: false },
      { specifier: "type-only", typeOnly: true },
      { specifier: "re-export", typeOnly: false },
      { specifier: "star-export", typeOnly: false },
      { specifier: "dynamic", typeOnly: false },
      { specifier: "common", typeOnly: false },
      { specifier: "node:fs", typeOnly: false },
      { specifier: "type-expression", typeOnly: true },
      { specifier: null, typeOnly: false },
    ]);
    assert.equal(assistantDependencyAllowed(`${root}/application/assistant.ts`, null), false);
    assert.throws(() => sourceImports("broken.ts", "import {"), /broken.ts/);
  });
});
