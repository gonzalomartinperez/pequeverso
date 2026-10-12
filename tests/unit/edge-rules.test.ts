import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  isAffiliateUrl,
  loadEdgeRules,
  toApacheRegex,
  toHtaccess,
  toNextHeaders,
  toNextRedirects,
} from "../../scripts/lib/edge-rules.ts";

// Golden and assertions use no environment values (affiliate links are build-time variables).
const rules = loadEdgeRules(undefined, {});

test("edge rules validate and stay in sync with the committed golden .htaccess", () => {
  const golden = readFileSync(new URL("../../docs/generated/htaccess.txt", import.meta.url), "utf8");
  assert.equal(
    toHtaccess(rules),
    golden,
    "run `node scripts/gen-htaccess.ts` and commit docs/generated/htaccess.txt",
  );
});

test("apache regexes never carry a leading slash (per-directory context)", () => {
  assert.equal(toApacheRegex("/shop-2/:path*"), "^shop-2/(.*)$");
  assert.equal(toApacheRegex("/grafismo-fonetico/"), "^grafismo-fonetico/?$");
  for (const r of rules.redirects) assert.doesNotMatch(toApacheRegex(r.source), /^\^\//);
});

test("static headers include cache policy for media, fonts and build-info", () => {
  const html = toHtaccess(rules);
  assert.match(html, /Cache-Control "no-store"/);
  assert.match(html, /max-age=31536000, immutable/);
  assert.match(html, /ErrorDocument 404 \/404\.html/);
  assert.match(html, /RewriteRule \(\^\|\/\)\\.\(\?!well-known\/\) - \[R=404,L\]/);
  assert.match(html, /Strict-Transport-Security "max-age=300"/);
});

test("standalone target receives the same rules", () => {
  const headers = toNextHeaders(rules);
  assert.ok(headers.some((h) => h.headers.some((x) => x.key === "Strict-Transport-Security")));
  assert.ok(headers.some((h) => h.source === "/build-info.json"));
  assert.deepEqual(
    toNextRedirects(rules).filter((r) => r.source.startsWith("/shop-2")),
    [],
  );
});

const HOTLINK = "https://go.hotmart.com/A00000000B";

test("affiliate redirects resolve from the build environment, never from the repository", () => {
  assert.ok(!rules.redirects.some((r) => r.id === "affiliate-alimentacion-bebe"), "skipped without variable");
  assert.doesNotMatch(toHtaccess(rules), /hotmart\.com\/[A-Z0-9]/);

  const withLink = loadEdgeRules(undefined, { NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE: HOTLINK });
  const rule = withLink.redirects.find((r) => r.id === "affiliate-alimentacion-bebe");
  assert.equal(rule?.destination, HOTLINK);
  assert.match(
    toHtaccess(withLink),
    /RewriteRule \^alimentacion-bebe\/\?\$ https:\/\/go\.hotmart\.com\/A00000000B \[R=302,L,QSA,NE\]/,
  );
  assert.deepEqual(
    toNextRedirects(withLink).find((r) => r.source === "/alimentacion-bebe/"),
    { source: "/alimentacion-bebe/", destination: HOTLINK, permanent: false },
  );
});

test("affiliate destinations must be plain https links (Hotmart or the producer's page)", () => {
  assert.ok(isAffiliateUrl(HOTLINK));
  assert.ok(isAffiliateUrl("https://pay.hotmart.com/X1?off=abc&checkoutMode=10"));
  assert.ok(isAffiliateUrl("https://curso.example.com/oferta?ref=A1%2FB&sck=x"));
  assert.ok(!isAffiliateUrl("http://go.hotmart.com/A1"));
  assert.ok(!isAffiliateUrl("https://go.hotmart.com/A1$1"));
  assert.ok(!isAffiliateUrl("https://go.hotmart.com/a b"));
  assert.throws(
    () => loadEdgeRules(undefined, { NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE: "javascript:alert(1)" }),
    /must be a plain https:\/\/ affiliate link/,
  );
  const escaped = toHtaccess(
    loadEdgeRules(undefined, {
      NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE: "https://x.example.com/p?r=A%2F1",
    }),
  );
  assert.match(escaped, /https:\/\/x\.example\.com\/p\?r=A\\%2F1 \[R=302,L,QSA,NE\]/);
});
