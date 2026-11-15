// Verifies that every internal href/src in the static export (or, with SITE_DIR, in an assembled
// standalone site; tools/lib/site-layout.ts) resolves to a file. Affiliate
// redirect paths (config/edge-rules.json `destinationEnv`) are answered by the edge, not a file.
import { readFileSync } from "node:fs";
import { affiliateSources } from "./lib/edge-rules.ts";
import { layoutFor, listPages, missingLayout, resolvesToFile } from "./lib/site-layout.ts";

const edgeRedirects = new Set(affiliateSources());

const layout = layoutFor(process.cwd(), process.env);
const missing = missingLayout(layout, "check-links");
if (missing) {
  console.error(missing);
  process.exit(1);
}
const pages = listPages(layout);

const resolves = (target: string): boolean => {
  const path = decodeURIComponent(target.split(/[?#]/)[0] ?? "");
  if (!path.startsWith("/") || edgeRedirects.has(path)) return true;
  return resolvesToFile(layout, path);
};

const broken = new Set<string>();
for (const { file, name } of pages) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const target = match[1];
    if (!target || target.startsWith("//")) continue;
    if (!resolves(target)) broken.add(`/${name} → ${target}`);
  }
}

if (broken.size) {
  for (const item of broken) console.error(`✖ ${item}`);
  process.exit(1);
}
console.log(`check-links: ${pages.length} pages, all internal references resolve`);
