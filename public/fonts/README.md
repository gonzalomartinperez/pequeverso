# Fonts

Self-hosted variable fonts served from `/fonts/` (no request to Google Fonts at build or run
time). They are declared with `@font-face` in `src/styles/tokens.css` and preloaded from
`src/app/layout.tsx` with `ReactDOM.preload`, so the exported HTML carries
`<link rel="preload" as="font">` for both files. See `docs/performance.md`.

| File | Family | Axis | Source package | License |
|---|---|---|---|---|
| `fraunces-latin-wght-7f9d191d.woff2` | Fraunces | wght 100–900 | `@fontsource-variable/fraunces@5.3.0` (upstream github.com/undercasetype/Fraunces) | SIL OFL 1.1 (`OFL-Fraunces.txt`) |
| `nunito-sans-latin-wght-29e38904.woff2` | Nunito Sans | wght 200–1000 | `@fontsource-variable/nunito-sans@5.3.0` (upstream github.com/googlefonts/NunitoSans) | SIL OFL 1.1 (`OFL-NunitoSans.txt`) |

The suffix is the first eight hex characters of the file's SHA-256: `/fonts/*` is served with
`Cache-Control: immutable` (`config/edge-rules.json`), so a new font file must get a new name and
the references in `tokens.css` and `layout.tsx` must be updated together.

Neither family declares a Reserved Font Name, so subset/woff2 redistribution with the
license text is permitted. Spanish diacritics are in the latin subset. Copied 2026-09-12.
