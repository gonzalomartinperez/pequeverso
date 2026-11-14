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
  "src/features/tracking/presentation/tracking-scripts.tsx":
    "Renders ScriptSpec values whose hosts are declared in the tracking adapters.",
};
export const HTML_EXCEPTIONS: Record<string, string> = {
  "src/views/home-view.tsx": "Existing organization JSON-LD; serializer extraction is pending M3.",
  "src/views/product/core-landing-view.tsx":
    "Existing product JSON-LD; serializer extraction is pending M3.",
};

/** Syntax-aware guards: strings and comments cannot masquerade as executable code. */
export function guardFindings(file: string, source: string): Finding[] {
  const parsed = parseSync(file, source);
  if (parsed.errors.length) throw new Error(`${file}: invalid guard input`);
  const found: Finding[] = [];
  const add = (rule: string, value: string) => found.push({ rule, file, value });
  const scriptAllowed =
    file in SCRIPT_EXCEPTIONS ||
    file.startsWith("src/features/tracking/adapters/") ||
    file === "src/features/commerce/presentation/hotmart-widget-slot.tsx";
  const scripts = new Set(["script"]);
  for (const node of parsed.program.body)
    if (node.type === "ImportDeclaration" && node.source.value === "next/script")
      for (const specifier of node.specifiers) scripts.add(specifier.local.name);
  new Visitor({
    MemberExpression(node) {
      const property =
        node.property.type === "Identifier"
          ? node.property.name
          : node.property.type === "Literal"
            ? node.property.value
            : null;
      if (
        node.object.type === "Identifier" &&
        node.object.name === "process" &&
        property === "env" &&
        !/^(?:config|tools|tests)\//.test(file) &&
        !/^next\.config\./.test(file) &&
        !ENV_EXCEPTIONS[file]
      )
        add("env", "process.env");
    },
    JSXAttribute(node) {
      if (
        node.name.type === "JSXIdentifier" &&
        node.name.name === "dangerouslySetInnerHTML" &&
        ![
          "src/views/seo/json-ld.tsx",
          "src/features/commerce/presentation/offer-mode-root.tsx",
        ].includes(file) &&
        !HTML_EXCEPTIONS[file]
      )
        add("unsafe-html", "dangerouslySetInnerHTML");
    },
    JSXOpeningElement(node) {
      if (scriptAllowed || node.name.type !== "JSXIdentifier" || !scripts.has(node.name.name))
        return;
      for (const attr of node.attributes)
        if (
          attr.type === "JSXAttribute" &&
          attr.name.type === "JSXIdentifier" &&
          attr.name.name === "src"
        ) {
          // Dynamic sources also require review; an identifier can hide an external host.
          if (attr.value?.type !== "Literal" || /^https:\/\//.test(String(attr.value.value)))
            add("script-host", "script src");
        }
    },
    CallExpression(node) {
      if (scriptAllowed || node.callee.type !== "MemberExpression") return;
      const callee = node.callee;
      if (
        callee.object.type === "Identifier" &&
        callee.object.name === "document" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "createElement" &&
        node.arguments[0]?.type === "Literal" &&
        node.arguments[0].value === "script"
      )
        add("script-host", "document.createElement(script)");
    },
  }).visit(parsed.program);
  if (/^src\/(?:app|views|shell)\//.test(file))
    for (const { specifier } of sourceModule(file, source).imports) {
      const target = specifier === null ? null : sourceTarget(file, specifier);
      if (target && ADAPTER_IMPORT_EXCEPTIONS[file] === target) continue;
      if (target && /^src\/features\/(?:tracking|assistant)\/adapters\//.test(target))
        add("adapter-import", target);
    }
  return found;
}
