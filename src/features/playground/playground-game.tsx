"use client";

import { Check, RotateCcw, Sparkles, Star } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import styles from "./playground.module.css";
import { press, slotTexts, tileOrder } from "./syllable-game";

export type GameWord = { syllables: readonly string[]; word: string };

type Props = {
  words: readonly GameWord[];
  /** Server-rendered real page of each word, same order as `words`. */
  pages: readonly ReactNode[];
  title: string;
  hint: string;
  doneLabel: string;
};

const TONES = ["gold", "turquoise", "white", "peach", "celeste"] as const;
/** Star burst vectors (px) around the finished word. */
const STARS = [
  [-120, -58],
  [-70, -86],
  [0, -96],
  [74, -84],
  [124, -52],
  [-132, 20],
  [138, 26],
  [-60, 70],
  [64, 72],
] as const;
const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-9px) rotate(-3deg)" },
  { transform: "translateX(8px) rotate(2deg)" },
  { transform: "translateX(-5px) rotate(-1deg)" },
  { transform: "translateX(3px)" },
  { transform: "translateX(0)" },
];
const WRONG = "Esa sílaba va después. Busca la que sigue.";

/** Approximate advance of a lower-case display glyph, in SVG units at font-size 88. */
const GLYPH = 48;
/** Slot height by word length, so long words ("camaleón") stay on one line at 320 px. */
const SLOT_HEIGHT = {
  short: "h-17 cq-sm:h-24",
  medium: "h-15 cq-sm:h-22",
  long: "h-12 cq-sm:h-20",
} as const;
/** Tile size by count: four or more tiles shrink on narrow containers so they stay in one row. */
const TILE_SIZE = {
  few: { tile: "size-22 text-[2.4rem]", gap: "gap-4" },
  many: { tile: "size-17 text-[1.9rem]", gap: "gap-2.5" },
} as const;

function Slot({ text, filled, height }: { text: string; filled: boolean; height: string }) {
  const width = text.length * GLYPH + 10;
  return (
    <span className={cx(styles.slot, "relative grid px-1")} data-filled={filled ? "" : undefined}>
      <svg
        viewBox={`0 0 ${width} 112`}
        className={cx(height, "w-auto overflow-visible")}
        aria-hidden="true"
        focusable="false"
      >
        <text
          x={width / 2}
          y="84"
          textAnchor="middle"
          fontSize="88"
          className={cx(styles.guide, "font-display")}
        >
          {text}
        </text>
        <text
          x={width / 2}
          y="84"
          textAnchor="middle"
          fontSize="88"
          className={cx(styles.ink, "font-display")}
        >
          {text}
        </text>
      </svg>
      <span className={cx(styles.baseline, "mx-1 h-[3px] rounded-full")} />
    </span>
  );
}

/** The finished word in one piece: replaces the syllable slots once the last one is traced. */
function Whole({ text, height }: { text: string; height: string }) {
  const width = text.length * GLYPH + 10;
  return (
    <span className={cx(styles.whole, "grid px-1")}>
      <svg
        viewBox={`0 0 ${width} 112`}
        className={cx(height, "w-auto overflow-visible")}
        aria-hidden="true"
        focusable="false"
      >
        <text x={width / 2} y="84" textAnchor="middle" fontSize="88" className="fill-navy font-display">
          {text}
        </text>
      </svg>
      <span className="mx-1 h-[3px] rounded-full bg-teal" />
    </span>
  );
}

/**
 * Client island of `SyllablePlayground`: the visitor taps the shuffled syllable tiles in reading
 * order; each hit traces its slot of the dotted word, a miss shakes the tile (no penalty), the
 * finished word gets a star burst, an `aria-live` announcement and the real page turns in.
 */
export function PlaygroundGame({ words, pages, title, hint, doneLabel }: Props) {
  const [current, setCurrent] = useState(0);
  const [placed, setPlaced] = useState(0);
  const [used, setUsed] = useState<ReadonlySet<number>>(new Set());
  const [message, setMessage] = useState("");
  const [round, setRound] = useState(0);
  const tiles = useRef<Array<HTMLButtonElement | null>>([]);
  const titleId = useId();
  const hintId = useId();

  const entry = words[current] ?? words[0];
  if (!entry) return null;
  const { syllables, word } = entry;
  const texts = slotTexts(word, syllables);
  const order = tileOrder(syllables.length, word);
  const done = placed === syllables.length;
  const length = word.length;
  const height = SLOT_HEIGHT[length <= 4 ? "short" : length <= 6 ? "medium" : "long"];
  const tileSize = TILE_SIZE[syllables.length >= 4 ? "many" : "few"];

  const choose = (index: number) => {
    setCurrent(index);
    setPlaced(0);
    setUsed(new Set());
    setMessage("");
    setRound((value) => value + 1);
  };

  const onTile = (index: number, position: number) => {
    const outcome = press(syllables, placed, index, used);
    if (outcome === "ignored") return;
    if (outcome === "wrong") {
      setMessage(WRONG);
      const el = tiles.current[position];
      if (el && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.animate(SHAKE, { duration: 420, easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)" });
      }
      return;
    }
    const next = placed + 1;
    setPlaced(next);
    setUsed(new Set(used).add(index));
    setMessage(outcome === "done" ? `${word}. ${doneLabel}` : texts.slice(0, next).join(""));
  };

  return (
    <div className="grid items-center gap-8 cq-md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] cq-md:gap-10 cq-lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] cq-lg:gap-14">
      <div className="grid min-w-0 gap-6 cq-sm:gap-7">
        <div className="grid gap-2">
          <h3
            id={titleId}
            className="font-display text-[clamp(1.6rem,1.1rem+2vw,2.5rem)] leading-[1.08] tracking-[-0.02em] text-ink"
          >
            {title}
          </h3>
          <p id={hintId} className="max-w-[46ch] text-body">
            {hint}
          </p>
        </div>

        <div
          className={cx(
            styles.board,
            "relative isolate grid min-h-32 place-items-center rounded-xl border border-white bg-white/80 px-4 py-5 shadow-float cq-sm:min-h-40 cq-sm:px-8",
          )}
          data-done={done ? "" : undefined}
        >
          <p className="sr-only">{`${placed} de ${syllables.length}`}</p>
          <div className="absolute top-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {syllables.map((syllable, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: one pill per syllable, fixed order
                key={`${syllable}-${index}`}
                className={cx(
                  "h-1.5 rounded-full transition-all duration-(--duration) ease-out",
                  index < placed ? "w-6 bg-teal" : "w-3 bg-navy/15",
                )}
              />
            ))}
          </div>
          <div className="grid place-items-center *:[grid-area:1/1]" aria-hidden="true">
            <div className={cx(styles.slots, "flex items-end justify-center gap-x-1")}>
              {texts.map((text, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: syllables repeat ("pa", "pa") and never reorder
                <span key={`${round}-${index}`} className="flex items-end">
                  {index > 0 ? (
                    <span className="mb-5 size-2 shrink-0 rounded-full bg-teal/50 cq-sm:mb-7" />
                  ) : null}
                  <Slot text={text} filled={index < placed} height={height} />
                </span>
              ))}
            </div>
            <Whole text={word} height={height} />
          </div>
          {done ? (
            <span key={round} aria-hidden="true">
              {STARS.map(([dx, dy], index) => (
                <Star
                  key={`${dx}:${dy}`}
                  className={cx(
                    styles.star,
                    index % 3 === 0
                      ? "size-5 text-gold"
                      : index % 3 === 1
                        ? "size-4 text-turquoise"
                        : "size-3.5 text-gold",
                  )}
                  fill="currentColor"
                  strokeWidth={1}
                  style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, "--i": index } as CSSProperties}
                />
              ))}
            </span>
          ) : null}
        </div>
        <p
          className={cx(
            styles.done,
            "-mt-3 flex min-h-6 items-center justify-center gap-2 text-center font-extrabold text-teal-text",
          )}
          data-show={done ? "" : undefined}
          aria-hidden="true"
        >
          {done ? (
            <>
              <Sparkles className="size-5 text-teal" aria-hidden="true" />
              {doneLabel}
            </>
          ) : null}
        </p>

        <fieldset
          className={cx("flex min-w-0 flex-wrap justify-center cq-sm:gap-5", tileSize.gap)}
          aria-labelledby={titleId}
          aria-describedby={hintId}
        >
          {order.map((index, position) => {
            const taken = used.has(index);
            return (
              <button
                key={`${round}-${index}`}
                ref={(el) => {
                  tiles.current[position] = el;
                }}
                type="button"
                data-tone={TONES[position % TONES.length]}
                data-slot="syllable-tile"
                data-index={index}
                aria-disabled={taken || done ? true : undefined}
                className={cx(
                  styles.tile,
                  "relative grid cursor-pointer place-items-center rounded-[22px] font-display leading-none text-ink cq-sm:size-28 cq-sm:rounded-[26px] cq-sm:text-[3rem]",
                  tileSize.tile,
                )}
                onClick={() => onTile(index, position)}
              >
                {syllables[index]}
                {taken ? (
                  <span
                    className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-teal text-white shadow-sm"
                    aria-hidden="true"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </fieldset>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {words.length > 1 ? (
            <fieldset className="flex min-w-0 flex-wrap justify-center gap-2" aria-label="Elige una palabra">
              {words.map((item, index) => (
                <button
                  key={item.word}
                  type="button"
                  aria-pressed={index === current}
                  className={cx(
                    "min-h-11 cursor-pointer rounded-pill border-2 px-4 text-small font-extrabold tracking-[0.06em] uppercase transition duration-(--duration-fast) ease-out",
                    index === current
                      ? "border-navy bg-navy text-white shadow-md"
                      : "border-navy/15 bg-white/70 text-navy hover:border-navy/40 hover:bg-white motion-safe:hover:-translate-y-0.5",
                  )}
                  onClick={() => choose(index)}
                >
                  {item.word}
                </button>
              ))}
            </fieldset>
          ) : null}
          {placed > 0 ? (
            <button
              type="button"
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill px-3 text-small font-bold text-teal-text underline-offset-4 hover:underline"
              onClick={() => choose(current)}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Otra vez
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cx(styles.page, "relative mx-auto w-full max-w-[26rem] py-3")}
        data-done={done ? "" : undefined}
      >
        <div
          className="absolute inset-x-4 inset-y-3 -rotate-6 rounded-lg bg-white/60 shadow-md"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-2 inset-y-3 -rotate-2 rounded-lg bg-white/80 shadow-md"
          aria-hidden="true"
        />
        <div
          key={round}
          className={cx(
            styles.card,
            "relative overflow-hidden rounded-lg border-[6px] border-white bg-white shadow-float [&_img]:block [&_img]:h-auto [&_img]:w-full",
          )}
        >
          {pages.map((page, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: pages follow the fixed order of `words`
            <div key={index} hidden={index !== current}>
              {page}
            </div>
          ))}
          <div className={cx(styles.veil, "absolute inset-0 bg-white/55")} aria-hidden="true" />
        </div>
        <span
          className={cx(
            styles.badge,
            "absolute -bottom-1 left-1/2 z-1 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-pill bg-navy px-4 py-2 text-small font-extrabold tracking-[0.08em] text-white uppercase shadow-lg",
          )}
          aria-hidden="true"
        >
          <Star className="size-4 text-gold" fill="currentColor" aria-hidden="true" />
          {word}
        </span>
      </div>
    </div>
  );
}
