// Renders config/edge-rules.json to out/.htaccess (static target, with affiliate links resolved
// from the build environment) and to docs/generated/htaccess.txt (golden copy checked by
// tests/unit, always rendered without environment values so no affiliate link is committed).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEdgeRules, toHtaccess } from "./lib/edge-rules.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const content = toHtaccess(loadEdgeRules());

const golden = resolve(root, "docs/generated/htaccess.txt");
mkdirSync(dirname(golden), { recursive: true });
writeFileSync(golden, toHtaccess(loadEdgeRules(undefined, {})));

const outDir = resolve(root, "out");
if (existsSync(outDir)) {
  writeFileSync(resolve(outDir, ".htaccess"), content);
  console.log("gen-htaccess: wrote out/.htaccess");
} else {
  console.log("gen-htaccess: out/ not present (standalone build?) — golden copy updated only");
}
