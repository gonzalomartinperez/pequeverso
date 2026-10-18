import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { legalRoutes, seller } from "../../content/es/legal/seller.ts";

/**
 * The Titular's own mailbox (`seller.legalEmail`) is a secondary channel for the legal pages only.
 * Commercial pages, the footer, soporte and config/site.ts show `supportEmail` alone
 * (tools/check-rendered.ts checks the exported HTML).
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
const legalViewFiles = new Set([
  "src/views/legal/arrepentimiento-view.tsx",
  "src/views/legal/aviso-legal-view.tsx",
  "src/views/legal/compras-y-reembolsos-view.tsx",
  "src/views/legal/cookies-view.tsx",
  "src/views/legal/privacidad-view.tsx",
  "src/views/legal/terminos-view.tsx",
]);

function checkLegalEmailReference(file: string, source: string): void {
  if (file === "content/es/legal/seller.ts" || legalPageFiles.has(file) || legalViewFiles.has(file)) return;
  assert.doesNotMatch(source, /\blegalEmail\b/, `${file} references seller.legalEmail`);
}

test("the personal email literal lives only in the seller module", () => {
  assert.notEqual(seller.legalEmail, seller.supportEmail);
  for (const file of scanned) {
    if (file === "content/es/legal/seller.ts") continue;
    assert.ok(!readFileSync(file, "utf8").includes(seller.legalEmail), `${file} contains the personal email`);
  }
});

test("only legal routes and their exact legal views render seller.legalEmail", () => {
  for (const file of scanned) {
    checkLegalEmailReference(file, readFileSync(file, "utf8"));
  }
  for (const file of legalPageFiles) assert.ok(scanned.includes(file), `missing legal route ${file}`);
  for (const file of legalViewFiles) {
    assert.ok(scanned.includes(file), `missing legal view ${file}`);
    assert.match(readFileSync(file, "utf8"), /\blegalEmail\b/, `${file} is not a legal email consumer`);
  }
});

test("nonlegal views, shell and unlisted legal views cannot render the personal mailbox", () => {
  for (const file of [
    "src/views/home-view.tsx",
    "src/shell/footer.tsx",
    "src/views/legal/unlisted-view.tsx",
  ]) {
    assert.throws(() => checkLegalEmailReference(file, "<a>{seller.legalEmail}</a>"), {
      code: "ERR_ASSERTION",
    });
  }
});
