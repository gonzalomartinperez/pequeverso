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

test("Apache and Next render equivalent redirect matches, destinations, permanence and headers", () => {
  // Common supported syntax: literals and terminal :path*. Gone rules intentionally have no Next redirect.
  fc.assert(
    fc.property(
      fc.array(rule, { maxLength: 12 }),
      fc.boolean(),
      fc.boolean(),
      fc.nat({ max: 63_072_000 }),
      (inputs, enabled, includeSubDomains, maxAge) => {
        const rules: EdgeRules = {
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
        validateEdgeRules(rules);
        const apache = toHtaccess(rules);
        const redirects = toNextRedirects(rules).filter((redirect) => !redirect.has);
        assert.equal(redirects.length, inputs.length);
        const lines = apache.split("\n");
        for (const [index, redirect] of redirects.entries()) {
          const marker = lines.indexOf(`# r${index}`);
          const parsed = /^RewriteRule (\S+) (\S+) \[R=(301|302),L\]$/.exec(
            lines[marker + 1] ?? "",
          );
          assert.ok(parsed);
          // Next uses 308/307 for permanent/temporary; Apache intentionally uses 301/302.
          assert.equal(parsed[3], redirect.permanent ? "301" : "302");
          const pattern = new RegExp(parsed[1] as string);
          const wildcard = inputs[index]?.wildcard;
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
        const headers = toNextHeaders(rules);
        assert.equal(headers.length, inputs.length + Number(enabled));
        for (const [index, input] of inputs.entries()) {
          const header = headers[index + Number(enabled)];
          assert.ok(header);
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
          assert.equal(header.headers[0]?.value, input.value);
        }
        if (enabled) {
          const value = `max-age=${maxAge}${includeSubDomains ? "; includeSubDomains" : ""}`;
          assert.deepEqual(headers[0]?.headers, [{ key: "Strict-Transport-Security", value }]);
          assert.ok(
            apache.includes(`Header always set Strict-Transport-Security "${value}" env=HTTPS`),
          );
        }
      },
    ),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

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
      for (const rule of rules.redirects) {
        const marker = lines.findIndex(
          (line) => line === `# ${rule.id}` || line.startsWith(`# ${rule.id}:`),
        );
        assert.ok(marker >= 0, rule.id);
        const wire = /^RewriteRule (\S+) (\S+) \[(.*)\]$/.exec(lines[marker + 1] ?? "");
        assert.ok(wire, rule.id);
        const path = rule.source.replace(/:[a-zA-Z0-9_]+\*/g, suffix);
        const match = new RegExp(wire[1] as string).exec(path.slice(1));
        assert.ok(match, path);
        const next = redirects.find((redirect) => redirect.source === rule.source);
        if (rule.gone) {
          // Apache owns 410 Gone; Next deliberately emits no redirect for these paths.
          assert.equal(next, undefined);
          assert.equal(wire[2], "-");
          assert.equal(wire[3], "G,L");
        } else {
          assert.ok(next, rule.id);
          assert.equal(
            (wire[2] as string).replace(/\\%/g, "%").replace("$1", match[1] ?? ""),
            next.destination.replace(/:[a-zA-Z0-9_]+\*/g, suffix),
          );
          assert.equal(
            wire[3],
            `R=${next.permanent ? 301 : 302},L${rule.destinationEnv ? ",QSA,NE" : ""}`,
          );
        }
      }
      for (const rule of rules.headers) {
        const marker = lines.indexOf(`# ${rule.id}`);
        assert.ok(marker >= 0, rule.id);
        const next = headers.find(
          (header) =>
            header.source === rule.source &&
            header.headers.some((header) => header.key !== "Strict-Transport-Security"),
        );
        assert.ok(next, rule.id);
        const path = rule.source.replace(/:[a-zA-Z0-9_]+\*/g, suffix);
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
      if (rules.hsts.enabled) {
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
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});
