import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { explicitGrant } from "../../../src/features/site-analytics/domain/consent.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc/index.js");
const banner = readFileSync("src/features/tracking/presentation/consent-banner-ui.tsx", "utf8");
const trigger = readFileSync("src/features/tracking/presentation/consent-banner.tsx", "utf8");

function compile(enabled: boolean, commonjs = false, source = banner): string {
  // Exercise the installed Next compiler's environment substitution and dead-code pass,
  // without building the application or substituting a synthetic component.
  const substituted = transformSync(source, {
    filename: "consent-banner.tsx",
    jsc: {
      target: "es2022",
      parser: { syntax: "typescript", tsx: true },
      transform: {
        react: { runtime: "automatic" },
        optimizer: {
          globals: {
            vars: {
              "process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED": JSON.stringify(String(enabled)),
            },
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
    "writeConsent",
    "Aceptar",
    "Rechazar",
  ])
    assert.ok(output.includes(marker), marker);
  // The lazy trigger keeps the freshness check that reopens a stale analytics opt-in.
  assert.ok(compile(true, false, trigger).includes("explicitGrant"));
});

type Node = { type: unknown; props: Record<string, unknown> };
function render(
  enabled: boolean,
  stored: unknown,
  open: boolean,
  failWrite: boolean,
  part: "ui" | "trigger" = "ui",
) {
  const effects: (() => unknown)[] = [];
  const changes: { slot: number; value: unknown }[] = [];
  const events: string[] = [];
  const writes: unknown[] = [];
  const listeners = new Map<string, () => void>();
  const consentListeners: ((state: unknown) => void)[] = [];
  let slot = 0;
  const jsx = (type: unknown, props: Record<string, unknown>): Node => ({ type, props });
  const modules: Record<string, unknown> = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": () => null,
    react: {
      useId: () => "consent-test",
      useRef: (initial: unknown) => ({ current: initial }),
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
      onConsentChange: (listener: (state: unknown) => void) => {
        consentListeners.push(listener);
        return () => {};
      },
      writeConsent: (choice: unknown) => {
        events.push("write");
        writes.push(choice);
        if (failWrite) throw new Error("synthetic storage failure");
      },
    },
    "@/features/tracking/adapters/env.ts": {
      enabledAdapters: () => [{ category: "marketing", label: "Meta Pixel" }],
      siteAnalyticsBuilt: enabled,
    },
  };
  const exports: Record<string, ((props: unknown) => Node) | undefined> = {};
  runInNewContext(compile(enabled, true, part === "ui" ? banner : trigger), {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
    Date: { now: () => Date.parse("2026-10-19T00:00:00.000Z") },
    Event,
    HTMLElement: class {},
    document: { activeElement: null, body: null },
    window: {
      // The first-visit banner opens after two frames and idle; the stub runs the callbacks at once.
      requestAnimationFrame: (callback: () => void) => {
        callback();
        return 1;
      },
      cancelAnimationFrame() {},
      requestIdleCallback: (callback: () => void) => {
        callback();
        return 1;
      },
      cancelIdleCallback() {},
      addEventListener(type: string, listener: () => void) {
        listeners.set(type, listener);
      },
      removeEventListener() {},
      dispatchEvent(event: Event) {
        events.push(event.type);
      },
    },
  });
  const component = part === "ui" ? exports.ConsentBannerUi : exports.ConsentBanner;
  assert.ok(component);
  const tree = component({ classes: { primary: "primary" }, reopen: true, opener: null });
  for (const effect of effects) effect();
  return { tree, changes, events, writes, listeners, consentListeners };
}

/** The banner request the trigger stored by its last state update (updaters applied to null). */
function lastRequest(changes: { slot: number; value: unknown }[]): unknown {
  const last = changes.filter((change) => change.slot === 0).at(-1)?.value;
  const request = typeof last === "function" ? (last as (current: unknown) => unknown)(null) : last;
  // The component runs in another realm: compare plain data, not prototypes.
  return request === undefined ? undefined : JSON.parse(JSON.stringify(request));
}

function buttons(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(buttons);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [...(node.type === "button" ? [node] : []), ...buttons(node.props.children)];
}

test("enabled banner reopens stale opt-in while OFF preserves existing marketing consent", () => {
  const stale = {
    version: 3,
    analytics: true,
    marketing: true,
    updatedAt: "2025-01-01T00:00:00.000Z",
  };
  // The lazy trigger requests the banner chunk only when analytics is built in.
  assert.deepEqual(lastRequest(render(true, stale, false, false, "trigger").changes), {
    reopen: false,
    opener: null,
  });
  assert.deepEqual(render(false, stale, false, false, "trigger").changes, []);
  // A fresh opt-in stored under the current policy keeps the banner closed (no re-prompt loop);
  // the harness clock is 2026-10-19T00:00:00Z.
  const fresh = { ...stale, updatedAt: "2026-10-18T00:00:00.000Z" };
  assert.deepEqual(render(true, fresh, false, false, "trigger").changes, []);
});

test("trigger requests the banner on a first visit, a footer click and a storage clear", () => {
  const firstVisit = render(false, null, false, false, "trigger");
  assert.deepEqual(lastRequest(firstVisit.changes), { reopen: false, opener: null });

  const granted = { version: 3, analytics: true, marketing: true, updatedAt: "" };
  const returning = render(false, granted, false, false, "trigger");
  assert.deepEqual(returning.changes, [], "a stored choice needs no banner");
  returning.listeners.get("pv:consent:open")?.();
  assert.deepEqual(lastRequest(returning.changes), { reopen: true, opener: null });

  const cleared = render(false, granted, false, false, "trigger");
  for (const listener of cleared.consentListeners) listener(granted);
  assert.deepEqual(cleared.changes, [], "a valid change keeps the banner closed");
  for (const listener of cleared.consentListeners) listener(null);
  assert.deepEqual(lastRequest(cleared.changes), { reopen: false, opener: null });
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
