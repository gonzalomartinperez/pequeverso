// @ts-check
// Read-only daily checks against a live origin that smoke.mjs does not cover: TLS expiry, header
// matrix, sitemap/robots, Hotmart checkout link on the landing, Meta CAPI relay probe and a crawl of
// every internal href/src on the sitemap pages. Never sends real events.
// Usage: node scripts/check-live.mjs https://pequeverso.com
// Prints one line per check, appends a table to $GITHUB_STEP_SUMMARY, writes the failed check names
// to $GITHUB_OUTPUT (`failed=`), exits 1 on any failure. Warnings never fail the run.
import { appendFileSync } from "node:fs";
import { connect } from "node:tls";

const base = (process.argv[2] || "https://pequeverso.com").replace(/\/$/, "");
const MIN_TLS_DAYS = 14;
/** @type {{ name: string, status: "pass" | "fail" | "warn", detail: string }[]} */
const results = [];
const record = (name, status, detail) => {
  results.push({ name, status, detail });
  console.log(`${status === "pass" ? "✔" : status === "warn" ? "⚠" : "✖"} ${name}: ${detail}`);
};

/** @param {string} path @param {RequestInit} [init] */
const get = (path, init) => fetch(new URL(path, `${base}/`), { redirect: "manual", ...init });

async function tlsDays() {
  const { hostname } = new URL(base);
  const validTo = await new Promise((resolve, reject) => {
    const socket = connect({ host: hostname, port: 443, servername: hostname, timeout: 10_000 }, () => {
      resolve(socket.getPeerCertificate().valid_to);
      socket.end();
    });
    socket.on("error", reject);
    socket.on("timeout", () => socket.destroy(new Error("TLS timeout")));
  });
  const days = Math.floor((Date.parse(String(validTo)) - Date.now()) / 86_400_000);
  record("TLS certificate", days >= MIN_TLS_DAYS ? "pass" : "fail", `${days} days left (${validTo})`);
}

async function headers() {
  const html = await get("/");
  const h = html.headers;
  const missing = [
    ["strict-transport-security", /max-age=\d+/],
    ["x-content-type-options", /^nosniff$/],
    ["referrer-policy", /./],
    ["x-frame-options", /./],
    ["cache-control", /no-cache/],
  ].filter(([name, re]) => !(/** @type {RegExp} */ (re).test(h.get(/** @type {string} */ (name)) || "")));
  const csp = h.get("content-security-policy-report-only") || h.get("content-security-policy");
  if (!csp) missing.push(["content-security-policy(-report-only)", /./]);
  record(
    "Headers on /",
    missing.length ? "fail" : "pass",
    missing.length
      ? `missing ${missing.map(([n]) => n).join(", ")}`
      : "HSTS, nosniff, referrer, frame, CSP, no-cache",
  );

  const asset = (await html.text()).match(/\/_next\/static\/[^"']+\.js/)?.[0];
  const assetCache = asset ? (await get(asset, { method: "HEAD" })).headers.get("cache-control") || "" : "";
  record(
    "Headers on /_next/static",
    /immutable/.test(assetCache) ? "pass" : "fail",
    assetCache || "no asset found",
  );

  const infoCache = (await get("/build-info.json")).headers.get("cache-control") || "";
  record(
    "Headers on /build-info.json",
    /no-store/.test(infoCache) ? "pass" : "warn",
    infoCache || "no Cache-Control (edge rule expects no-store)",
  );
}

async function sitemapAndRobots() {
  const robots = await get("/robots.txt");
  const robotsText = robots.ok ? await robots.text() : "";
  record(
    "robots.txt",
    robots.ok && /Sitemap:\s*https?:\/\//i.test(robotsText) ? "pass" : "fail",
    `${robots.status}`,
  );
  const sitemap = await get("/sitemap.xml");
  const locs = sitemap.ok
    ? [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "")
    : [];
  record("sitemap.xml", locs.length ? "pass" : "fail", `${sitemap.status}, ${locs.length} URLs`);
  return locs;
}

async function checkoutLink() {
  const res = await get("/grafismo-fonetico/");
  const hrefs = [...(await res.text()).matchAll(/href="(https:\/\/pay\.hotmart\.com\/[^"]+)"/g)].map(
    (m) => m[1],
  );
  record(
    "Hotmart checkout link",
    hrefs.length ? "pass" : "fail",
    hrefs.length
      ? `${hrefs.length} link(s) to pay.hotmart.com`
      : "no href to https://pay.hotmart.com/ on /grafismo-fonetico/",
  );
}

async function relayProbe() {
  const res = await get("/api/meta/events/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events: [] }),
  });
  const state = { 400: "enabled (empty batch rejected)", 204: "disabled (no token)" }[res.status];
  const detail =
    state ??
    (res.status === 308 || res.status === 404
      ? `${res.status}: relay not deployed`
      : `unexpected ${res.status}`);
  record("Conversions API relay", state ? "pass" : "fail", detail);
}

/** @param {string[]} pages */
async function crawl(pages) {
  const targets = new Set();
  for (const page of pages) {
    const html = await (await fetch(page)).text();
    // /cdn-cgi/ is injected by Cloudflare (email obfuscation) and is not part of the site.
    for (const m of html.matchAll(/(?:href|src)="(\/[^"/][^"]*|\/)"/g))
      if (!m[1]?.startsWith("/cdn-cgi/")) targets.add((m[1] ?? "/").split("#")[0]);
  }
  const broken = [];
  const queue = [...targets];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let t = queue.shift(); t !== undefined; t = queue.shift()) {
        let res = await fetch(new URL(t, `${base}/`), { method: "HEAD" });
        if (res.status === 405) res = await fetch(new URL(t, `${base}/`));
        if (res.status >= 400) broken.push(`${t} → ${res.status}`);
      }
    }),
  );
  record(
    "Internal links",
    broken.length ? "fail" : "pass",
    broken.length
      ? broken.slice(0, 10).join("; ")
      : `${targets.size} URLs from ${pages.length} pages resolve`,
  );
}

for (const check of [tlsDays, headers, checkoutLink, relayProbe]) {
  await check().catch((error) => record(check.name, "fail", String(error?.message || error)));
}
/** @type {string[]} */
const pages = await sitemapAndRobots().catch((error) => {
  record("sitemap/robots", "fail", String(error));
  return [];
});
if (pages.length) await crawl(pages).catch((error) => record("Internal links", "fail", String(error)));

const failed = results.filter((r) => r.status === "fail").map((r) => r.name);
const icon = { pass: "✅", warn: "⚠️", fail: "❌" };
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((r) => `| ${r.name} | ${icon[r.status]} | ${r.detail.replace(/\|/g, "\\|")} |`);
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    ["## Live checks", "", "| Check | | Detail |", "|---|---|---|", ...rows, ""].join("\n") + "\n",
  );
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed.join(", ")}\n`);
for (const r of results.filter((x) => x.status === "warn"))
  console.log(`::warning title=${r.name}::${r.detail}`);
if (failed.length) process.exit(1);
