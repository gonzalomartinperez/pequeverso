import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { currency } from "../../config/commerce.ts";
import { coreProducts } from "../../config/products/index.ts";
import { absoluteUrl, site } from "../../config/site.ts";
import { jsonLd } from "../../src/shared/seo/json-ld.ts";
import { productJsonLd } from "../../src/views/product-jsonld.ts";
import { siteJsonLd } from "../../src/views/site-jsonld.ts";

test("jsonLd escapes every < and round-trips to the same value", () => {
  const value = {
    a: "</script><script>alert(1)</script>",
    b: ["<!--", "x < y", { "<k>": "<" }],
    c: 'ñ \u2028 "quoted"',
  };
  const text = jsonLd(value);
  assert.ok(!text.includes("<"));
  assert.ok(text.includes("\\u003c/script>"));
  assert.deepEqual(JSON.parse(text), value);
  assert.equal(jsonLd({ plain: 1 }), '{"plain":1}');
});

test("home graph has Organization and WebSite without SearchAction, ratings or reviews", () => {
  const data = siteJsonLd();
  assert.equal(data["@context"], "https://schema.org");
  const graph = data["@graph"] as Record<string, unknown>[];
  const org = graph.find((node) => node["@type"] === "Organization");
  const web = graph.find((node) => node["@type"] === "WebSite");
  assert.ok(org && web);
  assert.equal(org.name, site.name);
  assert.equal(org.url, absoluteUrl("/"));
  assert.match(String(org.logo), /^https:\/\/pequeverso\.com\/media\/brand\//);
  assert.deepEqual(org.sameAs, Object.values(site.social));
  assert.equal(web.url, absoluteUrl("/"));
  assert.equal(web.inLanguage, "es");
  assert.deepEqual(web.publisher, { "@id": org["@id"] });
  assert.ok(!/potentialAction|SearchAction|aggregateRating|review/i.test(jsonLd(data)));
});

test("Product and Offer values equal the registry config", () => {
  for (const product of coreProducts().filter((item) => item.seo.index)) {
    const data = productJsonLd(product);
    assert.ok(data);
    assert.equal(data["@type"], "Product");
    assert.equal(data.name, product.name);
    assert.equal(data.description, product.seo.description);
    assert.equal(data.url, absoluteUrl(product.path));
    assert.ok(data.image);
    assert.ok(data.sku);
    const offer = data.offers as Record<string, unknown>;
    assert.equal(offer["@type"], "Offer");
    assert.equal(offer.price, product.pricing.list.toFixed(2));
    assert.equal(offer.priceCurrency, currency);
    assert.equal(offer.availability, "https://schema.org/InStock");
    assert.equal(offer.url, absoluteUrl(product.path));
    assert.ok(!/aggregateRating|review/i.test(jsonLd(data)));
  }
});

test("only the shared JsonLdScript emits ld+json, always through jsonLd()", () => {
  const found = execFileSync("grep", ["-rl", "ld+json", "src"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(found, ["src/shared/seo/json-ld-script.tsx"]);
  assert.match(readFileSync(found[0] as string, "utf8"), /__html: jsonLd\(data\)/);
});
