import type { Argument, Expression, JSXAttributeItem, VisitorObject } from "oxc-parser";
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
  "src/features/consent/presentation/consent-banner-ui.tsx":
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
  "src/shared/seo/json-ld-script.tsx":
    "The single JSON-LD emitter; jsonLd() escapes every < (M3-6, tests/unit/json-ld.test.ts).",
};

type Add = (rule: string, value: string) => void;
type Program = ReturnType<typeof parseSync>["program"];
type ImportDeclarationNode = Extract<Program["body"][number], { type: "ImportDeclaration" }>;
type ImportSpecifierNode = ImportDeclarationNode["specifiers"][number];

interface ImportNames {
  processNames: Set<string>;
  scripts: Set<string>;
}

/** Records one specifier of `node:process` / `process`: `env` imports are findings. */
function processSpecifier(specifier: ImportSpecifierNode, names: ImportNames, add: Add): void {
  if (specifier.type !== "ImportSpecifier") {
    names.processNames.add(specifier.local.name);
    return;
  }
  if (specifier.imported.type === "Identifier" && specifier.imported.name === "env")
    add("env", "import env");
}

/** Records the bindings of one import declaration. */
function declarationNames(node: ImportDeclarationNode, names: ImportNames, add: Add): void {
  const from = String(node.source.value);
  for (const specifier of node.specifiers) {
    if (from === "next/script") names.scripts.add(specifier.local.name);
    if (from === "node:process" || from === "process") processSpecifier(specifier, names, add);
  }
}

/** Local names bound to `process` and to `next/script`, plus `import { env }` findings. */
function importNames(program: Program, add: Add): ImportNames {
  const names: ImportNames = { processNames: new Set(["process"]), scripts: new Set(["script"]) };
  for (const node of program.body)
    if (node.type === "ImportDeclaration") declarationNames(node, names, add);
  return names;
}

function isProcess(node: { type: string }, processNames: Set<string>): boolean {
  const n = node as { type: string; name?: string };
  return (n.type === "Identifier" && processNames.has(n.name ?? "")) || isGlobalProcess(node);
}

/** `globalThis.process`, `global.process` and `window.process`. */
function isGlobalProcess(node: { type: string }): boolean {
  const n = node as { type: string; object?: { name?: string }; property?: { name?: string } };
  return (
    n.type === "MemberExpression" &&
    ["globalThis", "global", "window"].includes(n.object?.name ?? "") &&
    n.property?.name === "process"
  );
}

function named(node: object): unknown {
  const n = node as { type: string; name?: string; value?: unknown };
  return n.type === "Identifier" ? n.name : n.type === "Literal" ? n.value : null;
}

/** Finding of one attribute of a `<script>` element, if any. */
function scriptAttributeFinding(attr: JSXAttributeItem): string | null {
  if (attr.type === "JSXSpreadAttribute") return "script spread props";
  if (attr.name.type !== "JSXIdentifier" || attr.name.name !== "src") return null;
  // Only root-relative literals are local; everything else may hide an external host.
  const value = attr.value?.type === "Literal" ? String(attr.value.value) : null;
  return value === null || !/^\/(?!\/)/.test(value) ? "script src" : null;
}

/** First argument of a call when it is a static string, else null. */
function staticFirstArgument(first: Argument | undefined): unknown {
  if (first?.type === "Literal") return first.value;
  if (first?.type === "TemplateLiteral" && first.expressions.length === 0)
    return first.quasis[0]?.value.cooked;
  return null;
}

/** Called method name: `a.b()` and `b()` both give `b`. */
function calledMethod(callee: Expression): unknown {
  if (callee.type === "MemberExpression") return named(callee.property);
  return callee.type === "Identifier" ? callee.name : null;
}

/** Findings of the adapter imports of a composition file. */
function adapterImportFindings(file: string, source: string, raw: boolean, add: Add): void {
  if (!/^src\/(?:app|views|shell)\//.test(file)) return;
  for (const { specifier } of sourceModule(file, source).imports) {
    const target = specifier === null ? null : sourceTarget(file, specifier);
    if (target && ADAPTER_IMPORT_EXCEPTIONS[file] === target && !raw) continue;
    if (target && /^src\/features\/(?:tracking|assistant)\/adapters\//.test(target))
      add("adapter-import", target);
  }
}

/** Visitor callbacks of the guards. */
function guardVisitor(names: ImportNames, scriptAllowed: boolean, add: Add): VisitorObject {
  return {
    MemberExpression(node) {
      if (isProcess(node.object, names.processNames) && named(node.property) === "env")
        add("env", "process.env");
    },
    VariableDeclarator(node) {
      if (
        node.init &&
        isProcess(node.init, names.processNames) &&
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
      if (scriptAllowed || node.name.type !== "JSXIdentifier" || !names.scripts.has(node.name.name))
        return;
      for (const attr of node.attributes) {
        const finding = scriptAttributeFinding(attr);
        if (finding) add("script-host", finding);
      }
    },
    CallExpression(node) {
      if (scriptAllowed) return;
      const tag = staticFirstArgument(node.arguments[0]);
      if (calledMethod(node.callee) === "createElement" && String(tag).toLowerCase() === "script")
        add("script-host", "createElement(script)");
    },
  };
}

/** Syntax-aware guards: strings and comments cannot masquerade as executable code. */
export function guardFindings(file: string, source: string, raw = false): Finding[] {
  const parsed = parseSync(file, source);
  if (parsed.errors.length) throw new Error(`${file}: invalid guard input`);
  const found: Finding[] = [];
  const add: Add = (rule, value) => found.push({ rule, file, value });
  const scriptAllowed =
    !raw && (file in SCRIPT_EXCEPTIONS || file.startsWith("src/features/tracking/adapters/"));
  const names = importNames(parsed.program, add);
  new Visitor(guardVisitor(names, scriptAllowed, add)).visit(parsed.program);
  adapterImportFindings(file, source, raw, add);
  return raw ? found : found.filter((item) => !isExempt(file, item.rule));
}

/** Findings the exact-file exception maps (and config/tools/tests paths) excuse. */
function isExempt(file: string, rule: string): boolean {
  const envAllowed =
    /^(?:config|tools|tests)\//.test(file) ||
    /^next\.config\./.test(file) ||
    file in ENV_EXCEPTIONS;
  return (rule === "env" && envAllowed) || (rule === "unsafe-html" && file in HTML_EXCEPTIONS);
}
