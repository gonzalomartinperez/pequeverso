#!/usr/bin/env node
// Build-time media pipeline for pequeverso.com.
//
// Reads tools/media/sources.json (declarative list of external sources), derives responsive WebP/AVIF
// images, H.264 clips with posters, the Open Graph card and the favicon set, and writes
// media/manifest.json (provenance, rights, export parameters, output hashes).
//
// Usage (from the repo root or from tools/media):
//   node tools/media/media-build.mjs                 build everything that is missing (idempotent)
//   node tools/media/media-build.mjs --only gf.page  build only ids equal to / starting with the value
//   node tools/media/media-build.mjs --force         re-encode even when the output already exists
//   node tools/media/media-build.mjs --check         verify media/manifest.json against disk (no sources needed)
//   node tools/media/media-build.mjs --no-prune      keep files under public/media that the manifest does not list
//
// Originals never enter the repository: outputs are named <id-slug>-w<width>-<hash8>.<ext> where hash8
// derives from the source sha256 plus the export parameters, so a changed source or a changed quality
// produces a new file name (and the old one is pruned). Videos: <id-slug>-crf<crf>-<hash8>.mp4 and,
// when enabled, <id-slug>-vp9-crf<crf>-<hash8>.webm.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import sharp from "sharp";
import { optimize as svgoOptimize } from "svgo";

const PIPELINE_VERSION = 1;
const MAX_VIDEO_BYTES = 2_200_000;
const MAX_VIDEO_MB = "2.2 MB";
const AVIF_QUALITY = 55;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

const toolDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(toolDir, "..", "..");
const sourcesPath = join(toolDir, "sources.json");
const manifestPath = join(repoRoot, "media", "manifest.json");
const mediaDir = join(repoRoot, "public", "media");
const publicDir = join(repoRoot, "public");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const CHECK = flag("--check");
const FORCE = flag("--force");
const PRUNE = !flag("--no-prune");
const ONLY = option("--only");
const VERBOSE = flag("--verbose");

const toPosix = (p) => p.split("\\").join("/");
const relRepo = (abs) => toPosix(relative(repoRoot, abs));
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const sha256File = (file) => sha256(readFileSync(file));
const slug = (id) => id.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;
const log = (...m) => console.log(...m);
const fail = (msg) => {
  console.error(`media-build: ${msg}`);
  process.exit(1);
};

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function ensureDir(file) {
  mkdirSync(dirname(file), { recursive: true });
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function paramsHash(sourceSha, params) {
  return sha256(`${sourceSha}|v${PIPELINE_VERSION}|${JSON.stringify(params)}`).slice(0, 8);
}

// ---------------------------------------------------------------------------
// --check: manifest vs disk, no external sources needed (runs in CI).
// ---------------------------------------------------------------------------
function checkManifest() {
  if (!existsSync(manifestPath)) fail("media/manifest.json is missing; run the build first");
  const manifest = readJson(manifestPath);
  const errors = [];
  const declared = new Map();
  let total = 0;
  for (const item of manifest.items) {
    for (const out of item.outputs) {
      const abs = resolve(repoRoot, out.file);
      if (declared.has(out.file)) errors.push(`${item.id}: duplicate output ${out.file}`);
      declared.set(out.file, item.id);
      if (!existsSync(abs)) {
        errors.push(`${item.id}: missing ${out.file}`);
        continue;
      }
      const stat = statSync(abs);
      if (stat.size !== out.bytes)
        errors.push(`${item.id}: ${out.file} is ${stat.size} bytes, manifest says ${out.bytes}`);
      if (sha256File(abs) !== out.sha256) errors.push(`${item.id}: ${out.file} sha256 differs from manifest`);
      if (stat.size > MAX_FILE_BYTES) errors.push(`${item.id}: ${out.file} exceeds 5 MB`);
      if (out.file.startsWith("public/media/")) total += stat.size;
    }
    if (item.kind === "video") {
      const mp4 = item.outputs.find((o) => o.format === "mp4");
      if (!mp4) errors.push(`${item.id}: video without mp4 output`);
      else if (mp4.bytes > MAX_VIDEO_BYTES) errors.push(`${item.id}: mp4 exceeds ${MAX_VIDEO_MB}`);
      if (!item.outputs.some((o) => o.format === "webp")) errors.push(`${item.id}: video without poster`);
    }
  }
  for (const file of walk(mediaDir)) {
    const rel = relRepo(file);
    if (!declared.has(rel)) errors.push(`orphan file not in manifest: ${rel}`);
  }
  if (total > MAX_TOTAL_BYTES) errors.push(`public/media total ${mb(total)} exceeds ${mb(MAX_TOTAL_BYTES)}`);
  log(
    `media-build --check: ${manifest.items.length} items, ${declared.size} outputs, public/media ${mb(total)}`,
  );
  if (errors.length) {
    for (const e of errors) console.error(`  x ${e}`);
    process.exit(1);
  }
  log("  ok: manifest matches disk");
}

if (CHECK) {
  checkManifest();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const sources = readJson(sourcesPath);
const ffprobePath = ffprobeStatic.path;
if (!ffmpegPath || !existsSync(ffmpegPath))
  fail("ffmpeg-static binary not found; run `npm install` inside tools/media");
if (!existsSync(ffprobePath)) fail("ffprobe-static binary not found; run `npm install` inside tools/media");

const libraryRoots = Object.fromEntries(
  Object.entries(sources.libraries).map(([name, cfg]) => [
    name,
    toPosix(process.env[cfg.env] || cfg.default),
  ]),
);

function sourceAbs(source) {
  const root = libraryRoots[source.library];
  if (!root) fail(`unknown library "${source.library}"`);
  const abs = resolve(root, source.path);
  if (!existsSync(abs)) fail(`source not found: ${abs} (set ${sources.libraries[source.library].env})`);
  return abs;
}

function resolveProvenance(item) {
  const base = typeof item.provenance === "string" ? sources.provenanceProfiles[item.provenance] : {};
  if (typeof item.provenance === "string" && !base)
    fail(`${item.id}: unknown provenance profile ${item.provenance}`);
  return { ...base, ...(typeof item.provenance === "object" ? item.provenance : {}) };
}

function resolveRights(item) {
  const { basis: _basis, ...defaults } = sources.rights;
  return { ...defaults, ...(item.rights || {}) };
}

function selected(item) {
  if (!ONLY) return true;
  return item.id === ONLY || item.id.startsWith(ONLY);
}

function run(bin, cmdArgs, opts = {}) {
  const res = spawnSync(bin, cmdArgs, { encoding: "buffer", maxBuffer: 256 * 1024 * 1024, ...opts });
  if (res.status !== 0) {
    throw new Error(`${bin} ${cmdArgs.join(" ")}\n${res.stderr?.toString() || ""}`);
  }
  return res.stdout;
}

function ffprobe(file) {
  const out = run(ffprobePath, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=codec_name,width,height,r_frame_rate,duration:format=duration,size",
    "-of",
    "json",
    file,
  ]).toString();
  const json = JSON.parse(out);
  const stream = json.streams?.[0] || {};
  const [num, den] = String(stream.r_frame_rate || "30/1")
    .split("/")
    .map(Number);
  return {
    codec: stream.codec_name,
    width: stream.width,
    height: stream.height,
    fps: den ? Math.round((num / den) * 100) / 100 : null,
    duration: Number(json.format?.duration ?? stream.duration ?? 0),
  };
}

async function outputRecord(abs, extra = {}) {
  const buf = readFileSync(abs);
  return { file: relRepo(abs), bytes: buf.length, sha256: sha256(buf), ...extra };
}

async function imageDims(abs) {
  const meta = await sharp(abs).metadata();
  return { width: meta.width, height: meta.height };
}

function encoderFor(pipeline, spec) {
  const { format, quality, alphaQuality } = spec;
  if (format === "webp") {
    return pipeline.webp({ quality, effort: 6, smartSubsample: true, alphaQuality: alphaQuality ?? 100 });
  }
  if (format === "avif") return pipeline.avif({ quality, effort: 6 });
  return fail(`unsupported image format ${format}`);
}

// Encodes one responsive width. Returns the manifest output record.
async function encodeImage(item, src, sourceSha, spec) {
  const { width, format, quality, sharpen, alphaQuality } = spec;
  const params = { width, format, quality, sharpen: Boolean(sharpen), alphaQuality: alphaQuality ?? null };
  const hash = paramsHash(sourceSha, params);
  const file = join(mediaDir, item.group, `${slug(item.id)}-w${width}-${hash}.${format}`);
  if (!existsSync(file) || FORCE) {
    ensureDir(file);
    let pipeline = sharp(src).rotate().resize({ width, withoutEnlargement: true });
    if (sharpen) pipeline = pipeline.sharpen({ sigma: 0.5, m1: 0.5, m2: 1 });
    await encoderFor(pipeline, spec).toFile(file);
    if (VERBOSE) log(`  wrote ${relRepo(file)}`);
  }
  const dims = await imageDims(file);
  return outputRecord(file, { ...dims, format, quality });
}

// Role defaults (sources.json roles.<role>) merged with the item-level `outputs` override:
// `widths` (WebP), `avif` (AVIF widths, [] disables), `avifQuality`, `quality`, `sharpen`, `alphaQuality`.
function imageSpec(item) {
  const role = sources.roles[item.role];
  if (!role) fail(`${item.id}: unknown role ${item.role}`);
  return { avif: [], avifQuality: AVIF_QUALITY, ...role, ...(item.outputs || {}) };
}

async function buildImage(item, src, sourceSha) {
  const spec = imageSpec(item);
  // Never enlarge: widths above the source width collapse to the source width (deduplicated).
  const meta = await sharp(src).metadata();
  const effective = (widths) =>
    [...new Set(widths.map((w) => Math.min(w, meta.width)))].sort((a, b) => a - b);
  const outputs = [];
  for (const width of effective(spec.widths)) {
    outputs.push(await encodeImage(item, src, sourceSha, { ...spec, width, format: "webp" }));
  }
  const avif = { ...spec, format: "avif", quality: spec.avifQuality, alphaQuality: undefined };
  for (const width of effective(spec.avif)) {
    outputs.push(await encodeImage(item, src, sourceSha, { ...avif, width }));
  }
  return outputs;
}

// 1200x630 Open Graph card: cream background, centered logo, navy band at the bottom.
// Fixed file names (src/lib/metadata.ts references the PNG); cheap enough to re-render every run,
// and sharp's encoders are deterministic, so unchanged inputs produce byte-identical files.
async function buildOgCard(item, src) {
  const c = item.compose;
  const png = join(mediaDir, item.group, `${c.basename}.png`);
  const webp = join(mediaDir, item.group, `${c.basename}.webp`);
  ensureDir(png);
  const logo = await sharp(src).resize({ width: c.logoWidth, withoutEnlargement: true }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const area = c.height - c.bandHeight;
  const band = await sharp({
    create: { width: c.width, height: c.bandHeight, channels: 3, background: c.band },
  })
    .png()
    .toBuffer();
  const composed = await sharp({
    create: { width: c.width, height: c.height, channels: 3, background: c.background },
  })
    .composite([
      {
        input: logo,
        left: Math.round((c.width - logoMeta.width) / 2),
        top: Math.round((area - logoMeta.height) / 2),
      },
      { input: band, left: 0, top: area },
    ])
    .png()
    .toBuffer();
  await sharp(composed).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toFile(png);
  await sharp(composed).webp({ quality: 90, effort: 6 }).toFile(webp);
  return [
    await outputRecord(png, { ...(await imageDims(png)), format: "png", quality: 90 }),
    await outputRecord(webp, { ...(await imageDims(webp)), format: "webp", quality: 90 }),
  ];
}

// ICO container wrapping a single PNG image (supported by every current browser).
function icoFromPng(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(6 + 16, 12);
  return Buffer.concat([header, entry, pngBuffer]);
}

async function buildFavicons(item, src) {
  const c = item.compose;
  const transparent = (size) =>
    sharp(src)
      .resize({ width: size, height: size, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
  const onBackground = async (size) =>
    sharp({ create: { width: size, height: size, channels: 3, background: c.background } })
      .composite([{ input: await transparent(size), left: 0, top: 0 }])
      .png({ compressionLevel: 9 })
      .toBuffer();

  const files = [];
  const write = async (name, buffer, dims, format) => {
    const abs = join(publicDir, name);
    writeFileSync(abs, buffer);
    files.push(await outputRecord(abs, { ...dims, format, quality: null }));
  };
  await write("favicon.ico", icoFromPng(await transparent(48), 48), { width: 48, height: 48 }, "ico");
  await write("favicon.png", await transparent(512), { width: 512, height: 512 }, "png");
  await write("apple-touch-icon.png", await onBackground(180), { width: 180, height: 180 }, "png");
  await write("icon-192.png", await transparent(192), { width: 192, height: 192 }, "png");
  await write("icon-512.png", await transparent(512), { width: 512, height: 512 }, "png");
  const png192 = await transparent(192);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 192 192" width="192" height="192"><title>Pequeverso</title><image width="192" height="192" href="data:image/png;base64,${png192.toString("base64")}"/></svg>`;
  const optimized = svgoOptimize(svg, { multipass: true, plugins: ["preset-default"] }).data;
  await write("icon.svg", Buffer.from(`${optimized}\n`), { width: 96, height: 96 }, "svg");
  const webmanifest = {
    name: "Pequeverso",
    short_name: "Pequeverso",
    lang: "es",
    start_url: "/",
    display: "browser",
    background_color: c.background,
    theme_color: "#003068",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  writeFileSync(join(publicDir, "manifest.webmanifest"), `${JSON.stringify(webmanifest, null, 2)}\n`);
  return files;
}

const VIDEO_SCALE = "scale=w='if(gte(iw,ih),-2,720)':h='if(gte(iw,ih),720,-2)'";
const MP4_CRF_LADDER = [26, 28, 30, 32];
const WEBM_CRF_LADDER = [33, 37, 41];

function ffmpegArgs(src, encode, codecArgs, out) {
  const filters = `${VIDEO_SCALE},fps=${encode.fps},format=${encode.pixelFormat}`;
  const head = ["-y", "-v", "error", "-i", src, "-t", String(encode.maxSeconds), "-vf", filters];
  return [...head, ...codecArgs, "-an", "-map_metadata", "-1", out];
}

function mp4Args(encode, crf) {
  const gop = String(encode.gop);
  const rate = ["-maxrate", encode.maxrate, "-bufsize", encode.bufsize];
  const keyframes = ["-g", gop, "-keyint_min", gop, "-sc_threshold", "0", "-movflags", "+faststart"];
  return [
    "-c:v",
    "libx264",
    "-profile:v",
    encode.profile,
    "-preset",
    "slow",
    "-crf",
    String(crf),
    ...rate,
    ...keyframes,
  ];
}

function webmArgs(encode, crf) {
  const quality = ["-b:v", "0", "-crf", String(crf), "-row-mt", "1", "-deadline", "good"];
  return ["-c:v", "libvpx-vp9", ...quality, "-g", String(encode.gop)];
}

function findExisting(groupDir, prefix, suffix) {
  if (!existsSync(groupDir)) return undefined;
  const name = readdirSync(groupDir).find((f) => f.startsWith(prefix) && f.endsWith(suffix));
  return name ? join(groupDir, name) : undefined;
}

// The final crf is part of the file name so a skipped (already built) clip reports the crf it was
// actually encoded with; hash8 covers the source and the other parameters. The ceiling is enforced by
// stepping crf up the ladder; returns undefined when even the last step is too large.
function encodeLadder(item, target, ladder, ceiling, encodeAt) {
  const groupDir = join(mediaDir, item.group);
  const existing = findExisting(groupDir, target.prefix, target.suffix);
  if (existing && !FORCE) return { file: existing, crf: Number(/-crf(\d+)-/.exec(existing)[1]) };
  if (existing) rmSync(existing);
  mkdirSync(groupDir, { recursive: true });
  for (const crf of ladder) {
    const file = join(groupDir, `${target.prefix}${crf}${target.suffix}`);
    encodeAt(crf, file);
    if (statSync(file).size <= ceiling) {
      if (VERBOSE) log(`  wrote ${relRepo(file)}`);
      return { file, crf };
    }
    rmSync(file);
    log(`  ${item.id}: ${target.label} at crf ${crf} is above ${mb(ceiling)}`);
  }
  return undefined;
}

function encodeMp4(item, src, sourceSha, encode) {
  const target = {
    label: "mp4",
    prefix: `${slug(item.id)}-crf`,
    suffix: `-${paramsHash(sourceSha, encode)}.mp4`,
  };
  const encodeAt = (crf, file) => run(ffmpegPath, ffmpegArgs(src, encode, mp4Args(encode, crf), file));
  return encodeLadder(item, target, MP4_CRF_LADDER, MAX_VIDEO_BYTES, encodeAt);
}

// Optional WebM (VP9, constant quality). Kept only when it is not larger than the mp4.
function encodeWebm(item, src, sourceSha, encode, mp4) {
  const params = {
    ...encode,
    codec: "vp9",
    profile: null,
    crf: WEBM_CRF_LADDER[0],
    maxrate: null,
    bufsize: null,
  };
  const target = {
    label: "webm",
    prefix: `${slug(item.id)}-vp9-crf`,
    suffix: `-${paramsHash(sourceSha, params)}.webm`,
  };
  const encodeAt = (crf, file) => run(ffmpegPath, ffmpegArgs(src, encode, webmArgs(encode, crf), file));
  const built = encodeLadder(item, target, WEBM_CRF_LADDER, statSync(mp4).size, encodeAt);
  if (!built) log(`  ${item.id}: webm skipped (larger than the mp4 at every crf)`);
  return built;
}

function pruneWebm(item) {
  const stale = findExisting(join(mediaDir, item.group), `${slug(item.id)}-vp9-`, ".webm");
  if (stale) rmSync(stale);
}

// Poster: a frame from the master at posterAt seconds, resized like a "poster" role image.
async function buildPosters(item, src, sourceSha, v) {
  const posterRole = sources.roles.poster;
  const frame = run(ffmpegPath, [
    "-v",
    "error",
    "-ss",
    String(v.posterAt),
    "-i",
    src,
    "-frames:v",
    "1",
    "-f",
    "image2pipe",
    "-vcodec",
    "png",
    "-",
  ]);
  const outputs = [];
  for (const width of v.posterWidths || posterRole.widths) {
    const params = { poster: true, posterAt: v.posterAt, width, quality: posterRole.quality };
    const phash = paramsHash(sourceSha, params);
    const file = join(mediaDir, item.group, `${slug(item.id)}-poster-w${width}-${phash}.webp`);
    if (!existsSync(file) || FORCE) {
      await sharp(frame)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: posterRole.quality, effort: 6 })
        .toFile(file);
    }
    outputs.push(
      await outputRecord(file, { ...(await imageDims(file)), format: "webp", quality: posterRole.quality }),
    );
  }
  return outputs;
}

async function buildVideo(item, src, sourceSha) {
  const v = { maxSeconds: 15, posterAt: 1, posterWidths: [480, 720], webm: false, ...(item.video || {}) };
  const probe = ffprobe(src);
  const duration = Math.min(probe.duration, v.maxSeconds);
  const encode = {
    codec: "h264",
    profile: "high",
    pixelFormat: "yuv420p",
    shortSide: 720,
    fps: 30,
    crf: MP4_CRF_LADDER[0],
    maxrate: "1500k",
    bufsize: "3000k",
    gop: 60,
    audio: "stripped",
    maxSeconds: v.maxSeconds,
  };
  const mp4 = encodeMp4(item, src, sourceSha, encode);
  if (!mp4) fail(`${item.id}: mp4 still above ${MAX_VIDEO_MB}`);
  const dims = ffprobe(mp4.file);
  const size = { width: dims.width, height: dims.height };
  const outputs = [await outputRecord(mp4.file, { ...size, format: "mp4", quality: `crf${mp4.crf}` })];
  if (!v.webm) pruneWebm(item);
  const webm = v.webm ? encodeWebm(item, src, sourceSha, encode, mp4.file) : undefined;
  if (webm)
    outputs.push(await outputRecord(webm.file, { ...size, format: "webm", quality: `crf${webm.crf}` }));
  outputs.push(...(await buildPosters(item, src, sourceSha, v)));
  return {
    outputs,
    video: {
      ...encode,
      crf: mp4.crf,
      sourceDuration: Math.round(probe.duration * 1000) / 1000,
      duration: Math.round(duration * 1000) / 1000,
      trimmed: probe.duration > v.maxSeconds,
      posterAt: v.posterAt,
      webm: Boolean(webm),
      ...(webm ? { webmCodec: "vp9", webmCrf: webm.crf } : {}),
    },
  };
}

async function buildItem(item) {
  const src = sourceAbs(item.source);
  const bytes = statSync(src).size;
  const sourceSha = sha256File(src);
  const kind = item.role === "video" ? "video" : "image";
  const sourceMeta = kind === "video" ? ffprobe(src) : await sharp(src).metadata();
  const record = {
    id: item.id,
    role: item.role,
    page: item.page,
    kind,
    source: {
      library: item.source.library,
      path: item.source.path,
      sha256: sourceSha,
      bytes,
      width: sourceMeta.width,
      height: sourceMeta.height,
    },
    provenance: resolveProvenance(item),
    rights: resolveRights(item),
    alt: item.alt,
  };
  if (item.text) record.text = item.text;
  if (item.compose?.kind === "og-card") record.outputs = await buildOgCard(item, src);
  else if (item.compose?.kind === "favicons") record.outputs = await buildFavicons(item, src);
  else if (kind === "video") {
    const built = await buildVideo(item, src, sourceSha);
    record.outputs = built.outputs;
    record.video = built.video;
  } else record.outputs = await buildImage(item, src, sourceSha);
  return record;
}

async function main() {
  const previous = existsSync(manifestPath) ? readJson(manifestPath) : { items: [] };
  const previousById = new Map(previous.items.map((i) => [i.id, i]));
  const ids = new Set();
  const items = [];
  const started = Date.now();
  for (const item of sources.items) {
    if (ids.has(item.id)) fail(`duplicate id ${item.id}`);
    ids.add(item.id);
    if (!selected(item)) {
      const prev = previousById.get(item.id);
      if (prev) items.push(prev);
      else log(`  skip ${item.id} (not selected, no previous record)`);
      continue;
    }
    const record = await buildItem(item);
    const size = record.outputs.reduce((n, o) => n + o.bytes, 0);
    log(
      `${record.id.padEnd(20)} ${String(record.outputs.length).padStart(2)} outputs ${mb(size).padStart(9)}`,
    );
    items.push(record);
  }
  if (ONLY && items.length !== sources.items.length) {
    log("note: partial build (--only) without previous records for the other ids; manifest is incomplete");
  }

  const declared = new Set(items.flatMap((i) => i.outputs.map((o) => o.file)));
  if (PRUNE && !ONLY) {
    for (const file of walk(mediaDir)) {
      const rel = relRepo(file);
      if (!declared.has(rel)) {
        rmSync(file);
        log(`  pruned ${rel}`);
      }
    }
  }

  let total = 0;
  for (const file of walk(mediaDir)) total += statSync(file).size;
  const manifest = {
    $schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    generator: `tools/media/media-build.mjs v${PIPELINE_VERSION} (sharp ${sharp.versions.sharp}, libvips ${sharp.versions.vips})`,
    extras: ["public/manifest.webmanifest"],
    items,
  };
  ensureDir(manifestPath);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  log(
    `\nmedia-build: ${items.length} items, ${declared.size} outputs, public/media ${mb(total)} in ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
  if (total > MAX_TOTAL_BYTES) fail(`public/media exceeds ${mb(MAX_TOTAL_BYTES)}`);
}

await main();
