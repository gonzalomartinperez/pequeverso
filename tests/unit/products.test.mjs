import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getImage, getVideo } from "../../src/lib/media.ts";
import { grafismoFonetico } from "../../src/products/grafismo-fonetico.ts";
import { imprimeYJuega } from "../../src/products/imprime-y-juega.ts";
import {
  checkoutFallbackPath,
  coreProducts,
  featuredProduct,
  getProduct,
  indexableProducts,
  offerProducts,
  products,
} from "../../src/products/index.ts";
import { breadcrumbJsonLd, productJsonLd } from "../../src/products/jsonld.ts";
import { RegistrySchema } from "../../src/products/schema.ts";

const FORBIDDEN_JSONLD = ["aggregateRating", "review", "shippingDetails", "hasMerchantReturnPolicy"];

function sumPages(product) {
  return product.resources.reduce((sum, resource) => sum + (resource.pages ?? 0), 0);
}

test("the registry parses and exposes both products with canonical paths", () => {
  assert.deepEqual(
    products.map((product) => [product.slug, product.kind, product.path]),
    [
      ["grafismo-fonetico", "core", "/grafismo-fonetico/"],
      ["imprime-y-juega", "post-purchase-offer", "/imprime-y-juega/"],
    ],
  );
  assert.equal(getProduct("grafismo-fonetico")?.name, "Grafismo Fonético");
  assert.equal(getProduct("nope"), undefined);
  assert.equal(coreProducts().length, 1);
  assert.equal(offerProducts().length, 1);
  assert.deepEqual(
    indexableProducts().map((product) => product.slug),
    ["grafismo-fonetico"],
  );
  assert.equal(featuredProduct().slug, "grafismo-fonetico");
  assert.equal(checkoutFallbackPath(featuredProduct()), "/grafismo-fonetico/#comprar");
});

test("every media id of every product exists in the manifest with the right kind", () => {
  for (const product of products) {
    const images = [product.media.hero, ...product.media.pageIds, ...product.media.cards];
    if (product.media.og) images.push(product.media.og);
    if (product.kind === "core") images.push(...Object.values(product.media.scenes));
    for (const id of images) assert.doesNotThrow(() => getImage(id), `${product.slug}: image ${id}`);
    for (const id of product.media.videoIds) {
      assert.doesNotThrow(() => getVideo(id), `${product.slug}: video ${id}`);
    }
    for (const resource of product.resources) assert.ok(product.media.cards.includes(resource.card));
  }
});

test("resources sum to the documented page counts", () => {
  for (const product of products)
    assert.equal(sumPages(product), product.composition.pageCount, product.slug);
  assert.equal(grafismoFonetico.composition.pageCount, 414);
  assert.equal(grafismoFonetico.composition.pdfCount, 9);
  assert.equal(imprimeYJuega.composition.pageCount, 384);
  assert.equal(imprimeYJuega.composition.pdfCount, 6);
  assert.equal(imprimeYJuega.composition.visibleResources, 9);
});

test("documented prices (README 2026-08-04): 14.99 list, 14.99 upsell, 7.49 downsell", () => {
  assert.equal(grafismoFonetico.pricing.list, 14.99);
  assert.equal(imprimeYJuega.pricing.upsell, 14.99);
  assert.equal(imprimeYJuega.pricing.downsell, 7.49);
  assert.equal(imprimeYJuega.parent, "grafismo-fonetico");
  assert.equal(grafismoFonetico.funnel.postPurchaseOffer, "imprime-y-juega");
  assert.equal(imprimeYJuega.decision, "hotmart-widget");
});

test("the checkout URL comes only from static env references Next can inline", () => {
  const source = readFileSync(new URL("../../src/products/grafismo-fonetico.ts", import.meta.url), "utf8");
  assert.match(source, /process\.env\.NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO \|\|/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_CHECKOUT_URL \|\| ""/);
  assert.doesNotMatch(source, /pay\.hotmart\.com/);
  // CI builds use a fake offer code; only the origin and the checkout mode are invariant.
  assert.match(grafismoFonetico.checkout.url, /^https:\/\/pay\.hotmart\.com\/[A-Za-z0-9]+\?checkoutMode=10$/);
  assert.equal(grafismoFonetico.checkout.envKey, "NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO");
  assert.match(grafismoFonetico.checkout.sckPrefix, /^[a-z0-9]{1,6}$/);
});

test("registry refinements reject broken registries", () => {
  const core = grafismoFonetico;
  const offer = imprimeYJuega;
  const rejects = (registry) => assert.equal(RegistrySchema.safeParse(registry).success, false);
  assert.ok(RegistrySchema.safeParse([core, offer]).success);
  rejects([core, { ...offer, slug: core.slug }]);
  rejects([core, { ...offer, code: core.code }]);
  rejects([core, { ...offer, parent: "missing" }]);
  rejects([{ ...core, funnel: { ...core.funnel, postPurchaseOffer: "missing" } }, offer]);
  rejects([{ ...core, funnel: { ...core.funnel, thanksPath: "/otro/gracias/" } }, offer]);
  rejects([{ ...core, composition: { ...core.composition, pageCount: 400 } }, offer]);
  rejects([{ ...core, media: { ...core.media, hero: "nope" } }, offer]);
  rejects([{ ...core, checkout: { ...core.checkout, sckPrefix: "toolong" } }, offer]);
  rejects([offer]);
});

test("Product JSON-LD carries one Offer and never ratings, reviews or merchant-listing fields", () => {
  const product = featuredProduct();
  const data = productJsonLd(product);
  assert.ok(data);
  const text = JSON.stringify(data);
  for (const key of FORBIDDEN_JSONLD) assert.ok(!text.includes(key), `unexpected ${key}`);
  assert.equal(data["@type"], "Product");
  assert.equal(data.sku, "grafismo-fonetico");
  assert.deepEqual(data.brand, { "@type": "Organization", name: "Pequeverso" });
  assert.match(String(data.image), /^https:\/\/pequeverso\.com\/media\//);
  assert.deepEqual(data.offers, {
    "@type": "Offer",
    price: "14.99",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://pequeverso.com/grafismo-fonetico/",
  });
  assert.equal(productJsonLd({ ...product, seo: { ...product.seo, index: false } }), null);
  const crumbs = breadcrumbJsonLd(product);
  assert.equal(crumbs["@type"], "BreadcrumbList");
  assert.equal(crumbs.itemListElement.length, 2);
});
