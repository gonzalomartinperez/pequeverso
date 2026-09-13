// Structural checks over every exported page: landmarks, single visible h1, language,
// canonical, skip link, resolvable in-page anchors and no placeholder or retired text.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
if (!existsSync(root)) {
  console.error("check-rendered: out/ not found; run `npm run build` first");
  process.exit(1);
}

const pages = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry === "index.html" || entry === "404.html") pages.push(full);
  }
};
walk(root);

const forbiddenText = ["Trazos y Sonidos", "lorem ipsum"];
const placeholderPattern = /\[\[[A-Z0-9_]+\]\]/;
const count = (html, pattern) => (html.match(pattern) ?? []).length;

function check(page) {
  const html = readFileSync(page, "utf8");
  const name = relative(root, page).split("\\").join("/");
  const errors = [];
  const isOfferPage = html.includes("data-offer-root");
  const h1s = count(html, /<h1[\s>]/g);
  if (h1s !== (isOfferPage ? 2 : 1)) errors.push(`expected ${isOfferPage ? 2 : 1} h1, found ${h1s}`);
  if (!/<html[^>]*\slang="es"/.test(html)) errors.push('missing lang="es"');
  const isErrorPage = name.startsWith("404") || name.startsWith("_not-found");
  if (!isErrorPage && !/<link rel="canonical"/.test(html)) errors.push("missing canonical");
  for (const landmark of ["<main", "<header", "<footer"]) {
    if (!html.includes(landmark)) errors.push(`missing ${landmark}>`);
  }
  if (!html.includes('href="#contenido"')) errors.push("missing skip link");
  for (const text of forbiddenText) {
    if (html.includes(text)) errors.push(`contains "${text}"`);
  }
  if (placeholderPattern.test(html)) errors.push("contains an owner placeholder");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(match[1])) errors.push(`anchor #${match[1]} has no target`);
  }
  return errors.map((error) => `${name}: ${error}`);
}

const failures = pages.flatMap(check);
if (failures.length) {
  for (const failure of failures) console.error(`✖ ${failure}`);
  process.exit(1);
}
console.log(`check-rendered: ${pages.length} pages pass structural checks`);
