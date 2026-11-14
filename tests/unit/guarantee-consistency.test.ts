import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { guaranteeDays } from "../../config/commerce.ts";
import { sourceFiles } from "../helpers/source-architecture.ts";

// Existing content-invariants.test.ts covers "N días de garantía" and commerce.test.ts pins 7.
// OD-50: longer legal windows are honored. The EU minimum Hotmart applies (15 days) is a distinct,
// longer window, not a conflicting guarantee; any other non-7-day figure must be reviewed first.
const LONGER_LEGAL_WINDOWS = [
  "src/views/legal/compras-y-reembolsos-view.tsx: Hotmart exige al menos 15 días",
  "src/views/legal/terminos-view.tsx: Hotmart exige un plazo mínimo de 15 días",
];
const guaranteePeriod = /garant[ií]a(?:\s+comercial)?\s+(?:de\s+)?(\d+)\s+d[ií]as/giu;
const hotmartMinimum = /Hotmart\s+exige\s+(?:al\s+menos|un\s+plazo\s+mínimo\s+de)\s+(\d+)\s+días/gu;

test("guarantee periods equal config; only the reviewed longer legal windows differ", () => {
  const findings: string[] = [];
  for (const file of ["content", "config", "src/views"].flatMap(sourceFiles)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(guaranteePeriod))
      assert.equal(Number(match[1]), guaranteeDays, `${file}: ${match[0]}`);
    for (const match of source.matchAll(hotmartMinimum))
      if (Number(match[1]) !== guaranteeDays)
        findings.push(`${file}: ${match[0].replace(/\s+/g, " ")}`);
  }
  assert.deepEqual(findings.sort(), [...LONGER_LEGAL_WINDOWS].sort());
  assert.equal([..."Garantía de 30 días".matchAll(guaranteePeriod)][0]?.[1], "30");
  assert.equal([..."Hotmart exige al menos 15 días".matchAll(hotmartMinimum)][0]?.[1], "15");
  for (const text of [
    "Hotmart\n exige al\n menos 15\n días",
    "Hotmart exige un plazo\n mínimo de 15 días",
  ])
    assert.equal([...text.matchAll(hotmartMinimum)][0]?.[1], "15");
});

test("legal withdrawal pages preserve longer legal windows and email access", () => {
  for (const page of ["arrepentimiento", "compras-y-reembolsos", "terminos"]) {
    const source = readFileSync(`src/views/legal/${page}-view.tsx`, "utf8").replace(/\s+/g, " ");
    assert.match(source, /\bguaranteeDays\b/);
    assert.match(source, /mailto:/);
    assert.match(source, /seller\.supportEmail/);
    assert.match(source, /por correo/);
    assert.match(source, /(?:plazo mayor|prevalece si es mayor)/);
  }
});
