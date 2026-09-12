# Media

Images, video and icons enter the repository only through the build-time pipeline in `tools/media`.
Every file under `public/media` (and the favicon set at the `public/` root) has a record in
`media/manifest.json` with its source, provenance, rights and export parameters. Pages never
hard-code `/media/...` paths: they call `getImage(id)` / `getVideo(id)` from `src/lib/media.ts`.

Budget: **5 MB per file, 25 MB for `public/media` in total** (target 16–20 MB), enforced by
`npm run check:media` (`scripts/check-media-budget.mjs`) and by `media-build.mjs --check`.
Current state: 68 items, 174 outputs, 15.1 MB.

## Pipeline

```
external libraries (read-only, outside the repo)      tools/media/sources.json (declarative)
  ai-business-assets  ─┐                                  id, role, page, source, provenance,
  ai-business-ops     ─┼─►  tools/media/media-build.mjs ◄─ rights, alt, output spec
  content-studio      ─┘        sharp + ffmpeg-static
                                      │
                       ┌──────────────┼──────────────────┐
                       ▼              ▼                  ▼
              public/media/**   public/favicon.ico …   media/manifest.json
              (webp/avif/mp4)   icon.svg, webmanifest   (provenance + hashes)
                                                              │
                                              src/lib/media.ts (getImage / getVideo)
```

### Setup

```sh
cd tools/media && npm install      # own package.json/.npmrc; ffmpeg-static needs its install script
```

`tools/media` is a separate npm package (`tools/media/package.json`, exact versions: sharp,
ffmpeg-static, ffprobe-static, svgo). Its `node_modules` and `.cache` are git-ignored. The root
`package.json` and lockfile are untouched; CI never installs these tools because CI only *verifies*
the committed outputs.

Library roots default to the local workstation layout and can be overridden:

| Library | Env var | Default |
|---|---|---|
| `ai-business-assets` | `EXTERNAL_ASSETS_ROOT` | `D:/07-proyectos/business/ai-business-assets` |
| `ai-business-ops` | `EXTERNAL_OPS_ROOT` | `D:/07-proyectos/business/ai-business-ops` |
| `pequeverso-content-studio` | `EXTERNAL_STUDIO_ROOT` | `D:/07-proyectos/business/pequeverso-content-studio` |

### Commands (from the repo root)

| Command | Effect |
|---|---|
| `node tools/media/media-build.mjs` | Build everything that is missing, prune orphans, rewrite the manifest. Idempotent: an unchanged source with unchanged parameters is skipped. |
| `node tools/media/media-build.mjs --only gf.page` | Only ids equal to or starting with the value (previous manifest records are kept for the rest; no pruning). |
| `node tools/media/media-build.mjs --force` | Re-encode even when the output file exists. |
| `node tools/media/media-build.mjs --check` | Verify `media/manifest.json` against disk (bytes + sha256, orphans, ceilings). Needs no external sources; safe in CI. |
| `node tools/media/media-build.mjs --no-prune` | Keep undeclared files under `public/media` (debugging only). |
| `node scripts/check-media-budget.mjs` | Repository guard: every file declared, per-file and total ceilings, no forbidden formats. |

### Roles, widths, quality

| Role | Widths (px) | WebP quality | Notes |
|---|---|---|---|
| `hero` | 480 / 768 / 1024 / 1440 | 82 | `gf.hero` also gets an AVIF at 1024 (`sources` in the helper). |
| `scene` | 480 / 768 / 1024 | 78 | AI-generated lifestyle scenes. |
| `page` | 640 / 1100 | 80 | Real product-page renders; light `sharpen()` for text. Portrait pack pages clamp to 1055 (source width). |
| `card` | 360 / 520 / 720 | 76 | Resource / pack cover cards. |
| `thumb` | 240 / 480 | 72 | Reserved. |
| `brand` | per item (96/192/512 isotipo, 320/640 logo) | 90 (alpha 100) | Transparency preserved. |
| `poster` | 480 / 720 | 72 | Video posters, frame taken from the master at `posterAt` seconds. |
| `og` | 1200×630 | PNG (palette) + WebP 90 | Composed with sharp: cream `#fffaf2`, centered logo, navy `#003068` band. Fixed file names (referenced by `src/lib/metadata.ts`). |
| `icons` | 32 ico, 96 svg, 180, 192, 512 | PNG | `favicon.ico` wraps a 32 px PNG; `icon.svg` embeds the 96 px PNG (there is no vector master). |
| `video` | short side 720 (720×1280 vertical) | H.264 High, yuv420p, 30 fps, crf 26 → 28 → 30 until ≤ 2.5 MB, `-maxrate 1500k -bufsize 3000k -g 60`, faststart, **audio stripped**, ≤ 15 s | Optional WebM (VP9) only when `video.webm: true` in `sources.json` and the result is not larger than the mp4. Disabled by default to protect the budget. |

All encoders use `effort 6`, `withoutEnlargement` and strip metadata. Widths above the source width
collapse to the source width and are deduplicated.

### Naming and caching

Outputs are named `<id-slug>-w<width>-<hash8>.<ext>` under `public/media/<group>/`
(videos: `<id-slug>-crf<crf>-<hash8>.mp4`, posters `<id-slug>-poster-w<width>-<hash8>.webp`).
`hash8` is derived from the **source sha256 plus the export parameters** (pipeline version, width,
format, quality, sharpening). A new source or a changed parameter therefore yields a new file name,
the old file is pruned, and `/media/*` can be served as `Cache-Control: public, max-age=31536000,
immutable` (rule `immutable-media` in `config/edge-rules.json`). The only fixed names are the OG
card (`/media/brand/pequeverso-og-1200x630.png|.webp`) and the favicon set at the root; they are
small and are re-rendered on every build (sharp's encoders are deterministic, so unchanged inputs
give byte-identical files).

x264 output is *not* byte-reproducible across machines/thread counts. The committed mp4 is the
reference; `--check` verifies it, and a `--force` rebuild will legitimately change its hash.

### Manifest (`media/manifest.json`)

```jsonc
{
  "$schemaVersion": 1,
  "generatedAt": "ISO",
  "items": [{
    "id": "gf.hero", "role": "hero", "page": "grafismo-fonetico", "kind": "image" | "video",
    "source": { "library", "path", "sha256", "bytes", "width", "height" },
    "provenance": { "origin": "ai-generated"|"owner-render"|"owner-recorded"|"owner-designed",
                    "tool", "date", "people": "none"|"synthetic"|"owner",
                    "minors": "none"|"synthetic", "release": "n/a"|"pending", "notes"? },
    "rights": { "owner", "license": "proprietary-all-rights-reserved",
                "redistribution": "public-repo-approved"|"pending-owner-confirmation", "approvedAt": null|ISO },
    "alt": { "es": "..." },
    "text"?: { "title", "description" },            // videos and pack pages
    "outputs": [{ "file": "public/media/...", "width", "height", "bytes", "sha256", "format", "quality" }],
    "video"?: { "codec", "profile", "pixelFormat", "fps", "crf", "maxrate", "gop", "audio": "stripped", "duration", ... }
  }]
}
```

`outputs[].file` is repo-relative with forward slashes, exactly what `scripts/check-media-budget.mjs`
expects. Source paths are relative to the library root, never absolute, and no original is copied.

## Using media in pages

```ts
import { getImage, getVideo } from "@/lib/media";

const hero = getImage("gf.hero");      // { src, srcSet, width, height, alt, sources?, renditions }
const demo = getVideo("video.gf.mapa"); // { mp4, webm?, poster: { src, srcSet }, width, height, title, description }
```

- `src` is the largest rendition ≤ 1440 px; always pass `width`/`height` to `<img>` (CLS ≤ 0.1).
- For `<picture>`, render `sources` (AVIF first) before the WebP `<img>`.
- Videos are silent demonstrations: render `title`/`description` as visible text or `aria-describedby`;
  they are the text alternative required by WCAG.
- Unknown ids throw with a clear message, so a typo fails `next build`, not production.
- Call the helpers in server components or at module scope; the manifest is a JSON import and
  should not travel to client bundles.

Ids currently declared: `brand.isotipo`, `brand.logo`, `brand.og`, `brand.icons`, `gf.hero`,
`gf.scene.{mesa,trazo,carpeta,mecanismo,flatlay,stack,entrega,cierre}`, `gf.page.01…20`,
`gf.card.01…09`, `pack.card.01…09`, `pack.page.01…12`, `pack.hero`,
`video.gf.{bota,mapa,paloma,maleta}`. `gf.hero` renders at 1440×1080 max (4:3).

## Rights and provenance rules

- Every item states `provenance.origin`, the tool, the date, and whether people/minors appear.
  Lifestyle scenes are **AI-generated (ChatGPT image generation, June 2026)** with synthetic people;
  worksheet pages are owner renders of the product PDFs; the brand raster is owner-designed (Canva).
- `rights.redistribution` must be `public-repo-approved` before an item may be referenced by a page
  that ships. `pending-owner-confirmation` items are built and committed so the pages can be wired,
  but the deploy gate (coordinator) refuses to release while any *referenced* item is pending.
- Never commit originals, product PDFs, backups, anything above 5 MB, or media with unresolved
  rights. Sources stay in the external libraries; only derived files enter the repo.
- Alt text lives in `sources.json` (neutral Spanish, product name **Grafismo Fonético**, never the
  legacy name "Trazos y Sonidos").

## Deliberately excluded

| Excluded | Why |
|---|---|
| Social-proof clips with an adult on camera (`gf3-gf-prueba-social-*`, `UGC-*`, `0711/0712`, `podcast`) | Identifiable person; no signed release. |
| `pequeverso-content-studio/…/situaciones/` and `references/` | Third-party TikTok downloads; not ours. |
| Meta ad exports (`exports/advertising/meta/**`) | Campaign creatives with claims/prices baked in. |
| Hotmart covers at full 1254² size | Store artwork; not needed at that size and adds ~2 MB per file. |
| `downsell-50-off-premium-hero-v2.png` | "50 % OFF" text baked into the image (business facts are configuration, not pixels). |
| Landing-v1 social-proof composites (`main-social-proof-*`, `upsell-*-social-proof`) | Could read as testimonials; the site does not invent social proof. |
| WebM renditions | Would add ~5 MB for a marginal gain; H.264 + poster covers every target browser. |

## Adding an asset

1. Put the master in the right external library (never in this repo).
2. Add an entry to `tools/media/sources.json`: unique `id` (`<page>.<kind>.<slug>`), `role`,
   `page`, `group` (folder under `public/media`), `source` (`library` + relative `path`),
   `provenance` (profile name or inline object), optional `rights` override, `alt.es`, optional
   `outputs` (`widths`, `avif`) or `video` (`maxSeconds`, `posterAt`, `posterWidths`, `webm`).
3. `node tools/media/media-build.mjs --only <id>` then a full `node tools/media/media-build.mjs`
   (prunes and rewrites the manifest).
4. `node scripts/check-media-budget.mjs` and `node tools/media/media-build.mjs --check`.
5. Reference it with `getImage("<id>")` / `getVideo("<id>")` and commit outputs + manifest together.

## Pending owner confirmations

| Topic | Status | Action |
|---|---|---|
| Demo clips `video.gf.*` | `rights.redistribution = pending-owner-confirmation` | Frames show a child's hand/forearm (and briefly hair) next to the adult's hands; no face. Owner must confirm consent for any minor shown and that the printed material in the clips is their own. Then set `rights` in `sources.json` and rebuild. |
| Logo vector master | Only raster PNG exports exist (Canva, 2026-08-02) | `icon.svg` embeds a PNG. Ask the owner for the SVG/AI master to replace it. |
| AI-generated labelling | Scenes and cards are AI-generated | Decide whether pages must label them ("imagen ilustrativa generada con IA"); the manifest already carries `provenance.origin = ai-generated` for the pages to use. |
| `approvedAt` | Set to the coordinator brief date (2026-09-12) for images | Replace with the owner's sign-off date when it exists. |
