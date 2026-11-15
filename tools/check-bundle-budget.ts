// Enforces per-route transfer-size budgets (gzip) on the static export (`out/`), or on an assembled
// standalone site when SITE_DIR is set (tools/ci/assemble-site.ts, tools/lib/site-layout.ts).
// Budgets live in config/budgets.json; a markdown table is appended to $GITHUB_STEP_SUMMARY when set.
// `--json <file>` also writes [{route, metric, kb}] for the scorecard (tools/scorecard).
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { assetFile, layoutFor, missingLayout, pageFile } from "./lib/site-layout.ts";

const root = process.cwd();
const layout = layoutFor(root, process.env);
type Metric = "html" | "js" | "css";
type Budgets = {
  default: Record<Metric, number>;
  routes: Record<string, Partial<Record<Metric, number>>>;
};
const budgets = JSON.parse(readFileSync(resolve(root, "config/budgets.json"), "utf8")) as Budgets;
const metrics: readonly Metric[] = ["html", "js", "css"];

const missing = missingLayout(layout, "check-bundle");
if (missing) {
  console.error(missing);
  process.exit(1);
}

const gzipBytes = (file: string): number => gzipSync(readFileSync(file), { level: 9 }).length;

function measureRoute(route: string): Record<Metric, number> & { route: string; scripts: number } {
  const html = pageFile(layout, route);
  const source = readFileSync(html, "utf8");
  const scripts = [...new Set(source.match(/\/_next\/static\/chunks\/[^"']+\.js/g) ?? [])].filter(
    (src) => !/polyfills/.test(src),
  );
  const styles = [...new Set(source.match(/\/_next\/static\/css\/[^"']+\.css/g) ?? [])];
  const sum = (files: string[]): number =>
    files.reduce(
      (total, file) => total + gzipBytes(assetFile(layout, decodeURIComponent(file))),
      0,
    );
  return {
    route,
    html: gzipBytes(html),
    js: sum(scripts),
    css: sum(styles),
    scripts: scripts.length,
  };
}

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;
const rows: string[] = [];
const measuredRows: { route: string; metric: Metric; kb: number }[] = [];
const failures: string[] = [];

for (const [route, limits] of Object.entries(budgets.routes)) {
  const measured = measureRoute(route);
  for (const metric of metrics) {
    const limit = limits[metric] ?? budgets.default[metric];
    const over = measured[metric] > limit;
    measuredRows.push({ route, metric, kb: measured[metric] / 1024 });
    if (over) failures.push(`${route} ${metric} ${kb(measured[metric])} > ${kb(limit)}`);
    rows.push(
      `| ${route} | ${metric} | ${kb(measured[metric])} | ${kb(limit)} | ${over ? "❌" : "✅"} |`,
    );
  }
}

const table = [
  "| Route | Metric | Measured (gzip) | Budget | |",
  "|---|---|---|---|---|",
  ...rows,
].join("\n");
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Bundle budget\n\n${table}\n`);

const jsonFlag = process.argv.indexOf("--json");
if (jsonFlag !== -1 && process.argv[jsonFlag + 1])
  writeFileSync(process.argv[jsonFlag + 1] as string, `${JSON.stringify(measuredRows)}\n`);

if (failures.length) {
  for (const failure of failures) console.error(`✖ ${failure}`);
  process.exit(1);
}
console.log("check-bundle: all routes within budget");
