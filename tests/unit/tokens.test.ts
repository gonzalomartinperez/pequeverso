import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  collectTokens,
  OUTPUT,
  readSource,
  renderTheme,
  resolveReferences,
  type TokenGroup,
} from "../../tools/tokens/build.ts";

test("the committed theme.css is current (run node tools/tokens/build.ts)", () => {
  assert.equal(readFileSync(OUTPUT, "utf8"), renderTheme(readSource()));
});

test("the generated theme is marked generated and pins color-scheme: light", () => {
  const css = readFileSync(OUTPUT, "utf8");
  assert.match(css, /Generated, do not edit/);
  assert.match(css, /:root \{\n {2}color-scheme: light;/);
});

test("semantic colors have a plain declaration and a light-dark() upgrade inside @supports", () => {
  const semantic = collectTokens(readSource()).filter((t) => t.path.startsWith("color.semantic."));
  assert.ok(semantic.length > 20);
  const css = readFileSync(OUTPUT, "utf8");
  const at = css.indexOf("@supports (color: light-dark(white, black))");
  assert.ok(at > 0, "missing the light-dark() @supports block");
  const [plain, upgrade] = [css.slice(0, at), css.slice(at)];
  assert.ok(!plain.includes("light-dark("), "light-dark() outside @supports");
  for (const { name } of semantic) {
    assert.match(plain, new RegExp(`^ {2}--${name}: (?!light-dark)[^;]+;`, "m"), `--${name} plain`);
    const match = upgrade.match(new RegExp(`^ {4}--${name}: light-dark\\((.+), (.+)\\);`, "m"));
    assert.ok(match, `--${name} is not upgraded to light-dark()`);
    assert.equal(match[1], match[2], `--${name} differs between light and dark (ADR-0006)`);
  }
});

const color = (value: string, extra: object = {}) => ({ $value: value, $type: "color", ...extra });
const render = (tokens: Record<string, unknown>) => renderTheme({ color: tokens } as TokenGroup);

test("self, indirect and dark-reference cycles are rejected", () => {
  assert.throws(() => render({ a: color("{color.a}") }), /cycle/);
  assert.throws(() => render({ a: color("{color.b}"), b: color("{color.a}") }), /cycle/);
  assert.throws(
    () =>
      render({
        a: color("red", { $extensions: { "com.pequeverso": { dark: "{color.b}" } } }),
        b: color("{color.a}"),
      }),
    /cycle/,
  );
});

test("non-string values and comment terminators are rejected", () => {
  assert.throws(() => render({ a: { $value: 3 } }), /\$value must be a string/);
  assert.throws(
    () => render({ a: color("red", { $description: "x */ y" }) }),
    /comment terminator/,
  );
});

test("references resolve to custom properties and unknown references fail", () => {
  const names = new Map([["color.brand.pv-navy", "pv-navy"]]);
  assert.equal(resolveReferences("{color.brand.pv-navy}", names), "var(--pv-navy)");
  assert.throws(() => resolveReferences("{color.missing}", names), /Unknown token reference/);
});
