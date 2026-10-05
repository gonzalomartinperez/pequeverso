import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";

/**
 * Architecture and safety boundaries of the native assistant (import scan; TypeScript 7 ships no
 * compiler JS API, so this reads the sources directly).
 */
const root = "src/features/assistant";
const toPosix = (file: string) => file.split("\\").join("/");

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function imports(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [
    ...text.matchAll(/(?:import|export)[^"'`]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g),
  ].map((match) => match[1] ?? match[2] ?? "");
}

const layer = (file: string) => toPosix(relative(root, file)).split("/")[0] ?? "";
const all = files(root);

describe("native assistant boundaries", () => {
  it("keeps domain pure, application framework-free and adapters out of presentation", () => {
    for (const file of all) {
      const name = toPosix(file);
      const where = layer(file);
      for (const target of imports(file)) {
        if (where === "domain") assert.ok(target.startsWith("./"), `${name} imports ${target}`);
        if (where === "application")
          assert.ok(target.startsWith("./") || target.startsWith("../domain/"), `${name} imports ${target}`);
        if (where === "adapters")
          assert.ok(/^\.\/|^\.\.\/(domain|application)\//.test(target), `${name} imports ${target}`);
        if (where === "presentation") assert.ok(!target.includes("/adapters/"), `${name} imports ${target}`);
      }
    }
  });

  it("wires adapters only in the composition entry", () => {
    const users = all.filter((file) => imports(file).some((target) => target.includes("adapters/")));
    assert.deepEqual(
      users.map((file) => toPosix(relative(root, file))).filter((file) => !file.startsWith("adapters/")),
      ["entry.ts"],
    );
  });

  it("uses no browser globals in domain and application", () => {
    for (const file of all.filter((f) => ["domain", "application"].includes(layer(f)))) {
      const text = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      assert.ok(!/\b(window|document|localStorage|sessionStorage|navigator)\b/.test(text), toPosix(file));
    }
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
      imports(file).some((target) => target.startsWith("@/features/assistant")),
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
});
