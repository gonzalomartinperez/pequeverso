import { parseSync, Visitor } from "oxc-parser";
import type { Finding } from "./design-lint.ts";
import { sourceModule, sourceTarget } from "./source-architecture.ts";

// Temporary exact-file exceptions: preserve the current compile-time feature gates and relay.
export const ENV_EXCEPTIONS: Record<string, string> = {
  "src/app/api/meta/events/route.standalone.ts":
    "Request-time CAPI options; extraction belongs to M4.",
  "src/views/legal/cookies-view.tsx": "Disclosure follows the analytics build flag.",
  "src/features/site-analytics/slot.tsx": "Compile-time removal and local fixture configuration.",
  "src/features/assistant/slot.tsx": "Compile-time removal and local fixture configuration.",
  "src/features/tracking/presentation/consent-banner.tsx":
    "Analytics consent controls follow the build flag.",
  "src/features/tracking/adapters/env.ts": "Existing static NEXT_PUBLIC reads for Next inlining.",
  "src/features/tracking/adapters/track.ts": "Development-only diagnostic branch.",
};
// The only composition file allowed to reach an adapter: the server-only Meta CAPI relay route.
export const ADAPTER_IMPORT_EXCEPTIONS: Record<string, string> = {
  "src/app/api/meta/events/route.standalone.ts":
    "src/features/tracking/adapters/server/meta-capi.ts",
};
export const SCRIPT_EXCEPTIONS: Record<string, string> = {
  "src/features/commerce/presentation/hotmart-widget-slot.tsx":
    "Loads the Hotmart sales-funnel widget script.",
  "src/features/tracking/presentation/tracking-scripts.tsx":
    "Renders ScriptSpec values whose hosts are declared in the tracking adapters.",
};
export const HTML_EXCEPTIONS: Record<string, string> = {
  "src/features/commerce/presentation/offer-mode-root.tsx":
    "Constant pre-hydration offer-mode script (docs/architecture.md).",
  "src/views/home-view.tsx": "Existing organization JSON-LD; serializer extraction is pending M3.",
  "src/views/product/core-landing-view.tsx":
    "Existing product JSON-LD; serializer extraction is pending M3.",
};

/** Syntax-aware guards: strings and comments cannot masquerade as executable code. */
export function guardFindings(file: string, source: string, raw = false): Finding[] {
  const parsed = parseSync(file, source);
  if (parsed.errors.length) throw new Error(`${file}: invalid guard input`);
  const found: Finding[] = [];
  const add = (rule: string, value: string) => found.push({ rule, file, value });
  const scriptAllowed =
    !raw && (file in SCRIPT_EXCEPTIONS || file.startsWith("src/features/tracking/adapters/"));
  const envAllowed =
    !raw &&
    (/^(?:config|tools|tests)\//.test(file) ||
      /^next\.config\./.test(file) ||
      file in ENV_EXCEPTIONS);
  const processNames = new Set(["process"]);
  const scripts = new Set(["script"]);
  for (const node of parsed.program.body)
    if (node.type === "ImportDeclaration") {
      const from = String(node.source.value);
      for (const specifier of node.specifiers) {
        if (from === "next/script") scripts.add(specifier.local.name);
        if (from === "node:process" || from === "process") {
          if (specifier.type === "ImportSpecifier") {
            if (specifier.imported.type === "Identifier" && specifier.imported.name === "env")
              add("env", "import env");
          } else processNames.add(specifier.local.name);
        }
      }
    }
  const isProcess = (node: { type: string }): boolean => {
    const n = node as {
      type: string;
      name?: string;
      object?: { name?: string };
      property?: { name?: string };
    };
    return (
      (n.type === "Identifier" && processNames.has(n.name ?? "")) ||
      (n.type === "MemberExpression" &&
        ["globalThis", "global", "window"].includes(n.object?.name ?? "") &&
        n.property?.name === "process")
    );
  };
  const named = (node: object): unknown => {
    const n = node as { type: string; name?: string; value?: unknown };
    return n.type === "Identifier" ? n.name : n.type === "Literal" ? n.value : null;
  };
  new Visitor({
    MemberExpression(node) {
      if (isProcess(node.object) && named(node.property) === "env") add("env", "process.env");
    },
    VariableDeclarator(node) {
      if (
        node.init &&
        isProcess(node.init) &&
        node.id.type === "ObjectPattern" &&
        node.id.properties.some((p) => p.type === "Property" && named(p.key) === "env")
      )
        add("env", "destructured process.env");
    },
    JSXAttribute(node) {
      if (node.name.type === "JSXIdentifier" && node.name.name === "dangerouslySetInnerHTML")
        add("unsafe-html", "dangerouslySetInnerHTML");
    },
    JSXOpeningElement(node) {
      if (scriptAllowed || node.name.type !== "JSXIdentifier" || !scripts.has(node.name.name))
        return;
      for (const attr of node.attributes) {
        if (attr.type === "JSXSpreadAttribute") add("script-host", "script spread props");
        else if (attr.name.type === "JSXIdentifier" && attr.name.name === "src") {
          // Only root-relative literals are local; everything else may hide an external host.
          const value = attr.value?.type === "Literal" ? String(attr.value.value) : null;
          if (value === null || !/^\/(?!\/)/.test(value)) add("script-host", "script src");
        }
      }
    },
    CallExpression(node) {
      if (scriptAllowed) return;
      const callee = node.callee;
      const method =
        callee.type === "MemberExpression"
          ? named(callee.property)
          : callee.type === "Identifier"
            ? callee.name
            : null;
      const first = node.arguments[0];
      const tag =
        first?.type === "Literal"
          ? first.value
          : first?.type === "TemplateLiteral" && first.expressions.length === 0
            ? first.quasis[0]?.value.cooked
            : null;
      if (method === "createElement" && String(tag).toLowerCase() === "script")
        add("script-host", "createElement(script)");
    },
  }).visit(parsed.program);
  const composition = /^src\/(?:app|views|shell)\//.test(file);
  if (composition)
    for (const { specifier } of sourceModule(file, source).imports) {
      const target = specifier === null ? null : sourceTarget(file, specifier);
      if (target && ADAPTER_IMPORT_EXCEPTIONS[file] === target && !raw) continue;
      if (target && /^src\/features\/(?:tracking|assistant)\/adapters\//.test(target))
        add("adapter-import", target);
    }
  return raw
    ? found
    : found.filter(
        (item) =>
          !(item.rule === "env" && envAllowed) &&
          !(item.rule === "unsafe-html" && file in HTML_EXCEPTIONS),
      );
}
