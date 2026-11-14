import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { Metadata } from "next";
import { currency } from "../../config/commerce.ts";
import { coreProducts } from "../../config/products/index.ts";
import { absoluteUrl, site } from "../../config/site.ts";
import { productJsonLd } from "../../src/views/product-jsonld.ts";
import { routeMetadata } from "../helpers/seo-source.ts";
import { sourceFiles } from "../helpers/source-architecture.ts";

function assertMetadata(path: string, metadata: Metadata): void {
  assert.equal(typeof metadata?.title, "string", path);
  assert.ok(String(metadata.title).trim(), path);
  assert.ok(metadata.description?.trim(), path);
  assert.equal(metadata.alternates?.canonical, absoluteUrl(path), path);
  assert.equal(new URL(String(metadata.alternates?.canonical)).origin, new URL(site.url).origin);
  assert.equal(metadata.alternates?.languages, undefined, path);
  assert.equal(metadata.openGraph?.url, absoluteUrl(path), path);
}

test("every page exports complete same-origin metadata", async () => {
  const routes = await routeMetadata();
  assert.ok(routes.size >= 10, "expected static and registry routes");
  for (const [path, metadata] of routes) assertMetadata(path, metadata);
});

test("metadata validation rejects missing fields, foreign canonicals and hreflang", async () => {
  const metadata = (await routeMetadata()).get("/");
  assert.ok(metadata);
  for (const bad of [
    { ...metadata, title: "" },
    { ...metadata, description: "" },
    { ...metadata, alternates: { canonical: "https://other.example/" } },
    { ...metadata, alternates: { ...metadata.alternates, languages: { en: "/en/" } } },
  ])
    assert.throws(() => assertMetadata("/", bad));
});

test("root document is Spanish with no alternate-language markup", () => {
  assert.equal(site.locale, "es");
  assert.match(readFileSync("src/app/layout.tsx", "utf8"), /<html\s+lang=\{site.locale\}/);
  for (const file of sourceFiles("src"))
    assert.doesNotMatch(readFileSync(file, "utf8"), /hrefLang\s*[=:]|hreflang\s*=/i, file);
});

test("all core JSON-LD offers track configured prices and currency", () => {
  // products.test.ts owns the detailed Product/Offer shape and noindex behavior.
  for (const product of coreProducts()) {
    const offer = productJsonLd(product)?.offers as Record<string, unknown>;
    assert.equal(offer.price, product.pricing.list.toFixed(2));
    assert.equal(offer.priceCurrency, currency);
  }
});

const reviewSchema =
  /["']?@type["']?\s*:\s*["'](?:AggregateRating|Review)["']|(?:["'](?:aggregateRating|review)["']|\b(?:aggregateRating|review))\s*:/i;
test("source and content cannot introduce review structured data", () => {
  for (const file of ["src", "content"].flatMap(sourceFiles))
    assert.doesNotMatch(readFileSync(file, "utf8"), reviewSchema, file);
  for (const negative of [
    '"@type": "Review",',
    '"@type": "AggregateRating"}',
    '"aggregateRating": {}',
    '"review": []',
    '@type: "Review"',
    "aggregateRating: {}",
    "review: []",
  ])
    assert.match(negative, reviewSchema);
  for (const positive of [
    "// Review the metadata",
    "/* AggregateRating is forbidden */",
    'const label = "Review";',
  ])
    assert.doesNotMatch(positive, reviewSchema);
});
