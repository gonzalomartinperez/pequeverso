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
  "src/shared/tokens/theme.css",
];
const PRICE_FILES = [
  "src/views/product/core/buy-box.tsx",
  "src/views/product/core/includes.tsx",
  "src/views/product/offer/offer-price.tsx",
  "src/features/assistant/presentation/products.tsx",
];
const COLOR_FN = /(?<![\w-])(?:oklch|oklab|lab|lch|hwb|rgba?|hsla?|color-mix|color)\(/gi;
// Hex colours only: not part of an identifier or URL fragment. A bare letters-only four-character
// string (`href="#cafe"`) is a fragment; the same digits inside a utility or value are a colour.
const HEX = /(?<![\w#&/-])#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\w-])/gi;
const CORAL_VAR = /(?:var\(\s*|\()--(?:primary|pv-coral|destructive)\b/;
const CORAL_UTILITY = /(?:^|-)(?:coral|primary|destructive)(?:-(?:foreground|hover))?(?:\/\S+)?$/;
const SPACING =
  /^-?(?:[pm][xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|[wh]|size|min-[wh]|max-[wh]|rounded(?:-[a-z]{1,2})?|scroll-[mp][xytrblse]?)-\[[^\]]*\d(?:px|rem|em)\b[^\]]*\]$/;
const LENGTH = /\d(?:px|rem|em)\b/;
const SPACING_PROP =
  /^(?:padding|margin|gap|row-gap|column-gap|border(?:-[a-z]+)*-radius)(?:-[a-z]+)?$/;
const SPACING_KEY =
  /^(?:padding|margin)(?:Top|Right|Bottom|Left|Inline|Block)?(?:Start|End)?$|^(?:gap|rowGap|columnGap)$|^border(?:\w*)Radius$/;
const COLOR_FILES = ALLOWED_LITERAL_FILES;

/** Full colour literals: function expressions are balanced to their closing parenthesis. */
function colorLiterals(text: string): string[] {
  const out = [...text.matchAll(HEX)]
    .filter((m) => !(m[0].length === 5 && !/\d/.test(m[0]) && text.trim() === m[0]))
    .map((m) => m[0]);
  for (const m of text.matchAll(COLOR_FN)) {
    let depth = 0;
    let end = m.index;
    for (; end < text.length; end++) {
      if (text[end] === "(") depth++;
      else if (text[end] === ")" && --depth === 0) break;
    }
    out.push(text.slice(m.index, end + 1));
  }
  return out;
}

/** Split a Tailwind token into its utility, ignoring variants and important markers. */
function utility(token: string): string {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    if ("[(".includes(token[i] ?? "")) depth++;
    else if ("])".includes(token[i] ?? "")) depth--;
    else if (token[i] === ":" && depth === 0) start = i + 1;
  }
  return token.slice(start).replace(/^!|!$/g, "");
}

const flat = (value: string) => value.replace(/\s+/g, " ");
const ANIMATABLE = ["transform", "opacity", "none"];

/** Transition value (CSS, inline style or arbitrary utility) to the rules it breaks. */
function transitionRules(value: string): string[] {
  const rules: string[] = [];
  for (const part of postcss.list.comma(value.replaceAll("_", " "))) {
    const property = part.trim().split(/\s+/)[0] ?? "all";
    // An omitted property defaults to all, including duration-only shorthand.
    const actual = /^(?:[\d.]|var\(|ease|linear)/.test(property) ? "all" : property;
    if (actual === "all") rules.push("transition-all");
    else if (!ANIMATABLE.includes(actual)) rules.push("animated-property");
  }
  return rules;
}

type Add = (rule: string, value: string) => void;

/** Class strings (JSX, CVA tables, templates and CSS `@apply`): every rule applies per token. */
function scanClasses(file: string, text: string, add: Add): void {
  if (!COLOR_FILES.includes(file))
    for (const literal of colorLiterals(text)) add("color-literal", literal);
  const coralOwner =
    COLOR_FILES.includes(file) ||
    /^src\/shared\/ui\/button[^/]*\.[tj]sx?$/.test(file) ||
    file.startsWith("src/features/commerce/presentation/") ||
    PRICE_FILES.includes(file) ||
    // The state gallery names every button and badge variant, coral included, by design (M2-11).
    file === "src/views/design-gallery-view.tsx";
  for (const token of text.split(/\s+/)) {
    const u = utility(token);
    if (!coralOwner && (CORAL_UTILITY.test(u) || CORAL_VAR.test(token) || /coral/.test(u)))
      add("coral", token);
    if (SPACING.test(u)) add("spacing-radius", token);
    const arbitrary = u.match(/^\[(?:-webkit-)?transition(?:-property)?:(.*)\]$/);
    const named = u.match(/^transition(?:-(.+))?$/);
    const arbitraryProperty = u.match(/^\[([a-z-]+):(.*)\]$/);
    if (
      arbitraryProperty &&
      SPACING_PROP.test(arbitraryProperty[1] ?? "") &&
      LENGTH.test(arbitraryProperty[2] ?? "")
    )
      add("spacing-radius", token);
    if (arbitrary) for (const rule of transitionRules(arbitrary[1] ?? "")) add(rule, token);
    else if (named) {
      const property = named[1];
      if (property === "all") add("transition-all", token);
      else if (
        property &&
        property !== "none" &&
        !/^\[?(?:transform|opacity)(?:,(?:transform|opacity))*\]?$/.test(property)
      )
        add("animated-property", token);
      else if (!property) add("animated-property", token);
    }
  }
}

/** Pure design scanner. CSS uses PostCSS so nested keyframes and multiline declarations count. */
export function designFindings(file: string, source: string): Finding[] {
  const found: Finding[] = [];
  const add: Add = (rule, value) => found.push({ rule, file, value });
  const allowed = COLOR_FILES.includes(file);
  if (file.endsWith(".css")) {
    const root = postcss.parse(source);
    root.walkAtRules("apply", (rule) => scanClasses(file, rule.params, add));
    root.walkDecls((decl) => {
      const text = `${decl.prop}: ${flat(decl.value)}`;
      if (!allowed) {
        if (colorLiterals(decl.value).length) add("color-literal", text);
        if (CORAL_VAR.test(decl.value) || /^--(?:primary|pv-coral|destructive)/.test(decl.prop))
          add("coral", text);
        if (SPACING_PROP.test(decl.prop) && LENGTH.test(decl.value)) add("spacing-radius", text);
      }
      if (/^(?:-webkit-)?transition(?:-property)?$/.test(decl.prop))
        for (const rule of transitionRules(decl.value)) add(rule, text);
      let parent: postcss.Container | postcss.Document | undefined = decl.parent;
      while (parent) {
        const rule = parent as postcss.AtRule;
        if (rule.type === "atrule" && /keyframes$/.test(rule.name)) {
          if (!ANIMATABLE.includes(decl.prop) && decl.prop !== "animation-timing-function")
            add("animated-property", `@${rule.name} ${rule.params}: ${text}`);
          break;
        }
        parent = parent.parent as typeof parent;
      }
    });
    return found;
  }
  const parsed = parseSync(file, source);
  if (parsed.errors.length) throw new Error(`${file}: invalid scanner input`);
  new Visitor({
    Literal(node) {
      if (typeof node.value === "string") scanClasses(file, node.value, add);
    },
    TemplateElement(node) {
      scanClasses(file, node.value.cooked ?? node.value.raw, add);
    },
    Property(node) {
      const key =
        node.key.type === "Identifier"
          ? node.key.name
          : node.key.type === "Literal" && typeof node.key.value === "string"
            ? node.key.value
            : null;
      const camel = key?.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      const signed = node.value.type === "UnaryExpression" ? node.value : null;
      const inner = signed?.operator === "-" || signed?.operator === "+" ? signed.argument : null;
      const value =
        node.value.type === "Literal"
          ? node.value.value
          : inner?.type === "Literal" && typeof inner.value === "number"
            ? (signed?.operator === "-" ? -1 : 1) * inner.value
            : null;
      if (!key || value === null) return;
      if (
        SPACING_KEY.test(camel ?? key) &&
        (typeof value === "number" ? value !== 0 : LENGTH.test(String(value)))
      )
        add("spacing-radius", `${key}: ${value}`);
      if (/^transition(?:Property)?$/.test(key) || key === "WebkitTransition")
        for (const rule of transitionRules(String(value))) add(rule, `${key}: ${value}`);
    },
  }).visit(parsed.program);
  return found;
}
