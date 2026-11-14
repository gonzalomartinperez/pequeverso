import assert from "node:assert/strict";
import { test } from "node:test";
import { hstsValue, loadEdgeRules, toHtaccess, toNextHeaders } from "../../tools/lib/edge-rules.ts";

// ADR-0014: the enforced policy and the staged HSTS plan are reviewed contracts.
const rules = loadEdgeRules(undefined, {});
const security = rules.headers.find((rule) => rule.id === "security");
const csp = security?.headers["Content-Security-Policy"] ?? "";

function directive(name: string): string[] {
  const found = csp.split(";").map((part) => part.trim().split(/\s+/));
  return found.find(([head]) => head === name)?.slice(1) ?? [];
}

test("the policy is enforced (not report-only) on both targets", () => {
  assert.ok(csp, "Content-Security-Policy must be set");
  assert.equal(security?.headers["Content-Security-Policy-Report-Only"], undefined);
  assert.match(toHtaccess(rules), /Header always set Content-Security-Policy "default-src/);
  assert.ok(
    toNextHeaders(rules).some((rule) =>
      rule.headers.some((header) => header.key === "Content-Security-Policy"),
    ),
  );
});

test("script-src: only the documented hosts, inline kept, never eval", () => {
  assert.deepEqual(directive("script-src"), [
    "'self'",
    "'unsafe-inline'",
    "https://checkout.hotmart.com",
    "https://*.hotmart.com",
    "https://connect.facebook.net",
    "https://cloud.umami.is",
  ]);
  assert.doesNotMatch(csp, /unsafe-eval|wasm-unsafe-eval/);
});

test("strict directives stay strict", () => {
  assert.deepEqual(directive("default-src"), ["'self'"]);
  assert.deepEqual(directive("object-src"), ["'none'"]);
  assert.deepEqual(directive("base-uri"), ["'self'"]);
  assert.deepEqual(directive("frame-ancestors"), ["'self'"]);
  assert.deepEqual(directive("font-src"), ["'self'"]);
  assert.deepEqual(directive("form-action"), ["'self'", "https://*.hotmart.com"]);
  assert.doesNotMatch(directive("style-src").join(" "), /https:/);
});

test("the Cloudflare Web Analytics beacon and the disabled assistant API are not allowed", () => {
  assert.doesNotMatch(csp, /cloudflareinsights/);
  assert.doesNotMatch(csp, /assistant/i);
});

test("analytics origin is appended to the enforced connect-src only when enabled", () => {
  const enabled = loadEdgeRules(undefined, {
    NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "true",
    NEXT_PUBLIC_PRODUCT_ANALYTICS_API_ORIGIN: "https://analytics.example.com",
  });
  const value = enabled.headers.find((rule) => rule.id === "security")?.headers[
    "Content-Security-Policy"
  ];
  assert.match(value ?? "", /connect-src [^;]*https:\/\/analytics\.example\.com;/);
  assert.doesNotMatch(csp, /analytics\.example\.com/);
});

test("HSTS is staged: the active stage is in the plan, the last stage is one year, no preload", () => {
  const { hsts } = rules;
  const plan = hsts.rollout ?? [];
  assert.ok(plan.length >= 3);
  assert.equal(
    hsts.maxAge,
    604_800,
    "the shipped stage is one week until the owner gates the next",
  );
  assert.equal(hsts.includeSubDomains, false);
  assert.ok(
    plan.some((s) => s.maxAge === hsts.maxAge && s.includeSubDomains === hsts.includeSubDomains),
  );
  assert.deepEqual(
    plan.map((s) => s.maxAge),
    [...plan.map((s) => s.maxAge)].sort((a, b) => a - b),
  );
  for (const stage of plan.slice(0, -1)) assert.equal(stage.includeSubDomains, false);
  const last = plan.at(-1);
  assert.equal(last?.maxAge, 31_536_000);
  assert.equal(last?.includeSubDomains, true);
  assert.doesNotMatch(hstsValue(hsts), /preload/i);
  const sts = toNextHeaders(rules)
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === "Strict-Transport-Security");
  assert.equal(sts?.value, "max-age=604800");
  assert.doesNotMatch(JSON.stringify(toNextHeaders(rules)), /preload/i);
  assert.doesNotMatch(toHtaccess(rules), /preload/i);
});

test("CSP_MODE=report-only moves the same policy to the report-only header on both targets", () => {
  const relaxed = loadEdgeRules(undefined, { CSP_MODE: "report-only" });
  const header = relaxed.headers.find((rule) => rule.id === "security")?.headers;
  assert.equal(header?.["Content-Security-Policy"], undefined);
  assert.equal(header?.["Content-Security-Policy-Report-Only"], csp);
  assert.match(
    toHtaccess(relaxed),
    /Header always set Content-Security-Policy-Report-Only "default-src/,
  );
  assert.doesNotMatch(toHtaccess(relaxed), /Header always set Content-Security-Policy "/);
  assert.ok(
    toNextHeaders(relaxed).some((rule) =>
      rule.headers.some((h) => h.key === "Content-Security-Policy-Report-Only"),
    ),
  );
});

test("CSP_MODE empty or enforce keeps the golden enforced policy; junk fails", () => {
  for (const mode of ["", "enforce", " enforce "]) {
    const same = loadEdgeRules(undefined, { CSP_MODE: mode });
    assert.equal(toHtaccess(same), toHtaccess(rules));
  }
  assert.throws(() => loadEdgeRules(undefined, { CSP_MODE: "off" }), /CSP_MODE/);
});

test("Permissions-Policy delegates payment to the Hotmart checkout origins only", () => {
  const value = security?.headers["Permissions-Policy"] ?? "";
  assert.match(
    value,
    /payment=\(self "https:\/\/pay\.hotmart\.com" "https:\/\/pci-pay\.hotmart\.com"\)/,
  );
});
