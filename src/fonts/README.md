# Fonts

Self-hosted variable fonts loaded through `next/font/local` (no request to Google Fonts at
build or run time; `next/font/google` fails on offline builds).

| File | Family | Axis | Source package | License |
|---|---|---|---|---|
| `fraunces-latin-wght-normal.woff2` | Fraunces | wght 100–900 | `@fontsource-variable/fraunces@5.3.0` (upstream github.com/undercasetype/Fraunces) | SIL OFL 1.1 (`OFL-Fraunces.txt`) |
| `nunito-sans-latin-wght-normal.woff2` | Nunito Sans | wght 200–1000 | `@fontsource-variable/nunito-sans@5.3.0` (upstream github.com/googlefonts/NunitoSans) | SIL OFL 1.1 (`OFL-NunitoSans.txt`) |

Neither family declares a Reserved Font Name, so subset/woff2 redistribution with the
license text is permitted. Spanish diacritics are in the latin subset. Copied 2026-09-12.
