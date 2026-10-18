// Prints a markdown summary of the latest Lighthouse CI run (median per URL).
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve(process.cwd(), ".lighthouseci/manifest.json");
if (!existsSync(manifestPath)) {
  console.log("## Lighthouse\n\nNo results found.");
  process.exit(0);
}

type ManifestRun = { url: string; jsonPath: string; isRepresentativeRun: boolean };
type Audit = { numericValue: number; displayValue?: string };
type Lhr = {
  categories: Record<string, { score?: number } | undefined>;
  audits: Record<string, Audit | undefined>;
};

const runs = (JSON.parse(readFileSync(manifestPath, "utf8")) as ManifestRun[]).filter(
  (run) => run.isRepresentativeRun,
);
const score = (value: number | undefined): number | string =>
  value === undefined ? "–" : Math.round(value * 100);
const ms = (audit: Audit | undefined): string => (audit ? `${Math.round(audit.numericValue)} ms` : "–");

const rows = runs.map((run) => {
  const lhr = JSON.parse(readFileSync(run.jsonPath, "utf8")) as Lhr;
  const c = lhr.categories;
  const a = lhr.audits;
  return `| ${new URL(run.url).pathname} | ${score(c.performance?.score)} | ${score(c.accessibility?.score)} | ${score(c["best-practices"]?.score)} | ${score(c.seo?.score)} | ${ms(a["largest-contentful-paint"])} | ${a["cumulative-layout-shift"]?.displayValue ?? "–"} | ${ms(a["total-blocking-time"])} |`;
});

console.log(
  [
    "## Lighthouse (mobile emulation, median run)",
    "",
    "| URL | Perf | A11y | Best | SEO | LCP | CLS | TBT |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n"),
);
