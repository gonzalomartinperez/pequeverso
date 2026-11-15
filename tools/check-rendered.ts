// Structural checks over every exported page (or, with SITE_DIR, every prerendered page of an
// assembled standalone site; tools/lib/site-layout.ts): landmarks, single visible h1, language,
// canonical, skip link, resolvable in-page anchors, no placeholder or retired text, and the
// local-currency wording next to every USD price, and the Titular's personal mailbox only on the
// legal routes. A site's bare `_global-error` shell gets only the text rules (not landmarks/h1).
import { readFileSync } from "node:fs";
import { legalRoutes, seller } from "../content/es/legal/seller.ts";
import {
  layoutFor,
  listErrorShells,
  listRoutePages,
  missingLayout,
  type Page,
} from "./lib/site-layout.ts";

const layout = layoutFor(process.cwd(), process.env);
const missing = missingLayout(layout, "check-rendered");
if (missing) {
  console.error(missing);
  process.exit(1);
}

const pages = listRoutePages(layout);
const shells = listErrorShells(layout);

const forbiddenText = ["Trazos y Sonidos", "lorem ipsum"];
/** Retired operator brand and domain (one pattern for both; owner decisions 2026-09-20 and OD-53). */
const retiredOperator = /digital\s*products\s*team/i;
/** A page that shows a USD price must also explain that Hotmart charges in local currency. */
const usdPrice = "US$";
const localCurrencyWording = "moneda local";
const placeholderPattern = /\[\[[A-Z0-9_]+\]\]/;
const count = (html: string, pattern: RegExp): number => (html.match(pattern) ?? []).length;

/** One structural rule: the error messages it finds in a page (empty when the page passes). */
type Rule = (html: string, name: string) => string[];

const headingErrors: Rule = (html) => {
  const expected = html.includes("data-offer-root") ? 2 : 1;
  const found = count(html, /<h1[\s>]/g);
  return found === expected ? [] : [`expected ${expected} h1, found ${found}`];
};
const languageErrors: Rule = (html) =>
  /<html[^>]*\slang="es"/.test(html) ? [] : ['missing lang="es"'];
const canonicalErrors: Rule = (html, name) => {
  const isErrorPage = name.startsWith("404") || name.startsWith("_not-found");
  return isErrorPage || /<link rel="canonical"/.test(html) ? [] : ["missing canonical"];
};
const landmarkErrors: Rule = (html) => [
  ...["<main", "<header", "<footer"]
    .filter((landmark) => !html.includes(landmark))
    .map((landmark) => `missing ${landmark}>`),
  ...(html.includes('href="#contenido"') ? [] : ["missing skip link"]),
];
const textErrors: Rule = (html) => [
  ...forbiddenText.filter((text) => html.includes(text)).map((text) => `contains "${text}"`),
  ...(retiredOperator.test(html) ? ["names the retired operator brand or domain"] : []),
  ...(placeholderPattern.test(html) ? ["contains an owner placeholder"] : []),
];
const emailErrors: Rule = (html, name) => {
  const route = `/${name.replace(/(^|\/)index\.html$/, "$1")}`;
  const onLegalPage = (legalRoutes as readonly string[]).includes(route);
  return html.includes(seller.legalEmail) && !onLegalPage
    ? ["shows the Titular's personal email outside the legal pages"]
    : [];
};
const priceErrors: Rule = (html) =>
  html.includes(usdPrice) && !html.includes(localCurrencyWording)
    ? [`shows a ${usdPrice} price without the "${localCurrencyWording}" wording`]
    : [];
const anchorErrors: Rule = (html) => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  return [...html.matchAll(/href="#([^"]+)"/g)]
    .filter((match) => !ids.has(match[1] ?? ""))
    .map((match) => `anchor #${match[1]} has no target`);
};
const rules: readonly Rule[] = [
  headingErrors,
  languageErrors,
  canonicalErrors,
  landmarkErrors,
  textErrors,
  emailErrors,
  priceErrors,
  anchorErrors,
];

/** The bare global-error shell has no landmarks, h1 or canonical, but its text must stay clean. */
const shellRules: readonly Rule[] = [languageErrors, textErrors, emailErrors, priceErrors];

function check({ file, name }: Page, applied: readonly Rule[] = rules): string[] {
  const html = readFileSync(file, "utf8");
  return applied.flatMap((rule) => rule(html, name)).map((error) => `${name}: ${error}`);
}

const failures = [
  ...pages.flatMap((page) => check(page)),
  ...shells.flatMap((shell) => check(shell, shellRules)),
];
if (failures.length) {
  for (const failure of failures) console.error(`✖ ${failure}`);
  process.exit(1);
}
console.log(`check-rendered: ${pages.length} pages pass structural checks`);
