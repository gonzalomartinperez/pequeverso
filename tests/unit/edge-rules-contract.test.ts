import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  affiliateEnvNames,
  affiliateSources,
  applyCspMode,
  CHECKOUT_ENV_PATTERN,
  type EdgeRules,
  hstsValue,
  isAffiliateUrl,
  loadEdgeRules,
  resolveEdgeRules,
  toApacheIfExpression,
  toApacheRegex,
  toHtaccess,
  toNextHeaders,
  toNextRedirects,
  validateEdgeRules,
} from "../../tools/lib/edge-rules.ts";

// Behaviour contracts of tools/lib/edge-rules.ts: validation messages, env resolution, CSP mode,
// HSTS rendering, redirect shapes and the Apache translation. Each assertion pins one branch.

type Redirects = EdgeRules["redirects"];
function rules(overrides: Partial<EdgeRules> = {}): EdgeRules {
  return {
    canonicalHost: "example.com",
    hsts: { enabled: true, maxAge: 300, includeSubDomains: false },
    redirects: [],
    headers: [],
    ...overrides,
  };
}
const redirect = (r: Redirects[number]): EdgeRules => rules({ redirects: [r] });
const AFFILIATE = { id: "aff", source: "/aff/", destinationEnv: "NEXT_PUBLIC_CHECKOUT_URL_AFF" };

test("validateEdgeRules: ids and sources", () => {
  assert.throws(
    () => validateEdgeRules(rules({ headers: [{ id: "", source: "/", headers: {} }] })),
    /duplicate or missing id ""/,
  );
  assert.throws(
    () =>
      validateEdgeRules(
        rules({
          redirects: [{ id: "a", source: "/a/", destination: "/b/" }],
          headers: [{ id: "a", source: "/", headers: {} }],
        }),
      ),
    /duplicate or missing id "a"/,
  );
  assert.throws(
    () => validateEdgeRules(redirect({ id: "r", source: "a/", destination: "/b/" })),
    /source must start with "\/" \(r\)/,
  );
  assert.throws(
    () => validateEdgeRules(rules({ headers: [{ id: "h", source: "x", headers: {} }] })),
    /source must start with "\/" \(h\)/,
  );
  validateEdgeRules(
    rules({
      redirects: [{ id: "a", source: "/a/", destination: "/b/" }],
      headers: [{ id: "h", source: "/", headers: {} }],
    }),
  );
});

test("validateEdgeRules: affiliate rules", () => {
  validateEdgeRules(redirect({ ...AFFILIATE, permanent: false }));
  assert.throws(
    () => validateEdgeRules(redirect({ ...AFFILIATE, permanent: false, destinationEnv: "OTHER" })),
    /aff destinationEnv must match NEXT_PUBLIC_CHECKOUT_URL_<PRODUCT>/,
  );
  for (const extra of [
    { destination: "/x/" },
    { gone: true },
    { permanent: true },
    {}, // permanent undefined: affiliate links must be explicitly temporary
  ]) {
    assert.throws(
      () => validateEdgeRules(redirect({ ...AFFILIATE, ...extra })),
      /aff \(affiliate\) must be temporary and have no destination\/gone/,
    );
  }
});

test("validateEdgeRules: plain redirects", () => {
  assert.throws(
    () => validateEdgeRules(redirect({ id: "r", source: "/a/" })),
    /redirect r needs a destination or gone:true/,
  );
  validateEdgeRules(redirect({ id: "r", source: "/a/", gone: true }));
  assert.throws(
    () => validateEdgeRules(redirect({ id: "loop", source: "/a/*", destination: "/a/*/b" })),
    /redirect loop would loop/,
  );
  validateEdgeRules(redirect({ id: "ok", source: "/a/*", destination: "/b" }));
  validateEdgeRules(redirect({ id: "ok2", source: "/a/", destination: "/a/x/" }));
});

test("loadEdgeRules validates the file it loads and affiliate helpers read the same file", () => {
  const dir = mkdtempSync(join(tmpdir(), "edge-rules-"));
  const bad = join(dir, "bad.json");
  writeFileSync(
    bad,
    JSON.stringify(rules({ redirects: [{ id: "x", source: "/x/" }] /* no destination */ })),
  );
  assert.throws(() => loadEdgeRules(bad, {}), /needs a destination/);

  const good = join(dir, "good.json");
  writeFileSync(
    good,
    JSON.stringify(
      rules({
        redirects: [
          { id: "plain", source: "/p/", destination: "/q/" },
          { ...AFFILIATE, permanent: false },
        ],
      }),
    ),
  );
  assert.deepEqual(affiliateEnvNames(good), ["NEXT_PUBLIC_CHECKOUT_URL_AFF"]);
  assert.deepEqual(affiliateSources(good), ["/aff/"]);
  assert.deepEqual(affiliateEnvNames(), ["NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE"]);
  assert.deepEqual(affiliateSources(), ["/alimentacion-bebe/"]);
});

test("affiliate variable names and URLs", () => {
  assert.ok(CHECKOUT_ENV_PATTERN.test("NEXT_PUBLIC_CHECKOUT_URL_A_1"));
  assert.ok(!CHECKOUT_ENV_PATTERN.test("XNEXT_PUBLIC_CHECKOUT_URL_A"));
  assert.ok(!CHECKOUT_ENV_PATTERN.test("NEXT_PUBLIC_CHECKOUT_URL_A-b"));
  assert.ok(!CHECKOUT_ENV_PATTERN.test("NEXT_PUBLIC_CHECKOUT_URL_"));
  assert.equal(isAffiliateUrl("https://localhost/x"), false);
  assert.equal(isAffiliateUrl("http://shop.example.com/x"), false);
  assert.equal(isAffiliateUrl("not a url"), false);
  assert.equal(isAffiliateUrl("https://shop.example.com/x"), true);
});

test("resolveEdgeRules trims, drops empty variables and rejects malformed ones", () => {
  const base = redirect({ ...AFFILIATE, permanent: false });
  const name = "NEXT_PUBLIC_CHECKOUT_URL_AFF";
  const trimmed = resolveEdgeRules(base, { [name]: "  https://shop.example.com/a  " });
  assert.equal(trimmed.redirects[0]?.destination, "https://shop.example.com/a");
  assert.deepEqual(resolveEdgeRules(base, { [name]: "   " }).redirects, []);
  assert.deepEqual(resolveEdgeRules(base, {}).redirects, []);
  assert.throws(
    () => resolveEdgeRules(base, { [name]: "javascript:alert(1)" }),
    /NEXT_PUBLIC_CHECKOUT_URL_AFF must be a plain https:\/\/ affiliate link \(aff\)/,
  );
});

const CSP = "default-src 'self'; connect-src 'self' https://a.example;";
const withCsp = (flag?: boolean): EdgeRules =>
  rules({
    headers: [
      {
        id: "flagged",
        source: "/:path*",
        ...(flag === undefined ? {} : { productAnalyticsConnectOrigin: flag }),
        headers: {
          "Content-Security-Policy": CSP,
          "content-security-policy-report-only": CSP,
          "X-Other": CSP,
        },
      },
    ],
  });
const ANALYTICS = {
  NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "true",
  NEXT_PUBLIC_PRODUCT_ANALYTICS_API_ORIGIN: "https://analytics.example.com",
};

test("analytics origin extends connect-src of flagged CSP headers only", () => {
  const flagged = resolveEdgeRules(withCsp(true), ANALYTICS).headers[0]?.headers;
  const extended =
    "default-src 'self'; connect-src 'self' https://a.example https://analytics.example.com;";
  assert.equal(flagged?.["Content-Security-Policy"], extended);
  assert.equal(flagged?.["content-security-policy-report-only"], extended);
  assert.equal(flagged?.["X-Other"], CSP, "only CSP headers change");
  for (const flag of [false, undefined]) {
    assert.deepEqual(
      resolveEdgeRules(withCsp(flag), ANALYTICS).headers[0]?.headers["Content-Security-Policy"],
      CSP,
    );
  }
  assert.deepEqual(resolveEdgeRules(withCsp(true), {}).headers, withCsp(true).headers);
});

test("CSP_MODE: accepted values, trimming, rejection and exact renaming", () => {
  const headers = withCsp(true).headers;
  assert.equal(applyCspMode(headers, undefined), headers);
  assert.equal(applyCspMode(headers, ""), headers);
  assert.equal(applyCspMode(headers, "enforce"), headers);
  assert.throws(
    () => applyCspMode(headers, "bogus"),
    /edge-rules: CSP_MODE must be empty, "enforce" or "report-only"/,
  );
  const renamed = applyCspMode(
    [
      {
        id: "x",
        source: "/",
        headers: {
          "content-security-policy": "p",
          "Content-Security-Policy-Report-Only": "q",
          "X-Content-Security-Policy": "r",
          "X-Frame-Options": "s",
        },
      },
    ],
    " report-only ",
  );
  assert.deepEqual(renamed[0]?.headers, {
    "Content-Security-Policy-Report-Only": "q",
    "X-Content-Security-Policy": "r",
    "X-Frame-Options": "s",
  });
  // The renamed `content-security-policy` ("p") collapses into the report-only key: last writer wins,
  // and the result must still carry exactly one report-only header and no enforced one.
  assert.equal(Object.keys(renamed[0]?.headers ?? {}).length, 3);
  assert.equal(applyCspMode(headers, "report-only")[0]?.id, "flagged");
  assert.deepEqual(
    applyCspMode(headers, "report-only")[0]?.headers["Content-Security-Policy-Report-Only"],
    CSP,
  );
});

test("HSTS rendering and the disabled switch", () => {
  assert.equal(hstsValue({ enabled: true, maxAge: 300, includeSubDomains: false }), "max-age=300");
  assert.equal(
    hstsValue({ enabled: true, maxAge: 31_536_000, includeSubDomains: true }),
    "max-age=31536000; includeSubDomains",
  );
  const on = rules({ hsts: { enabled: true, maxAge: 604_800, includeSubDomains: false } });
  assert.match(
    toHtaccess(on),
    /Header always set Strict-Transport-Security "max-age=604800" env=HTTPS/,
  );
  assert.deepEqual(toNextHeaders(on)[0], {
    source: "/:path*",
    headers: [{ key: "Strict-Transport-Security", value: "max-age=604800" }],
  });
  const off = rules({ hsts: { enabled: false, maxAge: 604_800, includeSubDomains: true } });
  assert.doesNotMatch(toHtaccess(off), /Strict-Transport-Security/);
  assert.deepEqual(toNextHeaders(off), []);
});

test("toNextRedirects: www to apex rules come first with exact shapes", () => {
  const list = toNextRedirects(
    rules({
      redirects: [
        { id: "a", source: "/a/", destination: "/b/", permanent: true },
        { id: "t", source: "/t/", destination: "/u/", permanent: false },
        { id: "d", source: "/d/", destination: "/v/" },
        { id: "g", source: "/g/", gone: true },
      ],
    }),
  );
  const has = [{ type: "host", value: "www.example.com" }];
  assert.deepEqual(list, [
    { source: "/", has, destination: "https://example.com", permanent: true },
    { source: "/:path+", has, destination: "https://example.com/:path+/", permanent: true },
    { source: "/a/", destination: "/b/", permanent: true },
    { source: "/t/", destination: "/u/", permanent: false },
    { source: "/d/", destination: "/v/", permanent: true },
  ]);
  // A redirect without a destination (skipped affiliate) renders an empty string, never a stub.
  assert.equal(
    toNextRedirects(redirect({ id: "e", source: "/e/", permanent: false })).at(-1)?.destination,
    "",
  );
});

test("toApacheRegex and toApacheIfExpression", () => {
  assert.equal(toApacheRegex("/shop-2/:path*"), "^shop-2/(.*)$");
  assert.equal(toApacheRegex("/a.b/:p*"), "^a\\.b/(.*)$");
  assert.equal(toApacheRegex("/x/*"), "^x/(.*)$");
  assert.equal(toApacheRegex("/a*b"), "^a*b$");
  assert.equal(toApacheRegex("/a/:p*/b"), "^a/:p*/b$");
  assert.equal(toApacheRegex("a/b"), "^a/b$");
  assert.equal(toApacheRegex("/a.b/"), "^a\\.b/?$");
  assert.equal(toApacheIfExpression("/:path*"), null);
  assert.equal(toApacheIfExpression("/:path*.html"), "%{REQUEST_URI} =~ m#^/.*\\.html$#");
  assert.equal(
    toApacheIfExpression("/build-info.json"),
    "%{REQUEST_URI} =~ m#^/build-info\\.json$#",
  );
  assert.equal(toApacheIfExpression("a/b"), "%{REQUEST_URI} =~ m#^/a/b$#");
});

test("toHtaccess: build id comment, escaping and Permissions-Policy quoting", () => {
  const r = rules({
    redirects: [
      { id: "p", source: "/p/", destination: "/q%20r/" },
      { id: "g", source: "/g/", gone: true },
    ],
    headers: [
      {
        id: "h",
        source: "/x/",
        headers: { "Permissions-Policy": 'payment=(self "https://p.example")' },
      },
    ],
  });
  assert.match(toHtaccess(r, { buildId: "abc123" }), /^# build abc123$/m);
  assert.doesNotMatch(toHtaccess(r), /^# build/m);
  const out = toHtaccess(r);
  assert.match(out, /RewriteRule \^p\/\?\$ \/q\\%20r\/ \[R=301,L\]/);
  assert.match(out, /RewriteRule \^g\/\?\$ - \[G,L\]/);
  // A redirect without destination (an affiliate skipped at build time) renders empty, not a stub.
  assert.match(
    toHtaccess(redirect({ id: "e", source: "/e/", permanent: false })),
    /^RewriteRule \^e\/\?\$ {2}\[R=302,L\]$/m,
  );
  assert.match(
    out,
    /Header always set Permissions-Policy "payment=\(self \\"https:\/\/p\.example\\"\)"/,
  );
});

test("the shipped Permissions-Policy delegates payment to the Hotmart checkout only", () => {
  const value =
    loadEdgeRules(undefined, {}).headers.find((h) => h.id === "security")?.headers[
      "Permissions-Policy"
    ] ?? "";
  assert.equal(
    value,
    'camera=(), microphone=(), geolocation=(), payment=(self "https://pay.hotmart.com" "https://pci-pay.hotmart.com"), browsing-topics=()',
  );
  assert.match(
    toHtaccess(loadEdgeRules(undefined, {})),
    /payment=\(self \\"https:\/\/pay\.hotmart\.com\\"/,
  );
});

test("tools/check-env.ts validates CSP_MODE", () => {
  const run = (mode: string) =>
    spawnSync(process.execPath, ["tools/check-env.ts"], {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO: "https://pay.hotmart.com/X1234567",
        CSP_MODE: mode,
      },
    });
  assert.equal(run("bogus").status, 1);
  assert.match(
    run("bogus").stderr + run("bogus").stdout,
    /CSP_MODE must be empty, "enforce" or "report-only"/,
  );
  for (const ok of ["", "enforce", "report-only"])
    assert.equal(run(ok).status, 0, `CSP_MODE=${ok}`);
});
