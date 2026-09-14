import { Card } from "@/components/ui/Card/Card";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import styles from "./CreatorNote.module.css";

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
    <Card pad="lg" className={styles.note} reveal>
      <Eyebrow>{kicker}</Eyebrow>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className={styles.signature}>{signature}</p>
    </Card>
  );
}
