/**
 * Pure rules of the "Une las sílabas" playground (no React, no DOM) so they run in unit tests and
 * give the server and the client the same tile order (no hydration mismatch).
 */

export type Outcome = "correct" | "wrong" | "done" | "ignored";

/** 32-bit FNV-1a hash of a string: a stable seed per word. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed salt chosen so the landing's two-syllable words split between in-order and reversed. */
const SHUFFLE_SALT = ":1";

/**
 * Display order of the tiles: a deterministic shuffle of `0…count-1` seeded by `key`. Two-syllable
 * words may come out in reading order or reversed (a fixed reversal would be its own pattern);
 * three or more syllables never show the solved order.
 */
export function tileOrder(count: number, key: string): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  if (count < 2) return order;
  const next = random(hash(`${key}${SHUFFLE_SALT}`));
  for (let index = count - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [order[index], order[swap]] = [order[swap] as number, order[index] as number];
  }
  if (count > 2 && order.every((value, index) => value === index)) order.push(order.shift() as number);
  return order;
}

/**
 * Lower-case text of each syllable as printed in `word` (keeps accents such as "león"): slices the
 * word by syllable length when the lengths add up, otherwise lower-cases the syllables.
 */
export function slotTexts(word: string, syllables: readonly string[]): string[] {
  const total = syllables.reduce((sum, syllable) => sum + syllable.length, 0);
  if (total !== word.length) return syllables.map((syllable) => syllable.toLocaleLowerCase("es"));
  let start = 0;
  return syllables.map((syllable) => {
    const text = word.slice(start, start + syllable.length);
    start += syllable.length;
    return text;
  });
}

/**
 * Result of pressing the tile that holds syllable `index` (reading order) when `placed` syllables
 * are already in the word. Repeated syllables ("PA" + "PA") are interchangeable; `used` tiles and
 * presses after the word is complete are ignored.
 */
export function press(
  syllables: readonly string[],
  placed: number,
  index: number,
  used: ReadonlySet<number> = new Set(),
): Outcome {
  if (placed >= syllables.length || used.has(index) || syllables[index] === undefined) return "ignored";
  if (syllables[index] !== syllables[placed]) return "wrong";
  return placed + 1 === syllables.length ? "done" : "correct";
}
