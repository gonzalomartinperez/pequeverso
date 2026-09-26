import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PlaygroundGame } from "./playground-game";

export type PlaygroundWord = {
  /** Syllables in reading order, upper case (e.g. ["GA", "TO"]). */
  syllables: readonly string[];
  /** The word as printed on the page, lower case (e.g. "gato"). */
  word: string;
  /** The real worksheet for this word, rendered on the server (`<MediaImage id="gf.page.18" … />`). */
  page: ReactNode;
};

type Props = {
  /** Words to choose from; the first one is shown initially. */
  words: readonly PlaygroundWord[];
  /** Heading shown above the tiles. */
  title: string;
  /** Short instruction under the heading. */
  hint: string;
  /** Message announced when the word is complete. */
  doneLabel: string;
  className?: string | undefined;
};

/**
 * Interactive "Une las sílabas" demo on its own light surface (cream → celeste), so it reads the
 * same inside a navy band or on paper. The server renders the frame and each word's real page;
 * the client island (`PlaygroundGame`) receives the pages already rendered, plus plain strings.
 */
export function SyllablePlayground({ words, title, hint, doneLabel, className }: Props) {
  if (!words.length) return null;
  return (
    <div
      data-slot="syllable-playground"
      className={cn(
        "cq on-light relative isolate overflow-hidden rounded-xl border border-white/70 p-5 text-ink shadow-[0_40px_90px_-30px_oklch(0.2_0.08_256/55%)] sm:rounded-2xl sm:p-8 lg:p-12",
        "bg-[radial-gradient(60%_55%_at_100%_0%,oklch(0.8521_0.0956_187.2/30%),transparent_70%),radial-gradient(50%_50%_at_0%_100%,oklch(0.965_0.0699_98.77/55%),transparent_70%),linear-gradient(135deg,var(--pv-cream)_0%,var(--pv-white)_45%,var(--pv-celeste)_100%)]",
        className,
      )}
    >
      <PlaygroundGame
        words={words.map(({ syllables, word }) => ({ syllables: [...syllables], word }))}
        pages={words.map((item) => item.page)}
        title={title}
        hint={hint}
        doneLabel={doneLabel}
      />
    </div>
  );
}
