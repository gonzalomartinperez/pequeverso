import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createHttpTransport } from "../../../src/features/assistant/adapters/http.ts";
import { AssistantError } from "../../../src/features/assistant/application/ports.ts";

const read = (file: string) =>
  readFileSync(new URL(`../../../contracts/assistant-api/${file}`, import.meta.url), "utf8");
const session = JSON.parse(read("examples/session.created.json")) as Record<string, unknown>;
const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
const stream = () =>
  new Response(read("examples/stream.recommendation.sse"), {
    headers: { "content-type": "text/event-stream" },
  });
const input = { content: "What is included?", page: null, key: "profile-key-001", locale: "en" as const };
const signal = () => new AbortController().signal;
const protocol = (error: unknown) => error instanceof AssistantError && error.code === "protocol";

describe("native Spanish profile requires the additive v1.4 contract", () => {
  it("rejects missing, old, malformed and other-major APIs before any message request", async () => {
    for (const revision of [undefined, "1.0", "1.1", "1.2", "1.3", "2.4", "1.04", "1.4?private"]) {
      const paths: string[] = [];
      const fetcher: typeof fetch = async (path) => {
        paths.push(String(path));
        return json({ ...session, contract_revision: revision });
      };
      const transport = createHttpTransport("https://api.example", fetcher, { responseLanguage: "es" });
      await assert.rejects(transport.openSession(signal(), "es"), protocol, String(revision));
      await assert.rejects(
        transport.send(input, signal(), () => {}),
        protocol,
        String(revision),
      );
      assert.deepEqual(paths, ["https://api.example/api/v1/session"], String(revision));
    }
  });

  it("captures the response policy immutably and preserves it in same-key replay", async () => {
    for (const revision of ["1.4", "1.10"]) {
      const bodies: Record<string, unknown>[] = [];
      const keys: (string | null)[] = [];
      const profile = { responseLanguage: "es" as const };
      const fetcher: typeof fetch = async (path, init = {}) => {
        bodies.push(JSON.parse(String(init.body)));
        keys.push(new Headers(init.headers).get("Idempotency-Key"));
        return String(path).endsWith("/session")
          ? json({ ...session, contract_revision: revision })
          : stream();
      };
      const transport = createHttpTransport("https://api.example", fetcher, profile);
      Reflect.set(profile, "responseLanguage", undefined);
      await transport.openSession(signal(), "en");
      await transport.send(input, signal(), () => {});
      await transport.send(input, signal(), () => {});
      assert.deepEqual(bodies[0], { locale: "es" });
      assert.deepEqual(bodies[1], {
        content: input.content,
        page: null,
        locale: "es",
        response_language: "es",
      });
      assert.deepEqual(bodies[2], bodies[1]);
      assert.deepEqual(keys, [null, input.key, input.key]);
    }
  });

  it("keeps the generic adapter legacy-compatible when no native profile is configured", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetcher: typeof fetch = async (path, init = {}) => {
      bodies.push(JSON.parse(String(init.body)));
      return String(path).endsWith("/session") ? json(session) : stream();
    };
    const transport = createHttpTransport("https://api.example", fetcher);
    await transport.openSession(signal(), "en");
    await transport.send(input, signal(), () => {});
    assert.deepEqual(bodies, [{ locale: "en" }, { content: input.content, page: null, locale: "en" }]);
  });
});
