// @ts-check
// Read-only smoke test against a running origin (staging or production). Exit 1 on
// any mismatch. Usage: node scripts/smoke.mjs https://pequeverso.com [expected-sha]
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const expectedSha = process.argv[3];
const failures = [];

async function head(path, init) {
  const res = await fetch(`${base}${path}`, { redirect: "manual", ...init });
  return res;
}
function expect(cond, msg) {
  if (!cond) failures.push(msg);
}

const routes = [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/imprime-y-juega/?downsell=1",
  "/grafismo-fonetico/gracias/",
  "/soporte/",
  "/privacidad/",
];
for (const route of routes) {
  const res = await head(route);
  expect(res.status === 200, `${route} → ${res.status}, expected 200`);
  if (route === "/") {
    expect((res.headers.get("content-type") || "").includes("text/html"), "/ is not text/html");
  }
}
const noSlash = await head("/grafismo-fonetico");
expect([301, 308].includes(noSlash.status), `/grafismo-fonetico → ${noSlash.status}, expected 301/308`);
expect(
  (noSlash.headers.get("location") || "").endsWith("/grafismo-fonetico/"),
  "non-slash redirect target mismatch",
);
const missing = await head("/esta-pagina-no-existe/");
expect(missing.status === 404, `unknown route → ${missing.status}, expected 404`);
const info = await fetch(`${base}/build-info.json`, { cache: "no-store" });
expect(info.status === 200, `build-info.json → ${info.status}`);
if (info.ok) {
  const json = await info.json();
  console.log(`deployed sha ${json.sha} (${json.ref}, ${json.builtAt})`);
  if (expectedSha) expect(json.sha === expectedSha, `deployed sha ${json.sha} != expected ${expectedSha}`);
}
const upsell = await fetch(`${base}/imprime-y-juega/`);
const html = await upsell.text();
expect(
  (html.match(/hotmart-sales-funnel/g) || []).length === 1,
  "upsell must contain exactly one hotmart-sales-funnel container",
);
expect(html.includes("hotmart-checkout-elements.js"), "upsell must reference the Hotmart widget script");

if (failures.length) {
  for (const f of failures) console.error(`✖ ${f}`);
  process.exit(1);
}
console.log(`smoke: ${routes.length + 3} checks passed against ${base}`);
