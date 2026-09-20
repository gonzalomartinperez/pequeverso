import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import {
  createMetaCapiHandler,
  GRAPH_API_VERSION,
  META_CAPI_PATH,
  metaCapiOptionsFromEnv,
} from "../../server/meta-capi.mjs";

const PIXEL = "1234567890123456";
const TOKEN = "EAAB".padEnd(64, "x");
const NOW = 1_800_000_000_000;
const UUID = "3f1c2a9e-5b7d-4c8e-9a1b-2c3d4e5f6a7b";

function event(overrides = {}) {
  return {
    name: "ViewContent",
    eventId: UUID,
    time: NOW - 1000,
    sourceUrl: "https://pequeverso.com/grafismo-fonetico/?fbclid=abc",
    params: { content_ids: "gf", value: 19.9, currency: "USD" },
    ...overrides,
  };
}

/** Fake Graph API: records requests, answers from a queue of statuses (default 200). */
function fakeFetch(statuses = []) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init, body: JSON.parse(init.body) });
    const status = statuses.shift() ?? 200;
    return new Response(JSON.stringify(status >= 400 ? { error: { code: 190, fbtrace_id: "t1" } } : {}), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  return { calls, fetchImpl };
}

async function withServer(handler, run) {
  const server = createServer(async (req, res) => {
    if (await handler(req, res)) return;
    res.writeHead(200, { "content-type": "text/plain" }).end("fallthrough");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    await run(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function post(base, body, { headers = {} } = {}) {
  return fetch(`${base}${META_CAPI_PATH}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function enabledHandler(extra = {}) {
  const fake = fakeFetch(extra.statuses);
  const logs = [];
  const results = [];
  const handler = createMetaCapiHandler({
    pixelId: PIXEL,
    accessToken: TOKEN,
    fetchImpl: fake.fetchImpl,
    now: () => NOW,
    log: (line) => logs.push(line),
    onResult: (result) => results.push(result),
    ...extra.options,
  });
  return { handler, calls: fake.calls, logs, results };
}

test("other paths return false so the caller continues; only POST on the relay path", async () => {
  const { handler, calls } = enabledHandler();
  await withServer(handler, async (base) => {
    const other = await fetch(`${base}/grafismo-fonetico/`);
    assert.equal(await other.text(), "fallthrough");
    const get = await fetch(`${base}${META_CAPI_PATH}`);
    assert.equal(get.status, 405);
    assert.equal(get.headers.get("allow"), "POST");
    assert.equal(get.headers.get("cache-control"), "no-store");
  });
  assert.equal(calls.length, 0);
});

test("disabled (no token or no pixel) answers 204 and never calls Meta", async () => {
  for (const options of [
    { pixelId: "", accessToken: TOKEN },
    { pixelId: PIXEL, accessToken: "" },
  ]) {
    const fake = fakeFetch();
    const handler = createMetaCapiHandler({ ...options, fetchImpl: fake.fetchImpl });
    await withServer(handler, async (base) => {
      const res = await post(base, { events: [event()] });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get("cache-control"), "no-store");
    });
    assert.equal(fake.calls.length, 0);
  }
});

test("validation matrix: bad JSON, forbidden event, unknown param, oversized body, bad ids and urls", async () => {
  const { handler, calls } = enabledHandler();
  await withServer(handler, async (base) => {
    const cases = [
      ["{not json", 400, "json"],
      [{ events: [] }, 400, "events"],
      [{ events: Array.from({ length: 11 }, () => event()) }, 400, "events"],
      [{ events: [event({ name: "Purchase" })] }, 400, "name"],
      [{ events: [event({ name: "InitiateCheckout" })] }, 400, "name"],
      [{ events: [event({ name: "Lead" })] }, 400, "name"],
      [{ events: [event({ eventId: "not-a-uuid" })] }, 400, "eventId"],
      [{ events: [event({ eventId: "3f1c2a9e-5b7d-1c8e-9a1b-2c3d4e5f6a7b" })] }, 400, "eventId"],
      [{ events: [event({ time: "now" })] }, 400, "time"],
      [{ events: [event({ sourceUrl: "https://evil.example/" })] }, 400, "sourceUrl"],
      [{ events: [event({ sourceUrl: "not a url" })] }, 400, "sourceUrl"],
      [{ events: [event({ params: { email: "a@b.c" } })] }, 400, "params"],
      [{ events: [event({ params: { value: Number.NaN } })] }, 400, "params"],
      [{ events: [event({ params: { content_name: "x".repeat(201) } })] }, 400, "params"],
      [{ events: [event({ params: ["a"] })] }, 400, "params"],
      [{ events: [event({ fbp: "<script>" })] }, 400, "fbp"],
      [{ events: [event({ fbc: "fb.1.x" })] }, 400, "fbc"],
      [{ events: [event({ params: { content_name: "x".repeat(20_000) } })] }, 413, "size"],
    ];
    for (const [body, status, reason] of cases) {
      const res = await post(base, body);
      assert.equal(res.status, status, `${reason} → ${res.status}`);
      const json = await res.json();
      assert.deepEqual(json, { error: reason });
    }
    const wrongType = await post(base, { events: [event()] }, { headers: { "content-type": "text/plain" } });
    assert.equal(wrongType.status, 415);
    const badOrigin = await post(
      base,
      { events: [event()] },
      { headers: { origin: "https://evil.example" } },
    );
    assert.equal(badOrigin.status, 403);
  });
  assert.equal(calls.length, 0);
});

test("valid batch: 202 at once, then Graph API payload with bearer token, ids, ip and user agent", async () => {
  const { handler, calls, logs, results } = enabledHandler();
  await withServer(handler, async (base) => {
    const res = await post(
      base,
      {
        events: [
          event({ fbp: "fb.1.1700000000000.123456", fbc: "fb.1.1700000000000.IwAR2abc_def-ghi" }),
          event({
            name: "CheckoutIntent",
            eventId: UUID.replace("3f1c", "aaaa"),
            time: NOW + 60 * 60 * 1000,
            params: { product: "gf", offer: "main", cta_position: "hero" },
          }),
          event({
            name: "PageView",
            eventId: UUID.replace("3f1c", "bbbb"),
            time: NOW - 3_600_000,
            params: {},
          }),
        ],
      },
      {
        headers: {
          origin: "https://pequeverso.com",
          "cf-connecting-ip": "203.0.113.7",
          "x-forwarded-for": "198.51.100.1, 10.0.0.1",
          "user-agent": "Mozilla/5.0 (test)",
        },
      },
    );
    assert.equal(res.status, 202);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(await res.text(), "");
    await Promise.all(handler.pending);
  });
  assert.equal(calls.length, 1);
  const [call] = calls;
  assert.equal(call.url, `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL}/events`);
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers["Content-Type"], "application/json");
  assert.equal(call.init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.ok(call.init.signal instanceof AbortSignal);
  assert.equal("access_token" in call.body, false, "token travels in the header, never the body or url");
  assert.equal(call.url.includes(TOKEN), false);
  assert.equal(call.body.data.length, 3);
  assert.deepEqual(call.body.data[0], {
    event_name: "ViewContent",
    event_time: Math.floor((NOW - 1000) / 1000),
    event_id: UUID,
    event_source_url: "https://pequeverso.com/grafismo-fonetico/?fbclid=abc",
    action_source: "website",
    user_data: {
      client_ip_address: "203.0.113.7",
      client_user_agent: "Mozilla/5.0 (test)",
      fbp: "fb.1.1700000000000.123456",
      fbc: "fb.1.1700000000000.IwAR2abc_def-ghi",
    },
    custom_data: { content_ids: "gf", value: 19.9, currency: "USD" },
  });
  assert.equal(call.body.data[1].event_name, "CheckoutIntent");
  assert.equal(call.body.data[1].event_time, Math.floor(NOW / 1000), "future time clamped to now");
  assert.equal(call.body.data[2].event_time, Math.floor((NOW - 10 * 60 * 1000) / 1000), "old time clamped");
  assert.equal("custom_data" in call.body.data[2], false);
  assert.deepEqual(call.body.data[2].user_data, {
    client_ip_address: "203.0.113.7",
    client_user_agent: "Mozilla/5.0 (test)",
  });
  assert.deepEqual(logs, []);
  assert.deepEqual(results, [{ status: 200, ok: true, attempts: 1 }]);
});

test("client ip falls back to the first x-forwarded-for entry, then the socket; host origin accepted", async () => {
  const { handler, calls } = enabledHandler();
  await withServer(handler, async (base) => {
    const host = new URL(base).host;
    const viaXff = await post(
      base,
      { events: [event({ sourceUrl: `http://${host}/` })] },
      { headers: { origin: `http://${host}`, "x-forwarded-for": "198.51.100.1, 10.0.0.1" } },
    );
    assert.equal(viaXff.status, 202);
    const viaSocket = await post(base, { events: [event({ sourceUrl: `http://${host}/x/` })] });
    assert.equal(viaSocket.status, 202);
    await Promise.all(handler.pending);
  });
  assert.equal(calls[0].body.data[0].user_data.client_ip_address, "198.51.100.1");
  assert.equal(calls[1].body.data[0].user_data.client_ip_address, "127.0.0.1");
});

test("retries once on 429/5xx and on network errors, never on other 4xx; failures are logged without the token", async () => {
  const fiveThenOk = enabledHandler({ statuses: [503, 200] });
  await withServer(fiveThenOk.handler, async (base) => {
    assert.equal((await post(base, { events: [event()] })).status, 202);
    await Promise.all(fiveThenOk.handler.pending);
  });
  assert.equal(fiveThenOk.calls.length, 2);
  assert.deepEqual(fiveThenOk.logs, []);
  assert.deepEqual(fiveThenOk.results, [{ status: 200, ok: true, attempts: 2 }]);

  const fiveTwice = enabledHandler({ statuses: [500, 502] });
  await withServer(fiveTwice.handler, async (base) => {
    assert.equal((await post(base, { events: [event()] })).status, 202);
    await Promise.all(fiveTwice.handler.pending);
  });
  assert.equal(fiveTwice.calls.length, 2);
  assert.deepEqual(fiveTwice.logs, ["meta-capi: upstream 5xx 502 code=190 fbtrace=t1"]);
  assert.deepEqual(fiveTwice.results, [{ status: 502, ok: false, attempts: 2 }]);

  const throttled = enabledHandler({ statuses: [429, 200] });
  await withServer(throttled.handler, async (base) => {
    assert.equal((await post(base, { events: [event()] })).status, 202);
    await Promise.all(throttled.handler.pending);
  });
  assert.equal(throttled.calls.length, 2);
  assert.deepEqual(throttled.results, [{ status: 200, ok: true, attempts: 2 }]);

  const fourHundred = enabledHandler({ statuses: [400] });
  await withServer(fourHundred.handler, async (base) => {
    assert.equal((await post(base, { events: [event()] })).status, 202);
    await Promise.all(fourHundred.handler.pending);
  });
  assert.equal(fourHundred.calls.length, 1);
  assert.deepEqual(fourHundred.logs, ["meta-capi: upstream 4xx 400 code=190 fbtrace=t1"]);
  assert.ok(fourHundred.logs.every((line) => !line.includes(TOKEN)));

  let attempts = 0;
  const logs = [];
  const results = [];
  const flaky = createMetaCapiHandler({
    pixelId: PIXEL,
    accessToken: TOKEN,
    fetchImpl: async () => {
      attempts += 1;
      throw Object.assign(new Error("timeout"), { name: "TimeoutError" });
    },
    log: (line) => logs.push(line),
    onResult: (result) => results.push(result),
  });
  await withServer(flaky, async (base) => {
    assert.equal((await post(base, { events: [event()] })).status, 202);
    await Promise.all(flaky.pending);
  });
  assert.equal(attempts, 2);
  assert.deepEqual(logs, ["meta-capi: upstream error TimeoutError"]);
  assert.deepEqual(results, [{ status: 0, ok: false, attempts: 2 }]);
});

test("rate limit: a client ip gets 429 once its events per window are spent, refilling over time", async () => {
  let clock = NOW;
  const { handler, calls } = enabledHandler({
    options: { now: () => clock, rateLimit: { events: 5, windowMs: 60_000 } },
  });
  await withServer(handler, async (base) => {
    const ip = { headers: { "cf-connecting-ip": "203.0.113.9" } };
    const two = { events: [event(), event({ name: "PageView" })] };
    assert.equal((await post(base, two, ip)).status, 202);
    assert.equal((await post(base, two, ip)).status, 202);
    assert.equal((await post(base, two, ip)).status, 429);
    assert.equal((await post(base, { events: [event()] }, ip)).status, 202);
    const other = { headers: { "cf-connecting-ip": "203.0.113.10" } };
    assert.equal((await post(base, two, other)).status, 202);
    clock += 30_000;
    assert.equal((await post(base, two, ip)).status, 202);
    assert.equal((await post(base, two, ip)).status, 429);
    await Promise.all(handler.pending);
  });
  assert.equal(calls.length, 5);
});

test("options from the environment trim values and default the site url", () => {
  assert.deepEqual(metaCapiOptionsFromEnv({}), {
    pixelId: "",
    accessToken: "",
    siteUrl: "https://pequeverso.com",
  });
  assert.deepEqual(
    metaCapiOptionsFromEnv({
      NEXT_PUBLIC_META_PIXEL_ID: ` ${PIXEL} `,
      META_CAPI_ACCESS_TOKEN: `${TOKEN}\n`,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
    }),
    { pixelId: PIXEL, accessToken: TOKEN, siteUrl: "http://localhost:3100" },
  );
});
