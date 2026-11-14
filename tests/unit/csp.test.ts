import assert from "node:assert/strict";
import { test } from "node:test";
import { loadEdgeRules, toHtaccess, toNextHeaders } from "../../tools/lib/edge-rules.ts";

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
  assert.ok(
    plan.some((s) => s.maxAge === hsts.maxAge && s.includeSubDomains === hsts.includeSubDomains),
  );
  assert.deepEqual(
    plan.map((s) => s.maxAge),
    [...plan.map((s) => s.maxAge)].sort((a, b) => a - b),
  );
  const last = plan.at(-1);
  assert.equal(last?.maxAge, 31_536_000);
  assert.equal(last?.includeSubDomains, true);
  assert.doesNotMatch(toHtaccess(rules), /preload/i);
});
