import assert from "node:assert/strict";
import { test } from "node:test";
import type { Metadata, MetadataRoute } from "next";
import { affiliates } from "../../config/affiliates.ts";
import { pageReviewed } from "../../config/content-dates.ts";
import { indexableProducts } from "../../config/products/index.ts";
import { absoluteUrl, site } from "../../config/site.ts";
import { routeMetadata, seoModule } from "../helpers/seo-source.ts";

function assertSitemap(entries: MetadataRoute.Sitemap, routes: Map<string, Metadata>): void {
  const expected = [...routes]
    .filter(([, meta]) => typeof meta.robots === "object" && meta.robots?.index === true)
    .map(([path]) => absoluteUrl(path))
    .sort();
  assert.deepEqual(entries.map((entry) => entry.url).sort(), expected);
  for (const entry of entries) {
    const url = new URL(entry.url);
    assert.equal(url.origin, new URL(site.url).origin);
    assert.ok(url.pathname.endsWith("/"));
    assert.equal(url.search + url.hash, "");
    assert.ok(!affiliates.some((affiliate) => affiliate.path === url.pathname));
  }
}

test("sitemap contains exactly the indexable routes, excluding legal, offers and affiliates", async () => {
  const module = await seoModule("src/app/sitemap.ts");
  const entries = (module.default as () => MetadataRoute.Sitemap)();
  const routes = await routeMetadata();
  assert.deepEqual(
    entries.map((entry) => new URL(entry.url).pathname).sort(),
    ["/", ...indexableProducts().map((product) => product.path), "/soporte/"].sort(),
  );
  assertSitemap(entries, routes);
  const first = entries[0];
  const affiliate = affiliates[0];
  assert.ok(first && affiliate);
  for (const invalid of [
    entries.slice(1),
    [...entries, first],
    [...entries, { url: absoluteUrl("/arrepentimiento/") }],
    [...entries, { url: absoluteUrl(affiliate.path) }],
    entries.map((entry) => ({ ...entry, url: entry.url.replace(/\/$/, "") })),
    entries.map((entry) => ({
      ...entry,
      url: `https://other.example${new URL(entry.url).pathname}`,
    })),
  ])
    assert.throws(() => assertSitemap(invalid, routes));
});

test("sitemap lastModified comes from content review dates, not build time", async () => {
  const module = await seoModule("src/app/sitemap.ts");
  const entries = (module.default as () => MetadataRoute.Sitemap)();
  const expected = new Map<string, string>([
    ["/", pageReviewed.home],
    ["/soporte/", pageReviewed.support],
    ...indexableProducts().map((product): [string, string] => [
      product.path,
      String(product.seo.lastReviewed),
    ]),
  ]);
  for (const entry of entries) {
    const date = expected.get(new URL(entry.url).pathname);
    assert.ok(date, entry.url);
    assert.ok(entry.lastModified instanceof Date);
    assert.equal(entry.lastModified.toISOString(), `${date}T00:00:00.000Z`);
    assert.ok(entry.lastModified.getTime() <= Date.now());
  }
  assert.deepEqual(
    entries.map((entry) => entry.lastModified),
    (module.default as () => MetadataRoute.Sitemap)().map((entry) => entry.lastModified),
  );
});
