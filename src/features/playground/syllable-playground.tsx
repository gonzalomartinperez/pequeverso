import type { ReactNode } from "react";

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
 * Interactive "Une las sílabas" demo. STUB with the final public API: renders the first word
 * statically. The interactive implementation is owned by the playground module.
 */
export function SyllablePlayground({ words, title, hint, className }: Props) {
  const first = words[0];
  if (!first) return null;
  return (
    <div data-slot="syllable-playground" className={className}>
      <h3>{title}</h3>
      <p>{hint}</p>
      <p>
        {first.syllables.join(" + ")} = {first.word}
      </p>
      {first.page}
    </div>
  );
}
