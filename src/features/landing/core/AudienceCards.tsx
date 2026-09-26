import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type AudienceCard = { title: string; items: readonly string[] };

type Props = {
  yes: AudienceCard;
  no: AudienceCard;
  /** Optional lifestyle photo beside the cards (from lg). */
  photo?: ReactNode | undefined;
};

/**
 * "Es para ti / no es para ti": an honest comparison so the visitor can self-qualify before
 * paying — a bright card with checks and a quieter one with crosses.
 */
export function AudienceCards({ yes, no, photo }: Props) {
  return (
    <div
      className={cn(
        "grid gap-5",
        photo && "cq-lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] cq-lg:items-stretch",
      )}
    >
      {photo ? <div className="hidden min-h-full cq-lg:grid">{photo}</div> : null}
      <ul className="grid gap-4 cq-md:grid-cols-2" role="list">
        <li
          className="grid content-start gap-4 rounded-2xl border border-white bg-white p-6 shadow-float cq-sm:p-8"
          data-reveal=""
        >
          <h3 className="flex items-center gap-3 text-h3 text-ink">
            <span className="grid size-10 place-items-center rounded-full bg-mint text-teal">
              <Icon name="heart" size={20} strokeWidth={2.4} />
            </span>
            {yes.title}
          </h3>
          <ul className="grid gap-3" role="list">
            {yes.items.map((item) => (
              <li key={item} className="flex items-start gap-3 font-semibold text-ink">
                <Icon name="check" size={20} strokeWidth={2.4} className="mt-0.5 shrink-0 text-teal" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </li>
        <li
          className="grid content-start gap-4 rounded-2xl border border-navy/10 bg-white/55 p-6 cq-sm:p-8"
          data-reveal=""
          style={{ "--i": 1 } as CSSProperties}
        >
          <h3 className="flex items-center gap-3 text-h3 text-ink">
            <span className="grid size-10 place-items-center rounded-full bg-sky text-navy">
              <Icon name="eye" size={20} strokeWidth={2.4} />
            </span>
            {no.title}
          </h3>
          <ul className="grid gap-3" role="list">
            {no.items.map((item) => (
              <li key={item} className="flex items-start gap-3 font-semibold text-body">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-5 shrink-0 place-items-center text-lg leading-none text-subtle"
                >
                  ×
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
}
