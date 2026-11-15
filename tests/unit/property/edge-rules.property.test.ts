import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import type { EdgeRules } from "../../../tools/lib/edge-rules.ts";
import {
  affiliateEnvNames,
  loadEdgeRules,
  toHtaccess,
  toNextHeaders,
  toNextRedirects,
  validateEdgeRules,
} from "../../../tools/lib/edge-rules.ts";
import { numRuns, seed } from "./runs.ts";

const segment = fc.stringMatching(/^[a-z][a-z0-9-]{0,12}$/);
const rule = fc.record({
  segment,
  wildcard: fc.boolean(),
  permanent: fc.boolean(),
  value: fc.stringMatching(/^[a-z0-9 ;="%]{0,30}$/),
});

type RuleInput = { segment: string; wildcard: boolean; permanent: boolean; value: string };
type NextRedirect = ReturnType<typeof toNextRedirects>[number];
type NextHeader = ReturnType<typeof toNextHeaders>[number];

function generatedRules(
  inputs: RuleInput[],
  enabled: boolean,
  includeSubDomains: boolean,
  maxAge: number,
): EdgeRules {
  return {
    canonicalHost: "site.example",
    hsts: { enabled, includeSubDomains, maxAge },
    redirects: inputs.map((input, index) => ({
      id: `r${index}`,
      source: `/from-${index}/${input.segment}/${input.wildcard ? ":path*" : ""}`,
      destination: `/to-${index}/${input.wildcard ? ":path*" : ""}?code=a%2Fb`,
      permanent: input.permanent,
    })),
    headers: inputs.map((input, index) => ({
      id: `h${index}`,
      source: input.wildcard ? `/assets-${index}/:path*` : `/file-${index}.json`,
      headers: { [`X-Test-${index}`]: input.value },
    })),
  };
}

/** One generated redirect: the Apache line matches the same paths and destination as Next. */
function assertRedirectAgrees(
  lines: string[],
  redirect: NextRedirect,
  index: number,
  wildcard: boolean | undefined,
): void {
  const marker = lines.indexOf(`# r${index}`);
  const parsed = /^RewriteRule (\S+) (\S+) \[R=(301|302),L\]$/.exec(lines[marker + 1] ?? "");
  assert.ok(parsed);
  // Next uses 308/307 for permanent/temporary; Apache intentionally uses 301/302.
  assert.equal(parsed[3], redirect.permanent ? "301" : "302");
  const pattern = new RegExp(parsed[1] as string);
  for (const suffix of wildcard ? ["", "one", "one/two/"] : [""]) {
    const path = redirect.source.replace(":path*", suffix);
    const matched = pattern.exec(path.slice(1));
    assert.ok(matched, path);
    const destination: string = (parsed[2] as string)
      .replace(/\\%/g, "%")
      .replace("$1", matched[1] ?? "");
    assert.equal(destination, redirect.destination.replace(":path*", suffix));
  }
  assert.equal(pattern.test(`other-${index}/`), false);
}

/** One generated header rule: the Apache block matches the same path and header as Next. */
function assertHeaderAgrees(lines: string[], header: NextHeader, index: number, value: string) {
  const marker = lines.indexOf(`# h${index}`);
  const expression = /^<If "%\{REQUEST_URI\} =~ m#(.*)#">$/.exec(lines[marker + 1] ?? "");
  assert.ok(expression);
  const path = header.source.replace(":path*", "nested/item");
  assert.ok(new RegExp(expression[1] as string).test(path));
  assert.equal(new RegExp(expression[1] as string).test(`/unrelated-${index}/`), false);
  const wire = /^\s*Header always set (\S+) "(.*)"$/.exec(lines[marker + 2] ?? "");
  assert.ok(wire);
  assert.deepEqual(header.headers, [
    { key: wire[1], value: (wire[2] as string).replace(/\\"/g, '"') },
  ]);
  assert.equal(header.headers[0]?.value, value);
}

function assertGeneratedHsts(
  headers: NextHeader[],
  apache: string,
  includeSubDomains: boolean,
  maxAge: number,
): void {
  const value = `max-age=${maxAge}${includeSubDomains ? "; includeSubDomains" : ""}`;
  assert.deepEqual(headers[0]?.headers, [{ key: "Strict-Transport-Security", value }]);
  assert.ok(apache.includes(`Header always set Strict-Transport-Security "${value}" env=HTTPS`));
}

function assertGeneratedAgreement(
  inputs: RuleInput[],
  enabled: boolean,
  includeSubDomains: boolean,
  maxAge: number,
): void {
  const rules = generatedRules(inputs, enabled, includeSubDomains, maxAge);
  validateEdgeRules(rules);
  const apache = toHtaccess(rules);
  const redirects = toNextRedirects(rules).filter((redirect) => !redirect.has);
  assert.equal(redirects.length, inputs.length);
  const lines = apache.split("\n");
  for (const [index, redirect] of redirects.entries())
    assertRedirectAgrees(lines, redirect, index, inputs[index]?.wildcard);
  const headers = toNextHeaders(rules);
  assert.equal(headers.length, inputs.length + Number(enabled));
  for (const [index, input] of inputs.entries()) {
    const header = headers[index + Number(enabled)];
    assert.ok(header);
    assertHeaderAgrees(lines, header, index, input.value);
  }
  if (enabled) assertGeneratedHsts(headers, apache, includeSubDomains, maxAge);
}

test("Apache and Next render equivalent redirect matches, destinations, permanence and headers", () => {
  // Common supported syntax: literals and terminal :path*. Gone rules intentionally have no Next redirect.
  fc.assert(
    fc.property(
      fc.array(rule, { maxLength: 12 }),
      fc.boolean(),
      fc.boolean(),
      fc.nat({ max: 63_072_000 }),
      assertGeneratedAgreement,
    ),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

type EdgeRule = EdgeRules["redirects"][number];
type EdgeHeaderRule = EdgeRules["headers"][number];
const PATH_PARAM = /:[a-zA-Z0-9_]+\*/g;

/** A real redirect rule: Apache and Next agree on the match, destination and flags. */
function assertRealRedirect(
  rule: EdgeRule,
  lines: string[],
  redirects: NextRedirect[],
  suffix: string,
): void {
  const marker = lines.findIndex(
    (line) => line === `# ${rule.id}` || line.startsWith(`# ${rule.id}:`),
  );
  assert.ok(marker >= 0, rule.id);
  const wire = /^RewriteRule (\S+) (\S+) \[(.*)\]$/.exec(lines[marker + 1] ?? "");
  assert.ok(wire, rule.id);
  const path = rule.source.replace(PATH_PARAM, suffix);
  const match = new RegExp(wire[1] as string).exec(path.slice(1));
  assert.ok(match, path);
  const next = redirects.find((redirect) => redirect.source === rule.source);
  if (rule.gone) {
    // Apache owns 410 Gone; Next deliberately emits no redirect for these paths.
    assert.equal(next, undefined);
    assert.equal(wire[2], "-");
    assert.equal(wire[3], "G,L");
    return;
  }
  assert.ok(next, rule.id);
  assert.equal(
    (wire[2] as string).replace(/\\%/g, "%").replace("$1", match[1] ?? ""),
    next.destination.replace(PATH_PARAM, suffix),
  );
  assert.equal(wire[3], `R=${next.permanent ? 301 : 302},L${rule.destinationEnv ? ",QSA,NE" : ""}`);
}

/** A real header rule: Apache and Next agree on the path match and header lines. */
function assertRealHeader(
  rule: EdgeHeaderRule,
  lines: string[],
  headers: NextHeader[],
  suffix: string,
): void {
  const marker = lines.indexOf(`# ${rule.id}`);
  assert.ok(marker >= 0, rule.id);
  const next = headers.find(
    (header) =>
      header.source === rule.source &&
      header.headers.some((header) => header.key !== "Strict-Transport-Security"),
  );
  assert.ok(next, rule.id);
  const path = rule.source.replace(PATH_PARAM, suffix);
  const expression = /^<If "%\{REQUEST_URI\} =~ m#(.*)#">$/.exec(lines[marker + 1] ?? "");
  if (rule.source !== "/:path*") {
    assert.ok(expression, rule.id);
    assert.ok(new RegExp(expression[1] as string).test(path), path);
  } else assert.equal(expression, null);
  const start = marker + (expression ? 2 : 1);
  const apacheHeaders = next.headers.map((_header, index) => {
    const wire = /^\s*Header always set (\S+) "(.*)"$/.exec(lines[start + index] ?? "");
    assert.ok(wire, rule.id);
    return { key: wire[1], value: (wire[2] as string).replace(/\\"/g, '"') };
  });
  assert.deepEqual(apacheHeaders, next.headers);
  assert.equal(apacheHeaders.length, Object.keys(rule.headers).length);
}

function assertRealHsts(headers: NextHeader[], lines: string[]): void {
  const hsts = headers.find((header) =>
    header.headers.some((entry) => entry.key === "Strict-Transport-Security"),
  );
  assert.ok(hsts);
  assert.ok(
    lines.includes(
      `Header always set Strict-Transport-Security "${hsts.headers[0]?.value}" env=HTTPS`,
    ),
  );
}

test("every real edge rule agrees across Apache and Next for generated request paths", () => {
  const rules = loadEdgeRules(
    undefined,
    Object.fromEntries(
      affiliateEnvNames().map((name) => [name, "https://affiliate.example/offer?code=a%2Fb"]),
    ),
  );
  const lines = toHtaccess(rules).split("\n");
  const redirects = toNextRedirects(rules).filter((redirect) => !redirect.has);
  const headers = toNextHeaders(rules);
  fc.assert(
    fc.property(fc.array(segment, { maxLength: 6 }), (segments) => {
      const suffix = segments.join("/");
      for (const rule of rules.redirects) assertRealRedirect(rule, lines, redirects, suffix);
      for (const rule of rules.headers) assertRealHeader(rule, lines, headers, suffix);
      if (rules.hsts.enabled) assertRealHsts(headers, lines);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});
