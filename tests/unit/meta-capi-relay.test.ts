import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMetaCapiRelay,
  type UpstreamResult,
} from "../../src/features/tracking/adapters/server/meta-capi.ts";

const now = 1_800_000_000_000;
const bodyText = JSON.stringify({
  events: [
    {
      name: "PageView",
      eventId: "3f1c2a9e-5b7d-4c8e-9a1b-2c3d4e5f6a7b",
      time: now,
      sourceUrl: "https://example.invalid/",
    },
  ],
});

for (const { name, responses, expected, message } of [
  {
    name: "server error followed by success",
    responses: [500, 200],
    expected: { status: 200, ok: true, attempts: 2 },
    message: "",
  },
  {
    name: "repeated throttling",
    responses: [429, 429],
    expected: { status: 429, ok: false, attempts: 2 },
    message: "upstream 4xx 429",
  },
  {
    name: "network failures",
    responses: [new TypeError("synthetic failure"), new TypeError("synthetic failure")],
    expected: { status: 0, ok: false, attempts: 2 },
    message: "upstream error TypeError",
  },
  {
    name: "permanent client error",
    responses: [400],
    expected: { status: 400, ok: false, attempts: 1 },
    message: "upstream 4xx 400",
  },
]) {
  test(`relay handles ${name} without a listening server or real network`, async () => {
    const calls: RequestInit[] = [];
    const logs: string[] = [];
    const results: UpstreamResult[] = [];
    const token = "synthetic-unit-test-token";
    const relay = createMetaCapiRelay({
      pixelId: "1234567890123456",
      accessToken: token,
      siteUrl: "https://example.invalid/",
      now: () => now,
      fetchImpl: async (_url, init) => {
        assert.ok(init);
        calls.push(init);
        const response = responses[calls.length - 1];
        assert.ok(response !== undefined, "the relay must not exceed its retry budget");
        if (response instanceof Error) throw response;
        return new Response(response === 400 ? "not JSON" : "null", { status: response });
      },
      log: (line) => logs.push(line),
      onResult: (result) => results.push(result),
    });
    assert.equal(
      relay.process({
        method: "POST",
        bodyText,
        contentType: "application/json",
        cookie: "pv_consent=a1m1.v3",
      }).status,
      202,
    );
    await Promise.all(relay.pending);
    assert.deepEqual(results, [expected]);
    assert.equal(calls.length, expected.attempts);
    assert.equal(relay.pending.size, 0);
    assert.deepEqual(logs, message ? [`meta-capi: ${message}`] : []);
    for (const call of calls) {
      assert.deepEqual(JSON.parse(String(call.body)).data[0].user_data, {});
      assert.equal(Object.hasOwn(JSON.parse(String(call.body)).data[0], "custom_data"), false);
    }
    assert.equal(
      logs.some((line) => line.includes(token)),
      false,
    );
  });
}
