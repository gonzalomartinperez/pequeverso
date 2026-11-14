# SEO structured-data verification (M3-6)

Captured on 2026-11-14 with an isolated Playwright Chromium, in validator.schema.org (code
snippet mode). Google's Rich Results Test could not be used: its code mode answers "Something
went wrong, log in and try again" without a Google sign-in.

The input was the JSON-LD script blocks of the built static export (`out/index.html` and
`out/grafismo-fonetico/index.html`), wrapped in a minimal HTML document.

| File | Shows |
|---|---|
| `schema-validator-home.png` | Home page graph: `WebSite` with its `Organization` publisher (logo, `sameAs`, email); 0 errors, 0 warnings. No `SearchAction`. |
| `schema-validator-product.png` | Grafismo Fonético: `Product` expanded with its `Offer` (price 14.99, priceCurrency USD, availability, url); 0 errors, 0 warnings. The `BreadcrumbList` of the same page also validates with 0 errors. |

The validator normalises `availability` to `http://schema.org/InStock` in its display; the page emits `https://schema.org/InStock`.
