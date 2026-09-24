import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { formatUsd, guaranteeDays } from "../../config/commerce.ts";

const roots = ["content", "src/app", "src/features/landing", "src/products"];
const forbiddenLiterals = ["Trazos y Sonidos", "[[PLACEHOLDER]]"];
const forbiddenClaims = [
  /garantiza(mos)?\s+que\s+.*aprend/i,
  /aprender[áa]\s+a\s+leer\s+en\s+\d+/i,
  /resultados?\s+garantizad/i,
  /m[ée]todo\s+(probado|cient[ií]fico)/i,
  /lee(r[áa])?\s+en\s+\d+\s+d[ií]as/i,
];
const placeholderPattern = /\[\[[A-Z0-9_]+\]\]/;
const lineBreak = /\r?\n/;

/** Retired operator brand: the site is Pequeverso only (owner decision, 2026-09-20). */
const retiredOperator = ["Digital Products Team", "digitalproductsteam"];
const retiredOperatorRoots = ["src", "content", "config"];

function sourceFiles(dir: string, pattern = /\.(ts|tsx)$/): string[] {
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (pattern.test(entry)) files.push(full);
    }
  };
  try {
    walk(dir);
  } catch {
    return files;
  }
  return files;
}

const files = roots.flatMap((dir) => sourceFiles(dir));
const read = (file: string): string => readFileSync(file, "utf8");
const toPosix = (file: string): string => file.split("\\").join("/");
const isSellerModule = (file: string): boolean => toPosix(file).endsWith("content/es/legal/seller.ts");
const isQuestion = (line: string): boolean => /[¿?]/.test(line);

test("pre-purchase copy (home, principal landing) never offers paid extras", () => {
  const prePurchase = [
    "content/es/home.ts",
    "content/es/products/grafismo-fonetico/copy.ts",
    "content/es/products/grafismo-fonetico/faq.ts",
    "src/app/page.tsx",
    "src/features/landing/CoreLanding.tsx",
  ];
  for (const file of prePurchase) {
    const text = read(file);
    assert.ok(!/Imprime y Juega/i.test(text), `${file} mentions the post-purchase pack`);
    assert.ok(!/opcional/i.test(text), `${file} uses "opcional" offer wording`);
  }
});

test("customer-facing sources never use the retired product name or generic placeholders", () => {
  for (const file of files) {
    if (isSellerModule(file)) continue;
    const text = read(file);
    for (const literal of forbiddenLiterals) {
      assert.ok(!text.includes(literal), `${relative(".", file)} contains "${literal}"`);
    }
  }
});

test("no trace of the retired operator brand in code, content or config", () => {
  const scanned = retiredOperatorRoots.flatMap((dir) => sourceFiles(dir, /\.(ts|tsx|mjs|js|json|css|md)$/));
  assert.ok(scanned.length > 0, "expected files to scan");
  for (const file of scanned) {
    const text = read(file).toLowerCase();
    for (const literal of retiredOperator) {
      assert.ok(!text.includes(literal.toLowerCase()), `${relative(".", file)} contains "${literal}"`);
    }
  }
});

test("copy never promises learning outcomes", () => {
  for (const file of files) {
    read(file)
      .split(lineBreak)
      .forEach((line, index) => {
        if (isQuestion(line)) return;
        for (const pattern of forbiddenClaims) {
          assert.ok(!pattern.test(line), `${relative(".", file)}:${index + 1} matches ${pattern}`);
        }
      });
  }
});

test("owner placeholders live only in the legal seller module", () => {
  for (const file of files) {
    if (isSellerModule(file)) continue;
    assert.doesNotMatch(
      read(file),
      placeholderPattern,
      `${relative(".", file)} contains a placeholder token`,
    );
  }
});

test("guarantee days in copy match the configured value", () => {
  const mentions = files.flatMap((file) =>
    [...read(file).matchAll(/(\d+)\s+d[ií]as\s+(?:de\s+)?garant/gi)].map((match) => ({
      file,
      days: Number(match[1]),
    })),
  );
  const configured = files.filter((file) => read(file).includes("guaranteeDays"));
  assert.ok(mentions.length + configured.length > 0, "guarantee copy is expected somewhere");
  for (const { file, days } of mentions) {
    assert.equal(days, guaranteeDays, `${relative(".", file)} states ${days} days`);
  }
});

test("price literals in copy use the shared formatter", () => {
  const prices = files.flatMap((file) =>
    [...read(file).matchAll(/US\$\s?(\d+[.,]\d{2})/g)].map((match) => ({
      file,
      raw: match[0],
      value: Number((match[1] ?? "").replace(",", ".")),
    })),
  );
  for (const { file, raw, value } of prices) {
    assert.equal(raw.replace(/\s/g, ""), formatUsd(value), `${relative(".", file)} hard-codes ${raw}`);
  }
});

test("price literals never use a decimal point (customer-facing prices read US$14,99)", () => {
  assert.equal(formatUsd(14.99), "US$14,99");
  for (const file of files) {
    assert.doesNotMatch(read(file), /US\$\s?\d+\.\d{2}/, `${relative(".", file)} uses a decimal point`);
  }
});
