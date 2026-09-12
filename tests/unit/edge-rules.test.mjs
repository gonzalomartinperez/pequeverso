import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  loadEdgeRules,
  toApacheRegex,
  toHtaccess,
  toNextHeaders,
  toNextRedirects,
} from "../../scripts/lib/edge-rules.mjs";

const rules = loadEdgeRules();

test("edge rules validate and stay in sync with the committed golden .htaccess", () => {
  const golden = readFileSync(new URL("../../docs/generated/htaccess.txt", import.meta.url), "utf8");
  assert.equal(
    toHtaccess(rules),
    golden,
    "run `node scripts/gen-htaccess.mjs` and commit docs/generated/htaccess.txt",
  );
});

test("apache regexes never carry a leading slash (per-directory context)", () => {
  assert.equal(toApacheRegex("/shop-2/:path*"), "^shop-2/(.*)$");
  assert.equal(toApacheRegex("/grafismo-fonetico/"), "^grafismo-fonetico/$");
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
