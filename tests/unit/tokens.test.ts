import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  collectTokens,
  OUTPUT,
  readSource,
  renderTheme,
  resolveReferences,
} from "../../tools/tokens/build.ts";

test("the committed theme.css is current (run node tools/tokens/build.ts)", () => {
  assert.equal(readFileSync(OUTPUT, "utf8"), renderTheme(readSource()));
});

test("the generated theme is marked generated and pins color-scheme: light", () => {
  const css = readFileSync(OUTPUT, "utf8");
  assert.match(css, /Generated, do not edit/);
  assert.match(css, /:root \{\n {2}color-scheme: light;/);
});

test("semantic colors resolve through light-dark() with dark equal to light", () => {
  const semantic = collectTokens(readSource()).filter((t) => t.path.startsWith("color.semantic."));
  assert.ok(semantic.length > 20);
  const css = readFileSync(OUTPUT, "utf8");
  for (const { name } of semantic) {
    const line = css.split("\n").find((l) => l.startsWith(`  --${name}:`)) ?? "";
    const match = line.match(/^ {2}--[\w-]+: light-dark\((.+), (.+)\);/);
    assert.ok(match, `--${name} does not use light-dark()`);
    assert.equal(match[1], match[2], `--${name} differs between light and dark (ADR-0006)`);
  }
});

test("references resolve to custom properties and unknown references fail", () => {
  const names = new Map([["color.brand.pv-navy", "pv-navy"]]);
  assert.equal(resolveReferences("{color.brand.pv-navy}", names), "var(--pv-navy)");
  assert.throws(() => resolveReferences("{color.missing}", names), /Unknown token reference/);
});
