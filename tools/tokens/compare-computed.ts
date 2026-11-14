/**
 * Manual refactor guard (ADR-0012), not part of CI: proves a CSS/token change is visually neutral by
 * comparing resolved custom properties and 25 computed properties of every element, on every
 * exported route at 390 and 1280 px, between two static exports.
 *
 *   node tools/tokens/compare-computed.ts capture <baseUrl> <exportDir> <out.json>
 *   node tools/tokens/compare-computed.ts diff <before.json> <after.json>
 *
 * Serve each export (`SERVE_DIR=<dir> PORT=<port> node tools/serve-static.ts`), capture both, then
 * diff; `light-dark(x, x)` is normalized to `x`. Exit code 1 when anything differs.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const WIDTHS = [390, 1280];
const PROPERTIES = [
  "color",
  "backgroundColor",
  "backgroundImage",
  "borderTopColor",
  "borderRadius",
  "boxShadow",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "marginTop",
  "marginBottom",
  "gap",
  "width",
  "height",
  "outlineColor",
  "transitionDuration",
  "textDecorationColor",
  "opacity",
  "fill",
];

interface Page {
  vars: Record<string, string>;
  els: Record<string, Record<string, string>>;
}

function routes(dir: string, rel = ""): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry.startsWith("_") || entry === "fonts" ? [] : routes(full, `${rel}${entry}/`);
    }
    return entry === "index.html" ? [`/${rel}`] : [];
  });
}

async function capture(base: string, dir: string, out: string): Promise<void> {
  const browser = await chromium.launch();
  const result: Record<string, Page> = {};
  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    for (const route of routes(dir).sort()) {
      await page.goto(base + route, { waitUntil: "load" });
      await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
      await page.waitForTimeout(1500);
      result[`${width}${route}`] = await page.evaluate((properties) => {
        const root = getComputedStyle(document.documentElement);
        const names = new Set<string>();
        for (const sheet of document.styleSheets) {
          const walk = (rules: CSSRuleList): void => {
            for (const rule of rules) {
              if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
                for (const n of rule.style) if (n.startsWith("--")) names.add(n);
              } else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
            }
          };
          try {
            walk(sheet.cssRules);
          } catch {
            /* cross-origin sheet */
          }
        }
        const vars: Record<string, string> = {};
        for (const n of [...names].sort()) vars[n] = root.getPropertyValue(n).trim();
        const els: Record<string, Record<string, string>> = {};
        const all = document.querySelectorAll(
          "body *:not(next-route-announcer):not(next-route-announcer *)",
        );
        for (const el of all) {
          const path: string[] = [];
          for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
            path.unshift(`${n.tagName}:${[...(n.parentElement?.children ?? [])].indexOf(n)}`);
          }
          const style = getComputedStyle(el) as unknown as Record<string, string>;
          els[path.join(">")] = Object.fromEntries(properties.map((p) => [p, style[p] ?? ""]));
        }
        return { vars, els };
      }, PROPERTIES);
    }
    await page.close();
  }
  await browser.close();
  writeFileSync(out, JSON.stringify(result));
  console.log(`captured ${Object.keys(result).length} pages (${WIDTHS.join(", ")} px) -> ${out}`);
}

function diff(beforeFile: string, afterFile: string): number {
  const a = JSON.parse(readFileSync(beforeFile, "utf8")) as Record<string, Page>;
  const b = JSON.parse(readFileSync(afterFile, "utf8")) as Record<string, Page>;
  const norm = (v: string): string => v.replace(/^light-dark\((.*),\s*\1\)$/, "$1");
  let checks = 0;
  const problems: string[] = [];
  for (const [key, x] of Object.entries(a)) {
    const y = b[key];
    if (!y) {
      problems.push(`missing page ${key}`);
      continue;
    }
    for (const n of new Set([...Object.keys(x.vars), ...Object.keys(y.vars)])) {
      checks++;
      if (norm(x.vars[n] ?? "") !== norm(y.vars[n] ?? ""))
        problems.push(`${key} ${n}: ${x.vars[n]} | ${y.vars[n]}`);
    }
    for (const el of new Set([...Object.keys(x.els), ...Object.keys(y.els)])) {
      for (const p of PROPERTIES) {
        checks++;
        if (x.els[el]?.[p] !== y.els[el]?.[p])
          problems.push(`${key} ${el} ${p}: ${x.els[el]?.[p]} | ${y.els[el]?.[p]}`);
      }
    }
  }
  console.log(problems.slice(0, 20).join("\n"));
  console.log(`${checks} checks, ${problems.length} differences`);
  return problems.length === 0 ? 0 : 1;
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "capture" && args.length === 3)
  await capture(args[0] as string, args[1] as string, args[2] as string);
else if (mode === "diff" && args.length === 2)
  process.exitCode = diff(args[0] as string, args[1] as string);
else
  console.error(
    "usage: capture <baseUrl> <exportDir> <out.json> | diff <before.json> <after.json>",
  );
