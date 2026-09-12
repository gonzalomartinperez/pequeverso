// @ts-check
// Renders config/edge-rules.json to out/.htaccess (static target) and to
// docs/generated/htaccess.txt (golden copy checked by tests/unit).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEdgeRules, toHtaccess } from "./lib/edge-rules.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = loadEdgeRules();
const content = toHtaccess(rules);

const golden = resolve(root, "docs/generated/htaccess.txt");
mkdirSync(dirname(golden), { recursive: true });
writeFileSync(golden, content);

const outDir = resolve(root, "out");
if (existsSync(outDir)) {
  writeFileSync(resolve(outDir, ".htaccess"), content);
  console.log("gen-htaccess: wrote out/.htaccess");
} else {
  console.log("gen-htaccess: out/ not present (standalone build?) — golden copy updated only");
}
