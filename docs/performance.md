# Performance

Lab targets (AGENTS.md): LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms at 390 px (`lighthouserc.json`),
plus the transfer budgets in `config/budgets.json`. This page records how the export meets them
and the numbers behind each decision. Re-measure after any change to the hero, fonts, global CSS
or the client bundle; tighten the budgets, never loosen them without a decision record.

## Budgets (`config/budgets.json`)

Gzip bytes per route, enforced by `npm run check:bundle` on the static export. Values are the
measured size plus 10 % headroom, rounded up to 512 bytes. Re-baselined for the Tailwind +
shadcn migration in ADR-0006 (main = the export before the migration, 2026-09-22).

| Route | Metric | main | Measured 2026-09-24 | Budget |
|---|---|---|---|---|
| `/` | html / js / css | 20.4 / 147.4 / 13.2 KB | 24.3 / 150.0 / 16.0 KB | 27.0 / 156.5 / 18.0 KB |
| `/grafismo-fonetico/` | html / js / css | 39.8 / 162.1 / 13.2 KB | 45.0 / 163.7 / 16.0 KB | 50.0 / 169.5 (default) / 18.0 KB |
| `/imprime-y-juega/` | html / js / css | 27.1 / 162.1 / 13.2 KB | 31.1 / 163.7 / 16.0 KB | 34.5 / 169.5 (default) / 18.0 KB |
| `/grafismo-fonetico/gracias/` | html / js / css | 18.5 / 143.1 / 13.2 KB | 22.2 / 144.5 / 12.3 KB | 24.5 / 154.0 / 14.0 KB (default) |
| `/soporte/` | html / js / css | 9.9 / 141.4 / 13.2 KB | 11.3 / 142.5 / 12.1 KB | 12.5 / 152.5 / 13.5 KB |
| deferred scene (`scene.js`) | js | — | 177.6 KB (5 chunks, never initial) | 250.0 KB |

Product pages still load their legacy CSS Modules next to the global stylesheet; their `css`
budgets drop to the default once the page redesigns delete those modules.

`html` counts the exported document including the embedded RSC payload (roughly 60 % of the
bytes on the product pages). `js` sums every `/_next/static/chunks/*.js` referenced by the page
except the polyfills chunk; `css` sums the linked stylesheets.

## Lighthouse (390 × 844, DPR 3, simulated throttling, median of 5)

| Route | Metric | Before | After |
|---|---|---|---|
| `/` | Performance | 91 (70–91) | 100 |
| `/` | FCP | 438 ms | 370 ms |
| `/` | LCP | 1 001 ms | 699 ms |
| `/` | CLS | 0.201 | 0 |
| `/grafismo-fonetico/` | Performance | 99 | 100 |
| `/grafismo-fonetico/` | FCP | 489 ms | 291 ms |
| `/grafismo-fonetico/` | LCP | 941 ms | 659 ms |
| `/grafismo-fonetico/` | CLS | 0 | 0 |

Collected with the `lighthouserc.json` settings against `scripts/serve-static.mjs`. The LCP element
is the `h1` at 390 px on both routes; the hero `<img data-lcp>` becomes the LCP element on wider
viewports, which `tests/e2e/lcp.spec.ts` accepts as the only alternative. Intermediate steps on
`/`: font preload + Georgia/Arial metric fallbacks took LCP to 832 ms and CLS to 0; preloading the
AVIF hero instead of the WebP srcset took it to 699 ms.

## LCP strategy

- `MediaImage priority` renders the hero eager with `fetchpriority="high"`, `decoding="sync"` and
  `data-lcp`, and calls `ReactDOM.preload()` with the exact `imagesrcset`/`imagesizes` the browser
  will select: the AVIF `<source>` (`type="image/avif"`) when the pipeline produced one, otherwise
  the WebP srcset. The `<picture>` + AVIF markup is kept for the hero. React only preloads bare
  `<img>` elements automatically, and a bare `<img>` would drop AVIF: at 390 px / DPR 3 the WebP
  srcset resolves to the 1440 rendition (219 KB) while the AVIF is 79 KB. Browsers without AVIF
  ignore a typed preload and fall back to the WebP `<img>` without a preload.
- Only one image may preload per page. React preloads every `<img>` that is not lazy, not
  `fetchpriority="low"` and not inside `<picture>`, so `BrandLogo` renders the header mark with
  `loading="eager" fetchpriority="low"` (it used to steal the preload with `fetchpriority="high"`),
  and every gallery slide and video poster is `loading="lazy" fetchpriority="low"`. Before this
  change the product page preloaded the isotipo and the first two gallery slides but not the hero.
- `ReactDOM.preload` hints travel in the RSC payload, so when `next/link` prefetches a route the
  client also inserts that route's hero preload (the same `gf.hero` file for `/` and
  `/grafismo-fonetico/`, so no extra bytes). The e2e test therefore matches the preload by the
  page's own `sizes` value instead of counting links.
- `tests/e2e/lcp.spec.ts` asserts through `PerformanceObserver` that the LCP element on `/` and
  `/grafismo-fonetico/` is an `h1` or `img[data-lcp]`, that the preload for the page hero exists,
  matches one of the hero's srcsets and carries `fetchpriority="high"`, that the hero's
  `currentSrc` is a hero rendition, and that no preload targets the isotipo. The spec is not in
  the `PW_SET` project matchers of `playwright.config.ts` yet (that file is outside this change).

## Font strategy

`next/font/local` with `preload: true` emits no `<link rel="preload" as="font">` in the static
export (checked in `out/index.html`), and it computed the fallback metrics at the variable fonts'
default instances (Fraunces wght 900, Nunito Sans wght 200), not at the weights the site uses.
The fonts therefore moved to `public/fonts/` (content-hashed names, immutable cache rule
`immutable-fonts`) and are declared by hand:

- `@font-face` in `src/styles/tokens.css` with `font-display: swap` and the latin `unicode-range`;
  `--font-fraunces` / `--font-nunito` are set on `:root` so `--font-display` / `--font-body` work
  unchanged.
- `ReactDOM.preload(url, { as: "font", type: "font/woff2", crossOrigin: "anonymous" })` in
  `src/app/layout.tsx` for both files, which renders the two preload links at the top of `<head>`.
- Metric-compatible fallbacks per weight actually used, measured in Chromium with
  `canvas.measureText` on the string Next uses for its own average-width heuristic:

| Fallback face | Matches | size-adjust | ascent-override | descent-override |
|---|---|---|---|---|
| `Fraunces Fallback` 400 → `local("Georgia")` | Fraunces 500 (callouts) | 108.10 % | 90.47 % | 23.59 % |
| `Fraunces Fallback` 700 → `local("Georgia Bold")` | Fraunces 700 (h1, h2, price) | 97.04 % | 100.79 % | 26.28 % |
| `Nunito Sans Fallback` 400 → `local("Arial")` | Nunito Sans 500 (body) | 102.22 % | 98.90 % | 34.53 % |
| `Nunito Sans Fallback` 700 → `local("Arial Bold")` | Nunito Sans 800 (h3, strong, buttons) | 99.48 % | 101.63 % | 35.48 % |

With the web fonts blocked, the `h1` and hero section heights at 390 px and 1440 px are identical
to the web-font layout on `/` and `/grafismo-fonetico/`; total page height differs by 1–3 % below
the fold. This removed the 0.20 CLS that Lighthouse attributed to "Web font loaded" on `/`
(the absolutely positioned `Universe` star layers resize with the hero).

## Gallery payload

`PageGallery` is a server component; the carousel behaviour lives in `GalleryCarousel` (client),
which receives only the rendered slides, `count`, `label` and `zoomHint`. Pages render slides on
the server:

```tsx
<PageGallery count={ids.length} label="Páginas reales del kit" zoomHint={copy.pages.zoomHint}>
  {ids.map((id) => <GallerySlide key={id} id={id} caption={captionFor(id)} />)}
</PageGallery>
```

`GallerySlide` outputs the `<img srcset sizes width height loading="lazy" fetchpriority="low"
data-caption data-alt>` wrapped in the client `GalleryZoomButton`, plus the caption paragraph. The
zoom dialog reads `currentSrc`, `srcset`, `alt` and `data-caption` from the clicked element, so the
client bundle carries no image data and no manifest shape. The legacy `items` prop still works:
`PageGallery` maps each item's `id`/`caption` to a `<GallerySlide>` on the server, so current
templates already ship no item objects to the client. Cost on the product page: +0.9 KB gzip of
HTML (the RSC payload now carries one rendered slide element per page instead of one item object,
minus the unused `renditions`); budgets include it.

`VideoBlock` is now a server component: the grid, captions and poster `<img>` render on the server;
`VideoPlayer` (client) receives only `id`, `mp4`, `webm`, `width`, `height`, `title` and swaps the
poster button for `<video controls>` on demand, taking the poster URL from the poster element's
`currentSrc`. `VideoGroup` keeps one active player at a time.

## JavaScript

`lucide-react` is in Next's default `optimizePackageImports` list, so the explicit
`experimental` entry was removed (the analyzer still shows per-icon modules of 0.1–0.2 KB gzip).
`npm run analyze` on the pre-migration build, App Router chunks loaded by every page:

| Chunk | gzip | Largest modules |
|---|---|---|
| `4bd1b696-*.js` | 61.7 KB | `react-dom-client.production.js` (61.6 KB) |
| `794-*.js` | 64.1 KB | `react-server-dom-webpack-client` 7.3 KB, `segment-cache/cache.js` 7.0 KB, `router-reducer/ppr-navigations.js` 4.1 KB, `segment-cache/scheduler.js` 3.8 KB, `react.production.js` 2.9 KB |
| `19-*.js` | 8.6 KB | `embla-carousel` 6.6 KB, `lucide-react` runtime 0.7 KB + icons |
| `500-*.js` | 3.5 KB | `next/link` 1.6 KB, `shared/lib/utils.js` 1.1 KB |
| `app/layout-*.js` | 4.5 KB | `next/script` 1.5 KB, consent + tracking 2.7 KB |

Package totals across client chunks: `next` 232.7 KB (includes the unused pages-router
`framework`/`main` chunks that the export still emits but no page loads), `react-dom` 63.8 KB,
app source 30.2 KB, `lucide-react` 7.8 KB, `embla-carousel-react` 7.0 KB. The shared runtime is
the framework itself; the remaining lever is what each page imports, not a dependency change.

## CSS

One blocking stylesheet per page from the layout: `src/app/globals.css` (fonts, tokens, the
Tailwind v4 base/utilities generated from the sources, `motion.css`; ≈ 12.1–12.6 KB gzip), plus
the legacy CSS-module bundle on product pages until their redesign. Tailwind's palette is reset
(`--color-*: initial`), so only brand utilities are generated. `experimental.inlineCss` was
trialled before the migration and rejected (the CSS is repeated in the RSC payload and blows the
HTML budgets without improving LCP).

## Design-system JavaScript

`cn` runs on merge tables compiled from the sources (`withCn`, 3.2 KB gzip instead of the full
13 KB table); client islands outside `src/components/ui` use `cx` or receive class strings from
the server, so the always-loaded layout, error boundaries and header ship no variant tables. The
mobile-nav sheet (Base UI dialog) is a separate chunk loaded on intent. three + gsap load only in
`src/motion/scene/scene-runtime.ts`, behind `await import()` and motion/Save-Data/viewport gates.

## Re-measuring

```sh
npm run build && npm run check:bundle && npm run check:scene   # budgets
npm run lhci                                   # Lighthouse at 390 (lighthouserc.json)
npx playwright test lcp                        # LCP element and preloads (once `lcp` is in the PR project matcher)
```
