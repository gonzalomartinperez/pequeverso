import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseAnalyticsEnv } from "../../../config/site-analytics-env.ts";
import { createPublisher } from "../../../src/features/site-analytics/adapters/http.ts";
import { createCollection } from "../../../src/features/site-analytics/application/collection.ts";
import {
  cellOf,
  type Measurement,
  profile,
  routeOf,
  viewportOf,
} from "../../../src/features/site-analytics/domain/profile.ts";
import { loadEdgeRules, toHtaccess, toNextHeaders } from "../../../tools/lib/edge-rules.ts";

test("OFF ignores an unrelated origin; enabled input rejects unsafe origins without echoing them", () => {
  assert.deepEqual(parseAnalyticsEnv({ apiOrigin: "secret" }), { enabled: false });
  assert.deepEqual(parseAnalyticsEnv({ enabled: "false", apiOrigin: "secret" }), { enabled: false });
  for (const apiOrigin of [
    "https://user:private@example.com",
    "https://example.com/path",
    "https://example.com/?private",
    "https://example.com/#private",
    "https://example.com/.",
    "http://example.com",
    "https://localhost:3000",
    "http://localhost:3000",
    "garbage",
  ]) {
    assert.throws(
      () => parseAnalyticsEnv({ enabled: "true", apiOrigin }),
      (error) =>
        error instanceof Error && !error.message.includes(apiOrigin) && !error.message.includes("private"),
    );
  }
  assert.throws(() => parseAnalyticsEnv({ enabled: "TRUE" }));
  assert.deepEqual(parseAnalyticsEnv({ enabled: "true", apiOrigin: "https://analytics.example.com" }), {
    enabled: true,
    endpoint: "https://analytics.example.com/api/v1/analytics/events",
  });
  assert.equal(
    parseAnalyticsEnv({ enabled: "true", apiOrigin: "http://127.0.0.1:49000", localTestBuild: "true" })
      .enabled,
    true,
  );
});

test("only approved routes, sections and coarse cells; never browser URLs or off-grid values", () => {
  assert.equal(routeOf("/grafismo-fonetico"), "/grafismo-fonetico/");
  for (const path of ["/?secret=1", "/#private", "/alimentacion-bebe/", "/panel/", "/gracias/"])
    assert.equal(routeOf(path), null);
  assert.deepEqual(
    [viewportOf(390), viewportOf(768), viewportOf(1024), viewportOf(NaN)],
    ["mobile", "tablet", "desktop", null],
  );
  const box = { left: 10, top: 20, width: 80, height: 80 };
  assert.deepEqual(cellOf(10, 20, box), { x: 0, y: 0 });
  assert.deepEqual(cellOf(90, 100, box), { x: 7, y: 7 });
  for (const [x, y] of [
    [9, 20],
    [91, 20],
    [10, NaN],
  ] as const)
    assert.equal(cellOf(x, y, box), null);
  const schema = JSON.parse(
    readFileSync("contracts/site-analytics/site-experience-pequeverso-v1.schema.json", "utf8"),
  );
  assert.ok(schema);
  assert.deepEqual(Object.keys(profile), ["/", "/grafismo-fonetico/"]);
});

function fixture() {
  let now = 0,
    aborts = 0;
  const events: Measurement[] = [];
  const controller = createCollection({
    uuid: randomUUID,
    viewport: () => "desktop",
    send: (e) => events.push(e),
    abort: () => {
      aborts++;
    },
    now: () => now,
  });
  return {
    controller,
    events,
    aborts: () => aborts,
    time: (value: number) => {
      now = value;
    },
  };
}
test("no default collection; explicit choice, minimised wire, route isolation and revocation", () => {
  const f = fixture(),
    c = f.controller;
  c.navigate("/");
  c.click("hero", 0, 0);
  c.exposure("hero");
  assert.equal(f.events.length, 0);
  c.consent(true);
  c.consent(true);
  c.exposure("hero");
  c.exposure("hero");
  c.click("hero", 7, 7);
  c.click("incluye", 1, 1);
  c.click("hero", 8, 1);
  c.click("hero", 1.2, 1);
  assert.deepEqual(
    f.events.map((e) => e.event_name),
    ["page_view", "section_view", "public_click"],
  );
  assert.deepEqual(
    Object.keys(f.events[0] ?? {}).sort(),
    [
      "event_id",
      "event_name",
      "layout_revision",
      "locale",
      "project",
      "route",
      "schema_version",
      "section_id",
      "source",
      "viewport_bucket",
    ].sort(),
  );
  c.consent(false);
  c.navigate("/grafismo-fonetico/");
  c.click("incluye", 1, 1);
  assert.equal(f.events.length, 3);
  c.consent(true);
  assert.equal(f.events.at(-1)?.route, "/grafismo-fonetico/");
  c.navigate("/alimentacion-bebe/");
  c.click("hero", 1, 1);
  assert.equal(f.events.length, 4);
  c.stop();
  c.consent(true);
  c.navigate("/");
  assert.equal(f.events.length, 4);
  assert.ok(f.aborts() >= 2);
});
test("finite document and minute admission; no replay after a rejected event", () => {
  const f = fixture(),
    c = f.controller;
  c.navigate("/");
  c.consent(true);
  for (let minute = 0; minute < 5; minute++) {
    f.time(minute * 60_000);
    for (let n = 0; n < 50; n++) c.click("hero", 0, 0);
    assert.ok(f.events.length <= Math.min(120, (minute + 1) * 40));
  }
  assert.equal(f.events.length, 120);
});
test("publisher bounds requests, strips credentials and aborts without retry", async () => {
  const requests: RequestInit[] = [];
  const fetcher: typeof fetch = async (_input, init) => {
    assert.ok(init);
    requests.push(init);
    return await new Promise<Response>((_resolve, reject) =>
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
    );
  };
  const publisher = createPublisher("https://analytics.example.com/api/v1/analytics/events", fetcher);
  const f = fixture();
  f.controller.navigate("/");
  f.controller.consent(true);
  const event = f.events[0];
  assert.ok(event);
  for (let n = 0; n < 10; n++) publisher.send(event);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 4);
  for (const req of requests) {
    assert.equal(req.credentials, "omit");
    assert.equal(req.redirect, "error");
    assert.equal(req.referrerPolicy, "no-referrer");
    assert.equal(req.keepalive, false);
    assert.equal(req.method, "POST");
    assert.ok(new TextEncoder().encode(String(req.body)).length <= 1024);
  }
  publisher.abort();
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(requests.every((req) => req.signal?.aborted));
  assert.equal(requests.length, 4);
});
test("both deployment headers add exactly the enabled origin; OFF is unchanged", () => {
  const base = loadEdgeRules(undefined, {}),
    off = loadEdgeRules(undefined, {
      NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "false",
      NEXT_PUBLIC_PRODUCT_ANALYTICS_API_ORIGIN: "invalid",
    });
  assert.deepEqual(off, base);
  const on = loadEdgeRules(undefined, {
    NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "true",
    NEXT_PUBLIC_PRODUCT_ANALYTICS_API_ORIGIN: "https://analytics.example.com",
  });
  assert.equal(on.redirects.length, base.redirects.length);
  assert.ok(toHtaccess(on).includes("https://analytics.example.com;"));
  assert.ok(JSON.stringify(toNextHeaders(on)).includes("https://analytics.example.com;"));
  assert.ok(!toHtaccess(base).includes("analytics.example.com"));
});

test("site analytics preserves layer direction and closed composition ownership", async () => {
  const { sourceFiles, sourceModule, sourceTarget } = await import("../../helpers/source-architecture.ts");
  const root = "src/features/site-analytics/";
  for (const file of sourceFiles(root)) {
    const layer = file.slice(root.length).split("/")[0];
    for (const { specifier } of sourceModule(file).imports) {
      assert.ok(specifier, "no runtime-selected import in collection layers");
      const target = sourceTarget(file, specifier);
      if (layer === "domain") assert.ok(target?.startsWith(`${root}domain/`), file);
      if (layer === "application")
        assert.ok(target?.startsWith(`${root}domain/`) || target?.startsWith(`${root}application/`), file);
      if (layer === "adapters")
        assert.ok(
          ["domain/", "application/", "adapters/"].some((part) => target?.startsWith(root + part)),
          file,
        );
    }
  }
});

test("analytics grant expires independently; failed writes cannot reactivate a revoked document", async () => {
  const { explicitGrant, createConsentGate } = await import(
    "../../../src/features/site-analytics/domain/consent.ts"
  );
  const now = Date.parse("2026-10-19T00:00:00.000Z");
  const grant = {
    version: 2,
    analytics: true,
    marketing: true,
    updatedAt: new Date(now - 1000).toISOString(),
  };
  assert.equal(explicitGrant(grant, now), true);
  for (const updatedAt of [
    "",
    "invalid",
    "2026-10-19",
    new Date(now + 1).toISOString(),
    new Date(now - 180 * 86400000).toISOString(),
  ])
    assert.equal(explicitGrant({ ...grant, updatedAt }, now), false);
  for (const value of [
    null,
    {},
    { ...grant, analytics: false },
    { ...grant, version: 1 },
    { ...grant, updatedAt: undefined },
  ])
    assert.equal(explicitGrant(value, now), false);
  const gate = createConsentGate();
  assert.equal(gate.allows(grant, now), true);
  gate.withdraw(grant);
  // Simulated persistence failure: the old readable grant remains unchanged.
  assert.equal(gate.allows(grant, now), false);
  gate.persisted(grant, grant, now);
  assert.equal(gate.allows(grant, now), false);
  const fresh = { ...grant, updatedAt: new Date(now).toISOString() };
  gate.persisted(fresh, grant, now);
  assert.equal(gate.allows(grant, now), false);
  gate.persisted(fresh, fresh, now);
  assert.equal(gate.allows(fresh, now), true);
  assert.equal(gate.allows(fresh, now + 180 * 86400000), false);
});
