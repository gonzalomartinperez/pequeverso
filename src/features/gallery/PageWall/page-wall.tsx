import { MediaImage } from "@/components/blocks/media-image";

type Props = {
  /** Media ids of real pages (`gf.page.*`, `pack.page.*`), split across the rows in order. */
  ids: readonly string[];
  /** Accessible name of the wall. */
  label: string;
  /** Number of drifting rows (default 2). */
  rows?: 1 | 2 | undefined;
  className?: string | undefined;
};

/**
 * Decorative wall of real pages drifting in opposite directions. STUB with the final public API:
 * a static grid. The animated implementation is owned by the playground/gallery module.
 */
export function PageWall({ ids, label, className }: Props) {
  return (
    <ul data-slot="page-wall" aria-label={label} className={className}>
      {ids.map((id) => (
        <li key={id}>
          <MediaImage id={id} sizes="300px" />
        </li>
      ))}
    </ul>
  );
}
