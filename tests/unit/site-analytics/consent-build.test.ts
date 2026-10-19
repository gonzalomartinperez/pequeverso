import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { explicitGrant } from "../../../src/features/site-analytics/domain/consent.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc/index.js");
const banner = readFileSync("src/features/tracking/presentation/consent-banner.tsx", "utf8");

function compile(enabled: boolean, commonjs = false): string {
  // Exercise the installed Next compiler's environment substitution and dead-code pass,
  // without building the application or substituting a synthetic component.
  const substituted = transformSync(banner, {
    filename: "consent-banner.tsx",
    jsc: {
      target: "es2022",
      parser: { syntax: "typescript", tsx: true },
      transform: {
        react: { runtime: "automatic" },
        optimizer: {
          globals: {
            vars: { "process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED": JSON.stringify(String(enabled)) },
          },
        },
      },
    },
  }).code;
  return transformSync(substituted, {
    ...(commonjs ? { module: { type: "commonjs" } } : {}),
    jsc: {
      target: "es2022",
      parser: { syntax: "ecmascript" },
      minify: { compress: true, mangle: false },
    },
    minify: true,
  }).code;
}

test("disabled consent compilation excludes the independent analytics tool and withdrawal branch", () => {
  const output = compile(false);
  for (const marker of [
    "Analítica del sitio Pequeverso",
    "pv:site-analytics:withdraw",
    "Se activa al aceptar o guardar tu selección.",
  ])
    assert.equal(output.includes(marker), false, marker);
  // Existing marketing consent remains available in the OFF output.
  assert.ok(output.includes("Marketing"));
  assert.ok(output.includes("Aceptar"));
  assert.ok(output.includes("Rechazar"));
});

test("enabled consent compilation retains opt-in freshness, withdrawal and existing consent actions", () => {
  const output = compile(true);
  for (const marker of [
    "Analítica del sitio Pequeverso",
    "pv:site-analytics:withdraw",
    "Se activa al aceptar o guardar tu selección.",
    "explicitGrant",
    "writeConsent",
    "Aceptar",
    "Rechazar",
  ])
    assert.ok(output.includes(marker), marker);
});

type Node = { type: unknown; props: Record<string, unknown> };
function render(enabled: boolean, stored: unknown, open: boolean, failWrite: boolean) {
  const effects: (() => unknown)[] = [];
  const changes: { slot: number; value: unknown }[] = [];
  const events: string[] = [];
  const writes: unknown[] = [];
  let slot = 0;
  const jsx = (type: unknown, props: Record<string, unknown>): Node => ({ type, props });
  const modules: Record<string, unknown> = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": () => null,
    react: {
      useId: () => "consent-test",
      useEffect: (effect: () => unknown) => effects.push(effect),
      useState: (initial: unknown) => {
        const current = slot++;
        const value = current === 1 ? open : typeof initial === "function" ? initial() : initial;
        return [value, (next: unknown) => changes.push({ slot: current, value: next })];
      },
    },
    "@/features/site-analytics/domain/consent.ts": { explicitGrant },
    "@/features/tracking/adapters/consent.ts": {
      readConsent: () => stored,
      onConsentChange: () => () => {},
      writeConsent: (choice: unknown) => {
        events.push("write");
        writes.push(choice);
        if (failWrite) throw new Error("synthetic storage failure");
      },
    },
    "@/features/tracking/adapters/env.ts": {
      enabledAdapters: () => [{ category: "marketing", label: "Meta Pixel" }],
    },
  };
  const exports: { ConsentBanner?: (props: unknown) => Node } = {};
  runInNewContext(compile(enabled, true), {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
    Date: { now: () => Date.parse("2026-10-19T00:00:00.000Z") },
    Event,
    window: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent(event: Event) {
        events.push(event.type);
      },
    },
  });
  assert.ok(exports.ConsentBanner);
  const tree = exports.ConsentBanner({ classes: { primary: "primary", secondary: "secondary" } });
  for (const effect of effects) effect();
  return { tree, changes, events, writes };
}

function buttons(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(buttons);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [...(node.type === "button" ? [node] : []), ...buttons(node.props.children)];
}

test("enabled banner reopens stale opt-in while OFF preserves existing marketing consent", () => {
  const stale = { version: 2, analytics: true, marketing: true, updatedAt: "2025-01-01T00:00:00.000Z" };
  assert.deepEqual(render(true, stale, false, false).changes, [{ slot: 1, value: true }]);
  assert.deepEqual(render(false, stale, false, false).changes, [{ slot: 1, value: false }]);
});

test("enabled rejection withdraws before failed persistence; OFF keeps the original writer behavior", () => {
  for (const enabled of [true, false]) {
    const result = render(enabled, null, true, true);
    const reject = buttons(result.tree).find((button) => button.props.children === "Rechazar");
    assert.ok(reject);
    assert.equal(typeof reject.props.onClick, "function");
    assert.throws(() => (reject.props.onClick as () => void)(), /synthetic storage failure/);
    assert.deepEqual(result.events, enabled ? ["pv:site-analytics:withdraw", "write"] : ["write"]);
    assert.equal(result.writes.length, 1);
    assert.equal(Reflect.get(result.writes[0] as object, "analytics"), false);
    assert.equal(Reflect.get(result.writes[0] as object, "marketing"), false);
  }
});
