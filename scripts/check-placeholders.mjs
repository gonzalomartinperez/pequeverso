// @ts-check
// Legal/support pages ship with [[PLACEHOLDER]] tokens until the owner supplies the
// business details listed in docs/legal-checklist.md. Default mode reports them;
// --strict (used by the deploy workflow) fails so a launch cannot happen with
// placeholders in customer-facing content.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const strict = process.argv.includes("--strict");
const root = process.cwd();
const targets = [resolve(root, "content"), resolve(root, "src")];
const pattern = /\[\[[A-Z0-9_]+\]\]/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|md|mdx|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const found = new Map();
for (const dir of targets) {
  let stat;
  try {
    stat = statSync(dir);
  } catch {
    continue;
  }
  if (!stat.isDirectory()) continue;
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    const matches = text.match(pattern);
    if (matches) found.set(relative(root, file).split("\\").join("/"), [...new Set(matches)]);
  }
}

if (found.size === 0) {
  console.log("check-placeholders: no [[PLACEHOLDER]] tokens found");
  process.exit(0);
}
console.log(
  `check-placeholders: ${found.size} file(s) still contain placeholders (see docs/legal-checklist.md):`,
);
for (const [file, tokens] of found) console.log(`  ${file}: ${tokens.join(", ")}`);
if (strict) {
  console.error("check-placeholders: --strict → failing (launch gate)");
  process.exit(1);
}
