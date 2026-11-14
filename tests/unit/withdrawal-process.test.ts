import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  guaranteeDays,
  supportEmail,
  supportResponseTime,
  withdrawalPeriod,
  withdrawalRequestCodeHours,
  withdrawalWindows,
} from "../../config/commerce.ts";
import { consumerLaw } from "../../content/es/legal/argentina.ts";
import { consumerRights } from "../../content/es/legal/consumer-rights.ts";
import { seller } from "../../content/es/legal/seller.ts";
import { withdrawalCopy, withdrawalWindowList } from "../../content/es/legal/withdrawal.ts";
import { sourceFiles } from "../helpers/source-architecture.ts";

// M3-8 (PV-D2, OD-50): 7 days automatic in Hotmart; longer legal windows by email, manual refund.

const windowByCountry = (country: string) =>
  withdrawalWindows.find((window) => window.country === country);

test("config pins the guarantee and the OD-50 windows", () => {
  assert.equal(guaranteeDays, 7);
  assert.equal(windowByCountry("España")?.days, 14);
  assert.equal(windowByCountry("Unión Europea (resto de países)")?.days, 14);
  assert.equal(windowByCountry("Argentina")?.days, 10);
  assert.equal(windowByCountry("Chile")?.days, 10);
  assert.equal(withdrawalRequestCodeHours, 24);
  assert.equal(supportEmail, seller.supportEmail);
  assert.equal(supportResponseTime, seller.responseTime);
  assert.equal(
    new Set(withdrawalWindows.map((window) => window.country)).size,
    withdrawalWindows.length,
  );
});

test("every window is a consumer-rights row with the same period, and the reverse", () => {
  for (const window of withdrawalWindows) {
    const row = consumerRights.find((entry) => entry.country === window.country);
    assert.ok(row, `${window.country}: no consumer-rights row`);
    assert.equal(row.period, withdrawalPeriod(window));
  }
  for (const entry of consumerRights)
    if (entry.period !== null)
      assert.ok(windowByCountry(entry.country), `${entry.country}: period not in config`);
  assert.equal(consumerLaw.revocationDays, windowByCountry("Argentina")?.days);
  assert.equal(consumerLaw.revocationCodeHours, withdrawalRequestCodeHours);
});

test("the withdrawal copy lists every configured window and the guarantee", () => {
  assert.deepEqual(
    withdrawalWindowList,
    withdrawalWindows.map((window) => ({
      country: window.country,
      period: withdrawalPeriod(window),
    })),
  );
  assert.ok(withdrawalCopy.summary.includes(`${guaranteeDays} días`));
  assert.ok(withdrawalCopy.argentinaCode.includes(`${withdrawalRequestCodeHours} horas`));
  assert.ok(withdrawalCopy.answerTime.includes(supportResponseTime));
});

test("soporte, compras-y-reembolsos and arrepentimiento render the withdrawal windows", () => {
  const sources = {
    "content/es/soporte.ts": /withdrawalWindowList/,
    "src/views/legal/arrepentimiento-view.tsx": /withdrawalWindowList\.map/,
    "src/views/legal/compras-y-reembolsos-view.tsx": /withdrawalWindowList\.map/,
  };
  for (const [file, pattern] of Object.entries(sources))
    assert.match(readFileSync(file, "utf8"), pattern, file);
  assert.match(
    readFileSync("src/views/soporte-view.tsx", "utf8"),
    /copy\.withdrawal\.windows\.map/,
  );
});

// A period is "a number of days right after a guarantee or withdrawal word". Periods written as
// digits in copy must be the guarantee or a configured window; config-derived copy uses
// `${...}` and has no digits, so it never matches.
const allowedDays = new Set<number>([guaranteeDays, ...withdrawalWindows.map((w) => w.days)]);
const periodClaim =
  /(?:garant[ií]a|arrepentimiento|retracto|desistimiento|revocaci[oó]n|revocar|derecho de devoluci[oó]n)[^.\n]{0,50}?\b(\d+)\s+d[ií]as/giu;
// Reviewed statements about a different thing than a withdrawal period (Hotmart's EU minimum).
const reviewed = /Hotmart\s+exige\s+(?:al\s+menos|un\s+plazo\s+mínimo\s+de)\s+15\s+días/gu;

function unbackedPeriods(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").replace(reviewed, "");
  return [...clean.matchAll(periodClaim)]
    .filter((match) => !allowedDays.has(Number(match[1])))
    .map((match) => match[0]);
}

test("no copy states a guarantee or withdrawal period that config does not back", () => {
  const found: string[] = [];
  for (const file of ["content", "config", "src/views"].flatMap(sourceFiles))
    for (const claim of unbackedPeriods(readFileSync(file, "utf8")))
      found.push(`${file}: ${claim}`);
  assert.deepEqual(found, []);
});

test("negative fixtures: unbacked periods are caught, backed ones pass", () => {
  assert.deepEqual(unbackedPeriods("Tienes 30 días de garantía"), []);
  assert.equal(unbackedPeriods("La garantía es de 30 días").length, 1);
  assert.equal(unbackedPeriods("Derecho de arrepentimiento: 15 días corridos").length, 1);
  assert.equal(unbackedPeriods("el plazo de retracto es de\n 20 días").length, 1);
  assert.equal(unbackedPeriods("Desistimiento en Perú dentro de 8 días").length, 1);
  assert.deepEqual(unbackedPeriods("arrepentimiento dentro de 14 días naturales"), []);
  assert.deepEqual(unbackedPeriods("garantía de 7 días"), []);
  assert.deepEqual(unbackedPeriods("Hotmart exige al menos 15 días"), []);
});

test("a window missing from the legal copy is detected", () => {
  const rendered = withdrawalWindowList.map((window) => `${window.country}: ${window.period}`);
  const missing = (list: readonly string[]) =>
    withdrawalWindows.filter(
      (window) => !list.includes(`${window.country}: ${withdrawalPeriod(window)}`),
    );
  assert.deepEqual(missing(rendered), []);
  assert.equal(missing(rendered.slice(1)).length, 1);
});
