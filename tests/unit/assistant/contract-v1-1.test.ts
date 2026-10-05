import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createHttpTransport } from "../../../src/features/assistant/adapters/http.ts";
import { parseMessage, parseSession } from "../../../src/features/assistant/adapters/validate.ts";
import {
  type ConversationState,
  initialState,
  phase,
  reduce,
} from "../../../src/features/assistant/domain/conversation.ts";

const read = (path: string) =>
  readFileSync(new URL(`../../../contracts/assistant-api/${path}`, import.meta.url));
const session = JSON.parse(read("examples/session.created.json").toString("utf8")) as Record<string, unknown>;
const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

describe("pinned API contract", () => {
  it("matches the manifest recorded from a committed API revision", () => {
    const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
    const manifestBytes = read("manifest.json");
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as { artifacts: Record<string, string> };
    const source = JSON.parse(read("source.json").toString("utf8")) as {
      api_commit: string;
      api_manifest_sha256: string;
    };
    assert.match(source.api_commit, /^[0-9a-f]{40}$/);
    assert.equal(sha(manifestBytes), source.api_manifest_sha256);
    for (const [path, digest] of Object.entries(manifest.artifacts))
      assert.equal(sha(read(path)), digest, path);
  });
});

describe("contract v1.1 additions are optional and forward compatible", () => {
  it("defaults language and starters for a v1.0 API and does not send the locale hint", async () => {
    const { contract_revision: _revision, starters: _starters, ...v10 } = session;
    const parsed = parseSession(v10);
    assert.deepEqual(parsed.starters, []);
    assert.equal(parsed.acceptsLocale, false);
    const bodies: unknown[] = [];
    const fetcher: typeof fetch = async (_input, init = {}) => {
      bodies.push(JSON.parse(String(init.body)));
      return json(v10);
    };
    const transport = createHttpTransport("https://api.example", fetcher);
    await transport.openSession(new AbortController().signal, "en");
    assert.deepEqual(bodies[0], { locale: "en" });
    await transport
      .send(
        { content: "Hi", page: null, key: "key-000001", locale: "en" },
        new AbortController().signal,
        () => {},
      )
      .catch(() => {});
    assert.deepEqual(bodies[1], { content: "Hi", page: null });
  });

  it("reads starters, contract revision and per-message language from a v1.1 API", async () => {
    const v11 = { ...session, contract_revision: "1.1", starters: ["¿Qué incluye?", "", "x".repeat(200)] };
    assert.throws(() => parseSession(v11)); // an empty or oversized starter is a protocol error
    const ok = parseSession({ ...v11, starters: ["¿Qué incluye?", "¿Para qué edades?"] });
    assert.deepEqual(ok.starters, ["¿Qué incluye?", "¿Para qué edades?"]);
    assert.equal(ok.acceptsLocale, true);
    const base = { id: "m1", role: "assistant", content: "Hi", created_at: "2026-10-05T10:00:00Z" };
    assert.equal(parseMessage({ ...base, language: "en" }).language, "en");
    assert.equal(parseMessage(base).language, "es");
    assert.equal(parseMessage({ ...base, language: "pt" }).language, null);
    assert.deepEqual(parseMessage({ ...base, notices: ["language_unsupported", "future_notice"] }).notices, [
      "language_unsupported",
    ]);
  });

  it("sends the locale hint only after the API advertises v1.1", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetcher: typeof fetch = async (input, init = {}) => {
      if (String(input).endsWith("/session")) return json({ ...session, contract_revision: "1.1" });
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return new Response("", { status: 503 });
    };
    const transport = createHttpTransport("https://api.example", fetcher);
    await transport.openSession(new AbortController().signal, "es");
    await assert.rejects(
      transport.send(
        { content: "Hola", page: null, key: "key-000001", locale: "es" },
        new AbortController().signal,
        () => {},
      ),
    );
    assert.deepEqual(bodies[0], { content: "Hola", page: null, locale: "es" });
  });

  it("calls the configured API origin with credentials (cross-origin storefront)", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetcher: typeof fetch = async (input, init = {}) => {
      calls.push({ url: String(input), init });
      return json(session);
    };
    await createHttpTransport("https://api.example", fetcher).openSession(new AbortController().signal, "es");
    assert.equal(calls[0]?.url, "https://api.example/api/v1/session");
    assert.equal(calls[0]?.init.credentials, "include");
    assert.equal(calls[0]?.init.cache, "no-store");
  });
});

describe("committed v1.1 stream examples", () => {
  it("parses the English and language-unsupported examples", async () => {
    const { readSse } = await import("../../../src/features/assistant/adapters/sse.ts");
    for (const [name, language, notice] of [
      ["stream.english.sse", "en", null],
      ["stream.language-unsupported.sse", null, "language_unsupported"],
    ] as const) {
      const text = read(`examples/${name}`).toString("utf8");
      const body = new Response(text).body;
      assert.ok(body);
      let final: { language: string | null; notices: string[] } | null = null;
      await readSse(body, (event) => {
        if (event.type === "message.completed") final = event.message;
      });
      assert.ok(final, name);
      const message = final as { language: string | null; notices: string[] };
      if (language) assert.equal(message.language, language, name);
      if (notice) assert.ok(message.notices.includes(notice), name);
    }
  });
});

describe("explicit phases", () => {
  const opened = (): ConversationState =>
    reduce(initialState, {
      type: "session.opened",
      messages: [],
      availability: { status: "available" },
      limits: { maxMessageChars: 600, messagesPerDay: 30 },
      starters: [],
      expired: false,
    });
  const turn = { key: "key-000001", prompt: "Hola", retry: false };

  it("walks initializing → ready → submitting → streaming → completed", () => {
    assert.equal(phase(initialState).kind, "initializing");
    let state = opened();
    assert.equal(phase(state).kind, "ready");
    state = reduce(state, { type: "turn.submitted", turn, question: null });
    assert.equal(phase(state).kind, "submitting");
    state = reduce(state, { type: "run.started", key: turn.key, runId: "run_1", question: null });
    assert.deepEqual(phase(state), { kind: "streaming", stopping: false });
    state = reduce(state, { type: "run.stopping", key: turn.key });
    assert.deepEqual(phase(state), { kind: "streaming", stopping: true });
    state = reduce(state, { type: "run.cancelled", key: turn.key });
    assert.equal(phase(state).kind, "cancelled");
  });

  it("reports early EOF as a recoverable interruption, never as completed", () => {
    let state = reduce(opened(), { type: "turn.submitted", turn, question: null });
    state = reduce(state, { type: "run.started", key: turn.key, runId: "run_1", question: null });
    state = reduce(state, { type: "run.delta", key: turn.key, text: "Parcial" });
    state = reduce(state, { type: "run.completed", key: turn.key });
    assert.deepEqual(phase(state), { kind: "failed", code: "interrupted", retryable: true });
  });

  it("reports unavailability and expiry", () => {
    const unavailable = reduce(opened(), {
      type: "availability",
      availability: { status: "unavailable", reason: "budget_exhausted" },
    });
    assert.deepEqual(phase(unavailable), { kind: "unavailable", reason: "budget_exhausted" });
    const expired = reduce(initialState, {
      type: "session.opened",
      messages: [],
      availability: { status: "available" },
      limits: { maxMessageChars: 600, messagesPerDay: 30 },
      starters: [],
      expired: true,
    });
    assert.equal(phase(expired).kind, "expired");
  });
});
