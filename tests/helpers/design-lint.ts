import { parseSync, Visitor } from "oxc-parser";
import postcss from "postcss";

export interface Finding {
  rule: string;
  file: string;
  value: string;
}
// Generated theme destinations only; components must consume semantic tokens.
export const ALLOWED_LITERAL_FILES = [
  "src/app/globals.css",
  "src/app/theme.css",
  "src/shared/styles/theme.css",
];
const prices = [
  "src/views/product/core/buy-box.tsx",
  "src/views/product/core/includes.tsx",
  "src/views/product/offer/offer-price.tsx",
  "src/features/assistant/presentation/products.tsx",
];
const color = /#[\da-f]{3,8}\b|\b(?:oklch|rgba?|hsla?)\(/gi;
const coral =
  /(?:^|:)(?:[\w-]*coral[\w/-]*|(?:bg|text|border|from|via|to|ring|shadow|fill|stroke)-primary(?:[\w/-]*))\b|--(?:primary(?:-[\w-]+)?|pv-coral[\w-]*)\b/;
const spacing =
  /(?:^|:)-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[\w]+)?)-\[[^\]]*\d(?:\.\d+)?px[^\]]*\]/;

/** Parse strings rather than comments; includes CVA tables, templates and inline styles. */
export function strings(file: string, source: string): string[] {
  const parsed = parseSync(file, source);
  if (parsed.errors.length) throw new Error(`${file}: invalid scanner input`);
  const values: string[] = [];
  new Visitor({
    Literal(node) {
      if (typeof node.value === "string") values.push(node.value);
    },
    TemplateElement(node) {
      values.push(node.value.cooked ?? node.value.raw);
    },
  }).visit(parsed.program);
  return values;
}

const flat = (value: string) => value.replace(/\s+/g, " ");
function allowedProperty(property: string): boolean {
  return ["transform", "opacity", "none"].includes(property);
}

/** Pure design scanner. CSS uses PostCSS so nested keyframes and multiline declarations count. */
export function designFindings(file: string, source: string): Finding[] {
  const found: Finding[] = [];
  const add = (rule: string, value: string) => found.push({ rule, file, value });
  if (file.endsWith(".css")) {
    const root = postcss.parse(source);
    if (!ALLOWED_LITERAL_FILES.includes(file))
      root.walkDecls((decl) => {
        if (color.test(decl.value)) add("color-literal", `${decl.prop}: ${flat(decl.value)}`);
        color.lastIndex = 0;
      });
    root.walkDecls((decl) => {
      if (/^transition(?:-property)?$/.test(decl.prop)) {
        for (const part of postcss.list.comma(decl.value)) {
          const property = part.trim().split(/\s+/)[0] ?? "all";
          // An omitted property defaults to all, including duration-only shorthand.
          const actual = /^(?:[\d.]|var\(|ease|linear)/.test(property) ? "all" : property;
          if (actual === "all") add("transition-all", `${decl.prop}: ${flat(decl.value)}`);
          else if (!allowedProperty(actual))
            add("animated-property", `${decl.prop}: ${flat(decl.value)}`);
        }
      }
      let parent: postcss.Container | postcss.Document | undefined = decl.parent;
      while (parent) {
        const rule = parent as postcss.AtRule;
        if (rule.type === "atrule" && /keyframes$/.test(rule.name)) {
          if (!allowedProperty(decl.prop) && decl.prop !== "animation-timing-function")
            add(
              "animated-property",
              `@${rule.name} ${rule.params}: ${decl.prop}: ${flat(decl.value)}`,
            );
          break;
        }
        parent = parent.parent as typeof parent;
      }
    });
    return found;
  }
  for (const value of strings(file, source)) {
    if (!ALLOWED_LITERAL_FILES.includes(file))
      for (const match of value.matchAll(color)) add("color-literal", match[0]);
    for (const token of value.split(/\s+/)) {
      if (
        coral.test(token) &&
        !/^src\/shared\/ui\/button[^/]*\.[tj]sx?$/.test(file) &&
        !file.startsWith("src/features/commerce/presentation/") &&
        !prices.includes(file)
      )
        add("coral", token);
      if (spacing.test(token)) add("spacing-radius", token);
      const transition = token.match(/(?:^|:)transition(?:-([^\s]+))?$/);
      if (!transition) continue;
      const property = transition[1];
      if (property === "all") add("transition-all", token);
      else if (!property || !["none", "transform", "opacity"].includes(property)) {
        const properties = property?.startsWith("[")
          ? property.slice(1, -1).split(",")
          : [property];
        if (properties.some((item) => !item || !allowedProperty(item)))
          add("animated-property", token);
      }
    }
  }
  return found;
}
