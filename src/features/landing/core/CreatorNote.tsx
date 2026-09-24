import { Eyebrow } from "@/components/blocks/eyebrow";
import { Card } from "@/components/ui/card";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  paragraphs: readonly string[];
  signature: string;
};

/** A short note from the kit's author (rendered only when the copy enables it). */
export function CreatorNote({ titleId, kicker, title, paragraphs, signature }: Props) {
  return (
    <Card pad="lg" className="mx-auto max-w-[70ch] justify-items-start border-l-4 border-l-gold" reveal>
      <Eyebrow>{kicker}</Eyebrow>
      <h2 id={titleId} className="text-h3">
        {title}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className="font-display font-medium text-ink">{signature}</p>
    </Card>
  );
}
