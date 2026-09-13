// Enforces per-route transfer-size budgets (gzip) on the static export.
// Budgets live in config/budgets.json; a markdown table is appended to $GITHUB_STEP_SUMMARY when set.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const outDir = resolve(root, "out");
const budgets = JSON.parse(readFileSync(resolve(root, "config/budgets.json"), "utf8"));

if (!existsSync(outDir)) {
  console.error("check-bundle: out/ not found; run `npm run build` first");
  process.exit(1);
}

const gzipBytes = (file) => gzipSync(readFileSync(file), { level: 9 }).length;

function measureRoute(route) {
  const html = join(outDir, route === "/" ? "index.html" : `${route.replace(/^\//, "")}index.html`);
  const source = readFileSync(html, "utf8");
  const scripts = [...new Set(source.match(/\/_next\/static\/chunks\/[^"']+\.js/g) ?? [])].filter(
    (src) => !/polyfills/.test(src),
  );
  const styles = [...new Set(source.match(/\/_next\/static\/css\/[^"']+\.css/g) ?? [])];
  const sum = (files) => files.reduce((total, file) => total + gzipBytes(join(outDir, file)), 0);
  return { route, html: gzipBytes(html), js: sum(scripts), css: sum(styles), scripts: scripts.length };
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const rows = [];
const failures = [];

for (const [route, limits] of Object.entries(budgets.routes)) {
  const measured = measureRoute(route);
  for (const metric of ["html", "js", "css"]) {
    const limit = limits[metric] ?? budgets.default[metric];
    const over = measured[metric] > limit;
    if (over) failures.push(`${route} ${metric} ${kb(measured[metric])} > ${kb(limit)}`);
    rows.push(`| ${route} | ${metric} | ${kb(measured[metric])} | ${kb(limit)} | ${over ? "❌" : "✅"} |`);
  }
}

const table = ["| Route | Metric | Measured (gzip) | Budget | |", "|---|---|---|---|---|", ...rows].join(
  "\n",
);
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Bundle budget\n\n${table}\n`);

if (failures.length) {
  for (const failure of failures) console.error(`✖ ${failure}`);
  process.exit(1);
}
console.log("check-bundle: all routes within budget");
