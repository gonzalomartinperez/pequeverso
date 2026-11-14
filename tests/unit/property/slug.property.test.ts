import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { getProduct, products } from "../../../config/products/index.ts";
import { absoluteUrl, site } from "../../../config/site.ts";
import { publicPath } from "../../../src/features/assistant/domain/visitor-context.ts";
import { withPassthrough } from "../../../src/features/commerce/domain/checkout-url.ts";
import { numRuns, seed } from "./runs.ts";

const paths = [
  "/",
  "/grafismo-fonetico/",
  "/soporte/",
  "/arrepentimiento/",
  "/aviso-legal/",
  "/compras-y-reembolsos/",
  "/cookies/",
  "/privacidad/",
  "/terminos/",
] as const;

test("public path normalization is idempotent and emits canonical trailing slashes", () => {
  // This helper intentionally rejects unknown slugs, queries and duplicate slashes, rather than repairing them.
  fc.assert(
    fc.property(fc.oneof(fc.string(), fc.constantFrom(...paths)), (input) => {
      const normalized = publicPath(input);
      assert.equal(publicPath(normalized), normalized);
      if (normalized !== null) {
        assert.ok(normalized.endsWith("/"));
        assert.ok(!normalized.includes("//"));
        assert.ok(paths.includes(normalized));
      }
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

test("known public paths accept a missing trailing slash and reject duplicates", () => {
  for (const path of paths) {
    assert.equal(publicPath(path.slice(0, -1) || "/"), path);
    assert.equal(publicPath(`${path}/`), null);
  }
});

test("internal links preserve generated canonical paths and place fragments after acquisition queries", () => {
  const segment = fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/);
  fc.assert(
    fc.property(
      fc.array(segment, { maxLength: 8 }),
      fc.boolean(),
      fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      fc.option(segment, { nil: undefined }),
      (segments, leadingSlash, campaign, fragment) => {
        // Site helpers consume canonical trailing-slash paths, rather than repairing arbitrary URLs.
        const path = segments.length ? `${segments.join("/")}/` : "";
        const hash = fragment === undefined ? "" : `#${fragment}`;
        const input = `${leadingSlash ? "/" : ""}${path}${hash}`;
        const search = new URLSearchParams(
          campaign === undefined ? [] : [["utm_source", campaign]],
        );
        const linked = withPassthrough(input, search.toString());
        const built = absoluteUrl(linked);
        // A fallback origin only parses the relative output when the build origin is unset.
        const url = new URL(built, "https://site.example");
        assert.equal(url.pathname, `/${path}`);
        assert.ok(url.pathname.endsWith("/"));
        assert.ok(!url.pathname.includes("//"));
        assert.equal(url.hash, hash);
        assert.equal(url.searchParams.get("utm_source"), campaign ?? null);
        assert.equal(absoluteUrl(`${url.pathname}${url.search}${url.hash}`), built);
        assert.equal(withPassthrough(linked, ""), linked);
        assert.equal(built, `${site.url}/${path}${search.size ? `?${search}` : ""}${hash}`);
        if (search.size && hash) assert.ok(built.indexOf("?") < built.indexOf("#"));
      },
    ),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

test("registered slugs resolve to unique canonical paths", () => {
  for (const product of products) {
    assert.equal(getProduct(product.slug), product);
    assert.equal(product.path, `/${product.slug}/`);
    assert.match(product.path, /^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/);
  }
});
