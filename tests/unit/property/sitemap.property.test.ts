import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import fc from "fast-check";
import { indexableProducts } from "../../../config/products/index.ts";
import { site } from "../../../config/site.ts";
import { numRuns, seed } from "./runs.ts";

// Framework routes use Next's aliases; keep resolution local to importing the real route.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith("@config/")
        ? new URL(`../../../config/${specifier.slice(8)}`, import.meta.url).href
        : specifier,
      context,
    );
  },
});
const { default: sitemap } = await import("../../../src/app/sitemap.ts");
hooks.deregister();

test("sitemap stays absolute, unique, canonical and date-stable across generation dates", (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  t.mock.timers.setTime(0);
  const stable = sitemap().map((entry) => Number(entry.lastModified));
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 4_000_000_000_000 }), (now) => {
      t.mock.timers.setTime(now);
      const entries = sitemap();
      assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
      assert.deepEqual(
        entries.map((entry) => new URL(entry.url).pathname),
        ["/", ...indexableProducts().map((product) => product.path), "/soporte/"],
      );
      for (const [index, entry] of entries.entries()) {
        const url = new URL(entry.url);
        assert.equal(url.origin, new URL(site.url).origin);
        assert.ok(url.pathname.endsWith("/"));
        assert.ok(!url.pathname.includes("//"));
        assert.equal(url.search, "");
        assert.equal(url.hash, "");
        // lastModified is the content review date, never the generation time.
        assert.ok(Number.isFinite(Number(entry.lastModified)));
        assert.equal(Number(entry.lastModified), stable[index]);
      }
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});
