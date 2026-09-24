import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const toPosix = (file: string): string => file.split("\\").join("/");
function files(dir: string, pattern: RegExp): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (pattern.test(entry)) found.push(full);
    }
  };
  walk(dir);
  return found;
}
const read = (file: string): string => readFileSync(file, "utf8");
const globals = read("src/app/globals.css");

test("CSS Modules never use @apply", () => {
  for (const file of files("src", /\.module\.css$/)) {
    assert.ok(!/@apply\b/.test(read(file)), `${toPosix(relative(".", file))} uses @apply`);
  }
});

test("nothing imports the retired src/styles sheets or PascalCase component folders", () => {
  const retired = [
    /["']@\/styles\//,
    /src\/styles\//,
    /["']@\/components\/ui\/[A-Z]/,
    /["']@\/components\/layout\/[A-Z]/,
    /["']@\/motion\/[A-Z]/,
  ];
  for (const file of [...files("src", /\.(ts|tsx|css)$/), ...files("content", /\.ts$/)]) {
    const text = read(file);
    for (const pattern of retired) {
      assert.ok(!pattern.test(text), `${toPosix(relative(".", file))} matches ${pattern}`);
    }
  }
});

test("primitives, blocks and layout are kebab-case; primitives tag their root with data-slot", () => {
  for (const dir of ["src/components/ui", "src/components/blocks", "src/components/layout"]) {
    for (const entry of readdirSync(dir)) {
      assert.match(entry, /^[a-z0-9-]+\.(ts|tsx)$/, `${dir}/${entry} is not kebab-case`);
    }
  }
  for (const file of files("src/components/ui", /\.tsx$/)) {
    assert.ok(/data-slot|slot: "/.test(read(file)), `${toPosix(file)} has no data-slot`);
  }
});

test("light theme only; !important only in the annotated reduced-motion kill switch", () => {
  assert.ok(!/\.dark\b|@custom-variant dark/.test(globals), "globals.css ships a dark theme");
  for (const file of files("src", /\.css$/)) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.includes("!important")) return;
      assert.match(
        lines[index - 1] ?? "",
        /biome-ignore lint\/complexity\/noImportantStyles/,
        `${toPosix(file)}:${index + 1} uses !important without the kill-switch annotation`,
      );
    });
  }
});

/* OKLCH → sRGB → WCAG 2.x relative luminance, computed from the token source itself. */
type Triple = [number, number, number];
function oklchToLinearRgb([L, C, H]: Triple): Triple {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (value: number): number => Math.min(1, Math.max(0, value));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
function luminance(name: string): number {
  const match = globals.match(
    new RegExp(`--pv-${name}:\\s*oklch\\(\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*\\)`),
  );
  assert.ok(match, `--pv-${name} is not a plain oklch() token`);
  const [r, g, b] = oklchToLinearRgb([Number(match[1]), Number(match[2]), Number(match[3])]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("documented WCAG 2.2 AA contrast pairs hold for the OKLCH tokens", () => {
  const pairs: Array<[fg: string, bg: string, min: number]> = [
    ["white", "navy", 12.5],
    ["white", "navy-deep", 15],
    ["white", "coral", 4.5],
    ["white", "coral-hover", 6.5],
    ["white", "teal", 4.5],
    ["teal-text", "white", 7.5],
    ["teal-text", "cream", 7],
    ["ink", "gold", 11.5],
    ["ink", "cream", 15.5],
    ["body", "cream", 7.5],
    ["muted", "cream", 4.5],
    ["muted", "white", 4.5],
    ["turquoise", "navy", 8.5],
    ["gold", "navy", 9],
    ["navy", "mint", 11],
  ];
  for (const [fg, bg, min] of pairs) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= min, `${fg} on ${bg} is ${ratio.toFixed(2)}:1, expected ≥ ${min}`);
  }
});

test("cn keeps the project's font sizes and shadows next to colours (config/cn.ts)", async () => {
  const { createCn } = await import("cn/engine");
  const { default: tables } = await import("../../src/lib/cn-tables.js");
  const cn = createCn(tables);
  assert.equal(
    cn("font-display text-price font-bold", "text-coral"),
    "font-display text-price font-bold text-coral",
  );
  assert.equal(cn("text-h3 text-heading"), "text-h3 text-heading");
  assert.equal(cn("text-small", "text-tiny"), "text-tiny");
  assert.equal(cn("shadow-cta", "shadow-cta-hover"), "shadow-cta-hover");
});
