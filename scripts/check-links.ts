// Verifies that every internal href/src in the static export resolves to a file.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const pages: string[] = [];
const walk = (dir: string): void => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".html")) pages.push(full);
  }
};
walk(root);

const resolvesToFile = (target: string): boolean => {
  const path = decodeURIComponent(target.split(/[?#]/)[0] ?? "");
  if (!path.startsWith("/")) return true;
  const candidates = [join(root, path), join(root, path, "index.html"), join(root, `${path}.html`)];
  return candidates.some((file) => existsSync(file) && statSync(file).isFile());
};

const broken = new Set<string>();
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const target = match[1];
    if (!target || target.startsWith("//")) continue;
    if (!resolvesToFile(target)) broken.add(`${page.slice(root.length)} → ${target}`);
  }
}

if (broken.size) {
  for (const item of broken) console.error(`✖ ${item}`);
  process.exit(1);
}
console.log(`check-links: ${pages.length} pages, all internal references resolve`);
