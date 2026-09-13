/**
 * Typed access to the build-time media manifest (media/manifest.json).
 *
 * Every image and clip under public/media is produced by tools/media/media-build.mjs and described in
 * the manifest (source, provenance, rights, export parameters). Pages never hard-code /media/ paths:
 * they ask for an id (`gf.hero`, `gf.page.07`, `video.gf.mapa`, ...) and render what comes back.
 *
 * Unknown ids throw at render time, which for a static export means at build time.
 * Keep this module free of React and other dependencies so it can run in server components,
 * metadata routes and unit tests alike. The manifest is a plain JSON import; call the helpers from
 * server components or at module top level so the JSON does not end up in client bundles.
 */
import manifest from "../../media/manifest.json" with { type: "json" };

type ManifestOutput = {
  file: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: string;
  quality: number | string | null;
};

type ManifestItem = {
  id: string;
  role: string;
  page: string;
  kind: "image" | "video";
  alt: { es: string };
  text?: { title: string; description: string };
  outputs: ManifestOutput[];
  video?: { duration: number; fps: number; audio: string };
  rights: { redistribution: string; approvedAt: string | null };
};

export type MediaId = string;

export type ImageSource = {
  /** MIME type for a `<source type>` element, e.g. "image/avif". */
  type: string;
  srcSet: string;
};

export type ImageAsset = {
  id: MediaId;
  /** URL of the largest rendition whose width is at most 1440 px. */
  src: string;
  /** Width descriptors for every rendition of the primary format. */
  srcSet: string;
  /** Intrinsic size of `src`; use for width/height attributes to avoid layout shift. */
  width: number;
  height: number;
  alt: string;
  /** Alternative formats (AVIF first) for a `<picture>` element, when the pipeline produced any. */
  sources?: ImageSource[];
  /** Every rendition of the primary format, smallest first (for custom `sizes` logic). */
  renditions: ReadonlyArray<{ src: string; width: number; height: number }>;
};

export type VideoAsset = {
  id: MediaId;
  mp4: string;
  webm?: string;
  poster: { src: string; srcSet: string; width: number; height: number; alt: string };
  width: number;
  height: number;
  /** Seconds, after trimming. */
  duration: number;
  /** Accessible text alternative (the clips are silent demonstrations). */
  title: string;
  description: string;
  /** "public-repo-approved" or "pending-owner-confirmation"; the deploy gate reads the manifest directly. */
  redistribution: string;
};

const MAX_DEFAULT_WIDTH = 1440;
const MIME: Record<string, string> = { avif: "image/avif", webp: "image/webp", png: "image/png" };
const FORMAT_ORDER = ["avif", "webp", "png"];

const items = manifest.items as ManifestItem[];
const byId: ReadonlyMap<string, ManifestItem> = new Map(items.map((item) => [item.id, item]));

/** Every id declared in the manifest, in build order. @internal */
export const mediaIds: ReadonlyArray<MediaId> = items.map((item) => item.id);

/** True when the manifest declares the id (any kind). @internal */
export function hasMedia(id: MediaId): boolean {
  return byId.has(id);
}

function lookup(id: MediaId, kind: ManifestItem["kind"]): ManifestItem {
  const item = byId.get(id);
  if (!item) {
    throw new Error(
      `media: unknown id "${id}". Declare it in tools/media/sources.json and run "node tools/media/media-build.mjs".`,
    );
  }
  if (item.kind !== kind) {
    throw new Error(`media: "${id}" is a ${item.kind}, use ${kind === "video" ? "getVideo" : "getImage"}().`);
  }
  return item;
}

/** "public/media/x.webp" -> "/media/x.webp" (also works for the favicon files at the public root). */
function urlOf(file: string): string {
  return file.startsWith("public/") ? file.slice("public".length) : `/${file}`;
}

function srcSetOf(outputs: ManifestOutput[]): string {
  return outputs.map((o) => `${urlOf(o.file)} ${o.width}w`).join(", ");
}

function byWidth(a: ManifestOutput, b: ManifestOutput): number {
  return a.width - b.width;
}

function largestWithin(outputs: ManifestOutput[], max: number): ManifestOutput {
  const fitting = outputs.filter((o) => o.width <= max);
  const chosen = (fitting.length ? fitting : outputs).at(-1);
  if (!chosen) throw new Error("media: item has no outputs");
  return chosen;
}

/**
 * Responsive image data for `<img>` / `<picture>`.
 * The primary format is WebP (PNG when no WebP rendition exists, e.g. the favicon set).
 */
export function getImage(id: MediaId): ImageAsset {
  const item = lookup(id, "image");
  const imageOutputs = item.outputs.filter((o) => MIME[o.format]).sort(byWidth);
  const primaryFormat = imageOutputs.some((o) => o.format === "webp")
    ? "webp"
    : (imageOutputs[0]?.format ?? "");
  const primary = imageOutputs.filter((o) => o.format === primaryFormat);
  if (!primary.length) throw new Error(`media: "${id}" has no image outputs`);
  const main = largestWithin(primary, MAX_DEFAULT_WIDTH);
  const sources: ImageSource[] = [];
  for (const format of FORMAT_ORDER) {
    if (format === primaryFormat) continue;
    const group = imageOutputs.filter((o) => o.format === format);
    if (group.length) sources.push({ type: MIME[format] ?? `image/${format}`, srcSet: srcSetOf(group) });
  }
  return {
    id,
    src: urlOf(main.file),
    srcSet: srcSetOf(primary),
    width: main.width,
    height: main.height,
    alt: item.alt.es,
    ...(sources.length ? { sources } : {}),
    renditions: primary.map((o) => ({ src: urlOf(o.file), width: o.width, height: o.height })),
  };
}

/** Clip data for a `<video>` element with poster and a text alternative. */
export function getVideo(id: MediaId): VideoAsset {
  const item = lookup(id, "video");
  const mp4 = item.outputs.find((o) => o.format === "mp4");
  const webm = item.outputs.find((o) => o.format === "webm");
  const posters = item.outputs.filter((o) => o.format === "webp").sort(byWidth);
  if (!mp4) throw new Error(`media: "${id}" has no mp4 output`);
  const poster = largestWithin(posters, MAX_DEFAULT_WIDTH);
  return {
    id,
    mp4: urlOf(mp4.file),
    ...(webm ? { webm: urlOf(webm.file) } : {}),
    poster: {
      src: urlOf(poster.file),
      srcSet: srcSetOf(posters),
      width: poster.width,
      height: poster.height,
      alt: item.alt.es,
    },
    width: mp4.width,
    height: mp4.height,
    duration: item.video?.duration ?? 0,
    title: item.text?.title ?? item.alt.es,
    description: item.text?.description ?? "",
    redistribution: item.rights.redistribution,
  };
}
