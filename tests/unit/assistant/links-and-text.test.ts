import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyLinkPolicy, externalUrl, storefrontUrl } from "../../../src/features/assistant/domain/links.ts";
import type { Message, Product } from "../../../src/features/assistant/domain/models.ts";
import { parseInline, parseRichText } from "../../../src/features/assistant/domain/rich-text.ts";

const policy = { storefrontOrigin: "https://pequeverso.com", linkHosts: ["consumer.hotmart.com"] };

const product = (overrides: Partial<Product> = {}): Product => ({
  id: "grafismo-fonetico",
  name: "Grafismo Fonético",
  summary: "Kit",
  ageRange: "3 a 7 años",
  url: "https://pequeverso.com/grafismo-fonetico/",
  purchaseUrl: "https://pequeverso.com/grafismo-fonetico/#comprar",
  image: { url: "https://pequeverso.com/media/x.webp", width: 1, height: 1, alt: "" },
  price: null,
  ...overrides,
});

const answer = (overrides: Partial<Message>): Message => ({
  id: "a",
  role: "assistant",
  content: "",
  language: "es",
  createdAt: "2026-09-27T12:00:00Z",
  products: [],
  resources: [],
  links: [],
  sources: [],
  followUps: [],
  notices: [],
  ...overrides,
});

describe("URL policy", () => {
  it("accepts only the exact storefront origin for product actions", () => {
    assert.equal(
      storefrontUrl("https://pequeverso.com/grafismo-fonetico/", policy),
      "https://pequeverso.com/grafismo-fonetico/",
    );
    for (const bad of [
      "https://www.pequeverso.com/grafismo-fonetico/", // no implied www variant
      "http://pequeverso.com/",
      "https://pequeverso.com.evil.example/",
      "https://user:pass@pequeverso.com/",
      "javascript:alert(1)",
      "//pequeverso.com/",
      "/grafismo-fonetico/",
    ])
      assert.equal(storefrontUrl(bad, policy), null, bad);
  });

  it("allows informational links only to the storefront or allowlisted https hosts", () => {
    assert.ok(externalUrl("https://consumer.hotmart.com/", policy));
    assert.equal(externalUrl("http://consumer.hotmart.com/", policy), null);
    assert.equal(externalUrl("https://pay.hotmart.com/x", policy), null);
    assert.equal(externalUrl("data:text/html,x", policy), null);
  });

  it("drops products whose page or purchase URL fails, and foreign images", () => {
    const safe = applyLinkPolicy(
      answer({
        products: [
          product(),
          product({ id: "foreign", url: "https://example.com/" }),
          product({ id: "bad-buy", purchaseUrl: "https://evil.example/pay" }),
          product({
            id: "img",
            image: { url: "https://evil.example/a.png", width: 1, height: 1, alt: "" },
          }),
        ],
        links: [
          { id: "ok", label: "Soporte", url: "https://pequeverso.com/soporte/" },
          { id: "bad", label: "Mal", url: "https://evil.example/" },
        ],
        sources: [{ id: "s", title: "S", url: "javascript:alert(1)" }],
      }),
      policy,
    );
    assert.deepEqual(
      safe.products.map((p) => p.id),
      ["grafismo-fonetico", "img"],
    );
    assert.equal(safe.products[1]?.image, null);
    assert.deepEqual(
      safe.links.map((l) => l.id),
      ["ok"],
    );
    assert.equal(safe.sources.length, 0);
  });
});

describe("rich text", () => {
  it("parses paragraphs, bold and bullet/numbered lists; markup stays literal text", () => {
    const blocks = parseRichText("**Hola** <b>x</b>\n\n- uno\n- **dos**\n\n1. a\n2. b");
    assert.equal(blocks.length, 3);
    assert.deepEqual(blocks[0], {
      kind: "paragraph",
      lines: [
        [
          { kind: "strong", text: "Hola" },
          { kind: "text", text: " <b>x</b>" },
        ],
      ],
    });
    assert.equal(blocks[1]?.kind === "list" && blocks[1].items.length, 2);
    assert.equal(blocks[2]?.kind === "list" && blocks[2].ordered, true);
  });

  it("never auto-links: URLs and [label](url) stay plain text (API handoff rule)", () => {
    const nodes = parseInline("Mira https://pequeverso.com/soporte/ o [aquí](javascript:alert(1))");
    assert.deepEqual(nodes, [
      { kind: "text", text: "Mira https://pequeverso.com/soporte/ o [aquí](javascript:alert(1))" },
    ]);
  });

  it("stays linear on adversarial input", () => {
    const input = "*".repeat(50_000) + "[".repeat(10_000);
    const started = performance.now();
    parseRichText(input);
    assert.ok(performance.now() - started < 500);
  });
});

describe("storefront URLs cannot become protocol-relative links", async () => {
  const { externalUrl, storefrontPath, storefrontUrl } = await import(
    "../../../src/features/assistant/domain/links.ts"
  );
  const policy = { storefrontOrigin: "https://pequeverso.com", linkHosts: ["consumer.hotmart.com"] };

  it("rejects double-slash paths, backslashes and control characters", () => {
    for (const value of [
      "https://pequeverso.com//evil.com/x",
      "https://pequeverso.com/\\evil.com",
      "https://pequeverso.com/\\\\evil.com/x",
      "https://pequeverso.com/ok\n/x",
      "https://pequeverso.com/ok\t",
    ]) {
      assert.equal(storefrontUrl(value, policy), null, JSON.stringify(value));
      assert.equal(storefrontPath(value, policy), null, JSON.stringify(value));
      assert.equal(externalUrl(value, policy), null, JSON.stringify(value));
    }
  });

  it("keeps encoded slashes inert and returns single-slash paths", () => {
    assert.equal(storefrontPath("https://pequeverso.com/%2F%2Fevil.com", policy), "/%2F%2Fevil.com");
    assert.equal(
      storefrontPath("https://pequeverso.com/grafismo-fonetico/?a=1#comprar", policy),
      "/grafismo-fonetico/?a=1#comprar",
    );
    for (const path of ["/grafismo-fonetico/", "/%2F%2Fevil.com"]) assert.ok(/^\/(?!\/)/.test(path));
  });
});

it("allows only the three exact canonical official articles without granting their host", async () => {
  const { assistantConfig } = await import("../../../config/assistant.ts");
  const exact = {
    ...policy,
    linkHosts: assistantConfig.linkHosts,
    approvedSourceUrls: assistantConfig.approvedSourceUrls,
  };
  assert.equal(exact.approvedSourceUrls.length, 3);
  assert.deepEqual(exact.linkHosts, ["consumer.hotmart.com", "refund.hotmart.com"]);
  for (const url of exact.approvedSourceUrls) {
    assert.equal(externalUrl(url, exact), url);
    assert.equal(externalUrl(url, policy), null, "legacy policy remains closed to official articles");
    for (const bad of [
      `${url}?next=https://evil.example`,
      `${url}#fragment`,
      `${url}/`,
      `${url}?`,
      `${url}#`,
      url.replace("https:", "http:"),
      url.replace("help.hotmart.com", "help.hotmart.com:8443"),
      url.replace("help.hotmart.com", "help.hotmart.com:443"),
      url.replace("help.hotmart.com", "HELP.hotmart.com"),
      url.replace("help.hotmart.com", "help.hotmart.com.evil.example"),
      url.replace("help.hotmart.com", "sub.help.hotmart.com"),
      url.replace("help.hotmart.com", "user:pass@help.hotmart.com"),
      url.replace("/es/article/", "/es/redirect/"),
      url.replace("/es/article/", "/es/other/../article/"),
      url.replace("/es/article/", "/es/%61rticle/"),
      ` ${url}`,
      `${url}\n`,
      `${url}\u007f`,
      url.replace("https://", "https:\\\\"),
    ])
      assert.equal(externalUrl(bad, exact), null, JSON.stringify(bad));
  }
  assert.equal(externalUrl("https://help.hotmart.com/es/article/123/unknown", exact), null);
  assert.equal(externalUrl("https://help.hotmart.com/redirect", exact), null);
  assert.equal(externalUrl("https://consumer.hotmart.com/", exact), "https://consumer.hotmart.com/");
  assert.equal(externalUrl("https://refund.hotmart.com/", exact), "https://refund.hotmart.com/");
  assert.equal(externalUrl("https://pequeverso.com/soporte/", exact), "https://pequeverso.com/soporte/");
});

it("drops unsafe official citations without changing distinct source identities", async () => {
  const { assistantConfig } = await import("../../../config/assistant.ts");
  const exact = {
    ...policy,
    linkHosts: assistantConfig.linkHosts,
    approvedSourceUrls: assistantConfig.approvedSourceUrls,
  };
  const sources = exact.approvedSourceUrls.map((url, index) => ({
    id: `hotmart:${index}`,
    title: "Procedimiento",
    url,
  }));
  const safe = applyLinkPolicy(
    answer({
      sources: [
        ...sources,
        { id: "redirect", title: "No permitido", url: `${sources[0]?.url}?redirect=evil` },
      ],
    }),
    exact,
  );
  assert.deepEqual(safe.sources, sources);
  const first = sources[0];
  if (!first) throw new Error("An approved reference must exist");
  const distinctDocuments = [first, { ...first, id: "another-document" }];
  assert.deepEqual(applyLinkPolicy(answer({ sources: distinctDocuments }), exact).sources, distinctDocuments);
});
