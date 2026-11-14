import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { supportResponseTime } from "../../config/commerce.ts";
import { pageReviewed } from "../../config/content-dates.ts";
import { site } from "../../config/site.ts";
import { accesibilidadCopy as copy, longDate } from "../../content/es/legal/accesibilidad.ts";
import { COPY_RULES } from "./copy-language.test.ts";

const strings = JSON.stringify([
  copy.intro,
  copy.commitment,
  copy.verification,
  copy.limitations,
  copy.barriers,
  copy.eaa,
]);

test("accessibility statement facts come from config, not from the copy", () => {
  assert.equal(copy.contactEmail, site.supportEmail);
  assert.equal(copy.responseTime, supportResponseTime);
  assert.equal(copy.reviewedAt, longDate(pageReviewed.accessibility));
  assert.equal(longDate("2026-11-14"), "14 de noviembre de 2026");
});

test("accessibility statement invents no periods, counts or conformance claims", () => {
  // The only numbers are WCAG/EAA identifiers, the 24 px target, the 200 % zoom and 320-1920 px.
  const numbers = strings.match(/\d+(?:\.\d+)*/g) ?? [];
  const allowed = new Set(["2.2", "2.0", "2.1", "24", "200", "320", "1920", "2019", "882"]);
  for (const number of numbers) assert.ok(allowed.has(number), `unexpected figure ${number}`);
  assert.doesNotMatch(strings, /\b(cumple|conforme|certificad[oa]) (totalmente|plenamente)\b/i);
  assert.match(copy.commitment.join(" "), /no declaramos que el sitio cumpla/);
  assert.doesNotMatch(copy.eaa, /\b(estamos exentos|no nos alcanza|nos alcanza plenamente)\b/i);
  assert.doesNotMatch(copy.eaa, /\bel titular\b/i);
});

test("accessibility statement uses tú and the shared copy rules", () => {
  for (const [rule, patterns] of Object.entries(COPY_RULES)) {
    for (const pattern of patterns) assert.doesNotMatch(strings, pattern, rule);
  }
  assert.match(strings, /\bescríbenos\b/);
  assert.match(strings, /\bTodavía no\b/);
});

// checks[i] -> the spec that backs it and a pattern proving the check exists there.
const backing: ReadonlyArray<readonly [string, RegExp]> = [
  ["tests/browser/a11y.spec.ts", /wcag22aa/],
  ["tests/browser/a11y.spec.ts", /a\[data-checkout\]/],
  ["tests/browser/text-zoom.spec.ts", /font-size: 200% !important/],
  ["tests/browser/responsive.spec.ts", /widths = \[320, 390, 768, 1024, 1440, 1920\]/],
  ["tests/browser/smoke.spec.ts", /one h1 and complete landmarks/],
  ["tests/browser/motion.spec.ts", /reveal elements are visible immediately under reduced motion/],
];
// Specs whose route list must include the statement (the others are not route-based).
const routeSpecs = [
  "tests/browser/a11y.spec.ts",
  "tests/browser/text-zoom.spec.ts",
  "tests/browser/responsive.spec.ts",
  "tests/browser/smoke.spec.ts",
];

test("accessibility statement cites only checks that exist in tests/browser", () => {
  assert.equal(backing.length, copy.verification.checks.length);
  for (const [file, pattern] of backing) assert.match(readFileSync(file, "utf8"), pattern, file);
  for (const file of routeSpecs)
    assert.match(readFileSync(file, "utf8"), /"\/accesibilidad\/"/, file);
});
