import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { assistantConfig } from "../../../config/assistant.ts";
import { createHttpTransport } from "../../../src/features/assistant/adapters/http.ts";
import { PayloadError, parseMessage } from "../../../src/features/assistant/adapters/validate.ts";
import { affiliatePurchasePath, applyLinkPolicy } from "../../../src/features/assistant/domain/links.ts";
import type { Message } from "../../../src/features/assistant/domain/models.ts";

const policy = {
  storefrontOrigin: "https://pequeverso.com",
  linkHosts: assistantConfig.linkHosts,
  affiliatePurchasePaths: assistantConfig.affiliatePurchasePaths,
};
const base = {
  id: "alimentacion-bebe",
  name: "Guía de Alimentación para Bebés",
  summary: "Alimentación complementaria de 6 a 12 meses",
  age_range: "6 a 12 meses",
  url: "https://pequeverso.com/#bebe",
  purchase_url: "https://pequeverso.com/alimentacion-bebe/",
  image: null,
  price: null,
};
const message = (product: unknown) => ({
  id: "answer-001",
  role: "assistant",
  content: "Puedes conocer los temas de la guía.",
  created_at: "2026-10-17T00:00:00Z",
  products: [product],
});

describe("affiliate product metadata is additive and validated", () => {
  it("consumes the pinned API's actual affiliate SSE example without an additional generation", async () => {
    const read = (file: string) =>
      readFileSync(new URL(`../../../contracts/assistant-api/${file}`, import.meta.url), "utf8");
    let calls = 0;
    const fetcher: typeof fetch = async (path) => {
      calls++;
      return String(path).endsWith("/session")
        ? new Response(read("examples/session.created.json"), {
            headers: { "content-type": "application/json" },
          })
        : new Response(read("examples/stream.affiliate.sse"), {
            headers: { "content-type": "text/event-stream" },
          });
    };
    const transport = createHttpTransport("https://api.example", fetcher, { responseLanguage: "es" });
    const controller = new AbortController();
    await transport.openSession(controller.signal, "es");
    const answers: Message[] = [];
    await transport.send(
      { content: "¿Qué enseña la guía?", page: "home", key: "affiliate-key-001", locale: "es" },
      controller.signal,
      (event) => {
        if (event.type === "answer") answers.push(event.message);
      },
    );
    assert.equal(calls, 2);
    assert.equal(answers.length, 1);
    assert.equal(answers[0]?.products[0]?.kind, "affiliate");
    assert.equal(answers[0]?.products[0]?.format, "Curso en video");
    assert.equal(answers[0]?.products[0]?.price, null);
    assert.match(answers[0]?.products[0]?.disclosure ?? "", /comisión/);
  });

  it("keeps older product payloads compatible without inferring affiliation", () => {
    const parsed = parseMessage(message(base)).products[0];
    assert.equal(parsed?.kind, "core");
    assert.equal(parsed?.format, null);
    assert.equal(parsed?.disclosure, null);
  });

  it("preserves unknown price and the published course format and disclosure", () => {
    const parsed = parseMessage(
      message({ ...base, kind: "affiliate", format: "Curso en video", disclosure: "Enlace de afiliado." }),
    );
    assert.equal(parsed.products[0]?.kind, "affiliate");
    assert.equal(parsed.products[0]?.format, "Curso en video");
    assert.equal(parsed.products[0]?.disclosure, "Enlace de afiliado.");
    assert.equal(parsed.products[0]?.price, null);
    assert.deepEqual(parsed.resources, []);
    assert.equal(applyLinkPolicy(parsed, policy).products.length, 1);
  });

  it("rejects malformed consumed metadata instead of downgrading it to a core offer", () => {
    for (const extension of [
      { kind: null },
      { kind: "sponsored" },
      { kind: 1 },
      { format: [] },
      { format: "" },
      { disclosure: {} },
      { disclosure: "x".repeat(1501) },
    ]) {
      assert.throws(() => parseMessage(message({ ...base, ...extension })), PayloadError);
    }
  });
});

describe("affiliate actions use only the configured clean redirect", () => {
  it("allows a visitor click on the exact same-origin path without a deployment hotlink", () => {
    assert.equal(affiliatePurchasePath(base.purchase_url, policy), "/alimentacion-bebe/");
    assert.equal(affiliatePurchasePath(base.purchase_url, { ...policy, affiliatePurchasePaths: [] }), null);
  });

  it("rejects a foreign host, secrets, tracking, fragments and unregistered redirects", () => {
    for (const url of [
      "https://go.hotmart.com/example",
      "http://pequeverso.com/alimentacion-bebe/",
      "https://pequeverso.com.evil.example/alimentacion-bebe/",
      "https://user:pass@pequeverso.com/alimentacion-bebe/",
      "https://pequeverso.com/unknown-redirect/",
      "https://pequeverso.com/alimentacion-bebe/?next=https://evil.example",
      "https://pequeverso.com/alimentacion-bebe/?src=visitor",
      "https://pequeverso.com/alimentacion-bebe/#private",
      "https://pequeverso.com/%61limentacion-bebe/",
      "javascript:alert(1)",
    ]) {
      assert.equal(affiliatePurchasePath(url, policy), null, url);
      const parsed = parseMessage(message({ ...base, kind: "affiliate", purchase_url: url }));
      assert.deepEqual(applyLinkPolicy(parsed, policy).products, [], url);
    }
  });

  it("does not require affiliate redirect permission for existing core product actions", () => {
    const parsed = parseMessage(
      message({
        ...base,
        kind: "core",
        url: "https://pequeverso.com/grafismo-fonetico/",
        purchase_url: "https://pequeverso.com/grafismo-fonetico/#comprar",
      }),
    );
    assert.equal(applyLinkPolicy(parsed, policy).products.length, 1);
  });
});
