import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  guaranteeDays,
  supportResponseTime,
  withdrawalPeriod,
  withdrawalRequestCodeHours,
  withdrawalWindows,
} from "../../config/commerce.ts";
import { site } from "../../config/site.ts";
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
  assert.equal(site.supportEmail, seller.supportEmail);
  assert.equal(site.supportEmail, seller.privacyEmail);
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
    "content/es/soporte.ts": /windows: withdrawalWindowList/,
    "src/views/legal/arrepentimiento-view.tsx": /<WithdrawalWindowsTable/,
    "src/views/legal/compras-y-reembolsos-view.tsx": /<WithdrawalWindowsTable/,
    "src/views/legal/withdrawal-windows.tsx": /withdrawalWindowList\.map/,
  };
  for (const [file, pattern] of Object.entries(sources))
    assert.match(readFileSync(file, "utf8"), pattern, file);
  assert.match(
    readFileSync("src/views/soporte-view.tsx", "utf8"),
    /copy\.withdrawal\.windows\.map/,
  );
});

// A period claim is a quantity (digits or a number word) plus a unit (días, semanas, meses) in a
// sentence that also names a guarantee or withdrawal word (garantía, arrepentimiento, retracto,
// desistimiento, revocación, devolución, reembolso), in either order. Config-derived copy uses
// `${...}` and has no digits, so it never matches. Each claim is checked against its own context:
// guarantee claims against `guaranteeDays`, claims after a country name against that country's
// window (days and unit), the rest against any configured number of days.
const WORDS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  veinte: 20,
  treinta: 30,
  cuarenta: 40,
  sesenta: 60,
  noventa: 90,
};
const periodClaim = new RegExp(
  `\\b(\\d+|${Object.keys(WORDS).join("|")})\\s+(d[ií]as?(?:\\s+(?:h[aá]biles|corridos|naturales))?|semanas?|mes(?:es)?)\\b`,
  "giu",
);
const keyword =
  /garant[ií]a|arrepentimiento|retracto|desistimiento|revocaci[oó]n|revocar|devoluci[oó]n|reembols/giu;
// Reviewed statements about a different thing than a withdrawal period (Hotmart's EU minimum).
const reviewed = /Hotmart\s+exige\s+(?:al\s+menos|un\s+plazo\s+mínimo\s+de)\s+15\s+días/gu;
const allowedDays = new Set<number>([guaranteeDays, ...withdrawalWindows.map((w) => w.days)]);
const countryName = (country: string) => country.replace(/\s*\(.*\)/u, "");

function segments(text: string): string[] {
  return text
    .replace(reviewed, "")
    .replace(/<\/?(?:strong|em|a|b)\b[^>]*>/gu, "")
    .replace(/\s+/gu, " ")
    .replace(/\b\d{1,3}(?:\.\d{3})+\b|\barts?\.\s*\d+|\b\d+\/\d{4}\b/gu, "N")
    .split(/[.!?;]\s|["'`]\s*[,;)]|<[^>]*>/u);
}

function unbackedPeriods(text: string): string[] {
  const found: string[] = [];
  for (const sentence of segments(text)) {
    const keywords = [...sentence.matchAll(keyword)];
    if (keywords.length === 0) continue;
    for (const match of sentence.matchAll(periodClaim)) {
      const at = match.index ?? 0;
      const nearest = keywords.reduce((best, k) =>
        Math.abs((k.index ?? 0) - at) < Math.abs((best.index ?? 0) - at) ? k : best,
      );
      const quantity = match[1] ?? "";
      const value = /^\d+$/u.test(quantity)
        ? Number(quantity)
        : (WORDS[quantity.toLowerCase()] ?? NaN);
      const unit = (match[2] ?? "").toLowerCase().replace(/\bdias\b/u, "días");
      const before = sentence.slice(0, at).toLowerCase();
      const country = withdrawalWindows
        .map((window) => ({
          window,
          index: before.lastIndexOf(countryName(window.country).toLowerCase()),
        }))
        .filter((entry) => entry.index >= 0)
        .sort((a, b) => b.index - a.index)[0]?.window;
      let ok: boolean;
      if (/semana|mes/u.test(unit)) ok = false;
      else if (/^garant/iu.test(nearest[0])) ok = value === guaranteeDays;
      else if (country) ok = value === country.days && unit === country.unit;
      else ok = allowedDays.has(value);
      if (!ok) found.push(match[0]);
    }
  }
  return found;
}

test("no copy states a guarantee or withdrawal period that config does not back", () => {
  const found: string[] = [];
  const dirs = ["content", "config", "src/views", "src/shell", "src/app", "src/features"];
  for (const file of dirs.flatMap(sourceFiles))
    for (const claim of unbackedPeriods(readFileSync(file, "utf8")))
      found.push(`${file}: ${claim}`);
  assert.deepEqual(found, []);
});

test("negative fixtures: every kind of unbacked period is caught", () => {
  for (const text of [
    "Tienes 30 días de garantía",
    "La garantía es de 30 días",
    "La garantía es de 14 días",
    "Tienes treinta días de garantía",
    "Tienes siete días de garantía en Hotmart, y quince días de garantía extra",
    "Una semana de garantía",
    "La garantía dura un mes",
    "Derecho de arrepentimiento: 15 días corridos",
    "El plazo de retracto es de\n 20 días",
    "Desistimiento en Perú dentro de 8 días",
    "El desistimiento en España es de 5 días hábiles",
    "El arrepentimiento en Colombia es de 5 días",
    "Según la Ley 24.240, art. 34, la garantía es de 30 días",
    "Puedes pedir la devolución dentro de 20 días",
    "Reembolso garantizado en catorce días de garantía",
    "<strong>30 días</strong> de garantía",
  ])
    assert.ok(unbackedPeriods(text).length > 0, text);
});

test("backed periods and reviewed statements pass", () => {
  for (const text of [
    "Tienes 7 días de garantía",
    "Garantía de siete días",
    "La garantía es de 7 días",
    "Arrepentimiento en España: 14 días naturales",
    "El arrepentimiento en Argentina es de 10 días corridos (Ley 24.240, art. 34)",
    "Según la Ley 24.240, el desistimiento en Chile es de 10 días",
    "Hotmart exige al menos 15 días",
    "Tienes garantía de 7 días; en Colombia el retracto es de 5 días hábiles",
    "Hotmart tarda hasta 30 días en transferencias",
  ])
    assert.deepEqual(unbackedPeriods(text), [], text);
});

test("refund copy never says Hotmart always executes the refund", () => {
  const unqualified = /siempre\s+(?:lo\s+|la\s+)?(?:ejecuta|hace|procesa)\s+Hotmart/iu;
  assert.match("El reembolso siempre lo ejecuta Hotmart", unqualified);
  assert.match(
    "siempre lo ejecuta\n Hotmart",
    new RegExp(unqualified.source.replace(/\\s\+/g, "\\s+"), "iu"),
  );
  for (const file of ["content", "src/views"].flatMap(sourceFiles))
    assert.doesNotMatch(readFileSync(file, "utf8").replace(/\s+/gu, " "), unqualified, file);
  assert.ok(!/por el mismo medio de pago o el que acordemos/u.test(withdrawalCopy.manualRefund));
  assert.ok(withdrawalCopy.hotmartRefund.includes(`${guaranteeDays} días`));
  assert.ok(withdrawalCopy.manualRefund.includes("manual"));
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
