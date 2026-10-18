/**
 * Deterministic starfield shared by the static SVG fallback (server) and the WebGL runtime
 * (client), so the canvas takes over exactly where the still image left off.
 */
export type Starfield = {
  count: number;
  /** x, y in [0, 1] of the stage; z depth in [0, 1] (0 far, 1 near). */
  positions: Float32Array;
  /** Point size multiplier per star (0.6–1.6). */
  sizes: Float32Array;
  /** 1 for a gold star, 0 for a white one. */
  tints: Uint8Array;
};

export const STAR_COUNT = 140;
export const STAR_SEED = 2026;
export const DEPTH_LAYERS = 3;

/** Mulberry32: small, seedable, good enough for layout jitter. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds `count` stars from `seed`; one gold star in about every eight. */
export function buildStarfield(count = STAR_COUNT, seed = STAR_SEED): Starfield {
  const random = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const tints = new Uint8Array(count);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = random();
    positions[index * 3 + 1] = random();
    positions[index * 3 + 2] = random();
    sizes[index] = 0.6 + random();
    tints[index] = random() < 0.125 ? 1 : 0;
  }
  return { count, positions, sizes, tints };
}

export type StaticLayer = { depth: number; tint: 0 | 1; path: string };

/** Stars per tile of the static fallback and the tile edge in CSS pixels (same density at any width). */
export const TILE_STARS = 36;
export const TILE_SIZE = 320;

/** WebGL star count for a stage of `width` × `height` px: the static tile's density, bounded. */
export function starCountFor(width: number, height: number): number {
  const tiles = (Math.max(1, width) * Math.max(1, height)) / (TILE_SIZE * TILE_SIZE);
  return Math.round(Math.min(900, Math.max(STAR_COUNT, tiles * TILE_STARS * 1.15)));
}

/**
 * Groups the stars into `DEPTH_LAYERS` × 2 SVG paths (depth band × tint) of tiny squares in a
 * `TILE_SIZE` box, so the fallback costs a handful of elements instead of one per star.
 */
export function buildStaticLayers(field = buildStarfield(TILE_STARS)): StaticLayer[] {
  const buckets = new Map<string, StaticLayer>();
  for (let index = 0; index < field.count; index += 1) {
    const z = field.positions[index * 3 + 2] ?? 0;
    const band = Math.min(DEPTH_LAYERS - 1, Math.floor(z * DEPTH_LAYERS));
    const tint = (field.tints[index] ?? 0) as 0 | 1;
    const key = `${band}-${tint}`;
    const layer = buckets.get(key) ?? { depth: (band + 0.5) / DEPTH_LAYERS, tint, path: "" };
    const size = Math.round((field.sizes[index] ?? 1) * (0.9 + z) * 10) / 10;
    const x = Math.round((field.positions[index * 3] ?? 0) * 1000);
    const y = Math.round((field.positions[index * 3 + 1] ?? 0) * 1000);
    layer.path += `M${x} ${y}h${size}v${size}h-${size}z`;
    buckets.set(key, layer);
  }
  return [...buckets.values()].sort((a, b) => a.depth - b.depth || a.tint - b.tint);
}
