import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { legalRoutes, seller } from "../../content/es/legal/seller.ts";

/**
 * The Titular's own mailbox (`seller.legalEmail`) is a secondary channel for the legal pages only.
 * Commercial pages, the footer, soporte and config/site.ts show `supportEmail` alone
 * (scripts/check-rendered.ts checks the exported HTML).
 */
const toPosix = (file: string): string => file.split("\\").join("/");

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (/\.(ts|tsx|mjs|js|json|md)$/.test(entry)) out.push(toPosix(full));
  }
  return out;
}

const scanned = ["src", "content", "config"].flatMap(files);
const legalPageFiles = new Set(legalRoutes.map((route) => `src/app${route}page.tsx`));

test("the personal email literal lives only in the seller module", () => {
  assert.notEqual(seller.legalEmail, seller.supportEmail);
  for (const file of scanned) {
    if (file === "content/es/legal/seller.ts") continue;
    assert.ok(!readFileSync(file, "utf8").includes(seller.legalEmail), `${file} contains the personal email`);
  }
});

test("only legal route files render seller.legalEmail", () => {
  for (const file of scanned) {
    if (file === "content/es/legal/seller.ts" || legalPageFiles.has(file)) continue;
    assert.doesNotMatch(readFileSync(file, "utf8"), /\blegalEmail\b/, `${file} references seller.legalEmail`);
  }
  for (const file of legalPageFiles) assert.ok(scanned.includes(file), `missing legal route ${file}`);
});
