import type { AccentTitle } from "@content/es/home";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/shared/editorial/icon.tsx";
import { cn } from "@/shared/styles/cn.ts";
import { NEED_TONE } from "./door";
import { Accent, Pill } from "./home-ui";

type Props = {
  /** Stable anchor of the chapter (`leer`, `bebe`) and a descriptive alias (`grafismo-fonetico`). */
  id: string;
  alias: string;
  need: "reading" | "feeding";
  /** Media column on the left from lg (reading) or on the right (first meals): the chapters alternate. */
  mediaFirst: boolean;
  media: ReactNode;
  kicker: string;
  /** Stage and format chips («3 a 7 años», «PDF para imprimir»). */
  chips: readonly string[];
  title: AccentTitle;
  pain: string;
  desire: string;
  listLabel: string;
  list: readonly string[];
  /** Product box: name, what it holds, price or guarantee. */
  product: ReactNode;
  /** The chapter's one primary action (navy pill). */
  action: ReactNode;
  /** One line under the action (payment, guarantee, currency). */
  note: string;
  /** Text link to a secondary destination («Ver qué incluye»). */
  secondary: ReactNode;
  /** Anything that must stay next to the action (the affiliate disclosure). */
  after?: ReactNode;
  /** Slug of an affiliate product: marks the chapter as its recommendation block. */
  affiliate?: string;
};

/**
 * One product chapter of the hub (docs/specs/home-hub.md), from the family's need: the media
 * stage beside the copy (pain → desire), what you get, a product box, one primary action with its
 * note, a secondary text link and, for the course, the disclosure. Both chapters render through
 * this component, so they cannot drift in structure or weight; only the media side alternates.
 * The list rises in sequence (`data-reveal` + `--i`).
 */
export function ProductStory({
  id,
  alias,
  need,
  mediaFirst,
  media,
  kicker,
  chips,
  title,
  pain,
  desire,
  listLabel,
  list,
  product,
  action,
  note,
  secondary,
  after,
  affiliate,
}: Props) {
  const tone = NEED_TONE[need];
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-chapter={need}
      data-affiliate-block={affiliate}
      className={cn(
        "cq relative isolate scroll-mt-[calc(1.25rem-var(--section-pad))] overflow-clip section-pad",
        need === "reading"
          ? "bg-[radial-gradient(45%_40%_at_0%_20%,oklch(0.8521_0.0956_187.2/22%),transparent_70%),linear-gradient(180deg,var(--pv-cream),var(--pv-celeste)_45%,var(--pv-cream))]"
          : "bg-[radial-gradient(45%_40%_at_100%_20%,oklch(0.9483_0.0301_55.6/90%),transparent_70%),linear-gradient(180deg,var(--pv-cream),var(--pv-rose)_45%,var(--pv-cream))]",
      )}
    >
      {/* Descriptive alias for links that name the product (`/#grafismo-fonetico`). */}
      <span
        id={alias}
        aria-hidden="true"
        className="absolute top-0 block scroll-mt-[calc(1.25rem-var(--section-pad))]"
      />
      <div className="page-container grid items-center gap-10 cq-lg:grid-cols-2 cq-lg:gap-16">
        <div className={cn("min-w-0", mediaFirst ? "cq-lg:order-1" : "cq-lg:order-2")} data-reveal="blur">
          {media}
        </div>
        <div
          className={cn(
            "grid min-w-0 content-center justify-items-start gap-5",
            mediaFirst ? "cq-lg:order-2" : "cq-lg:order-1",
          )}
        >
          <div className="flex flex-wrap items-center gap-2" data-reveal="">
            <Pill tone={need === "reading" ? "mint" : "lemon"}>{kicker}</Pill>
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-pill bg-white px-3 py-1 text-tiny font-extrabold text-navy shadow-sm ring-1 ring-line"
              >
                {chip}
              </span>
            ))}
          </div>
          <h2
            id={`${id}-title`}
            className="max-w-[17ch] text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] text-balance"
            data-reveal=""
          >
            <Accent title={title} />
          </h2>
          <div className="grid max-w-[52ch] gap-3" data-reveal="">
            <p className="text-pretty text-subtle">{pain}</p>
            <p className="lead text-pretty text-ink">{desire}</p>
          </div>
          <div className="grid w-full gap-3">
            <p className="text-tiny font-extrabold tracking-[0.08em] text-subtle uppercase">{listLabel}</p>
            <ul className="grid grid-cols-1 gap-2.5 cq-md:grid-cols-2 cq-md:gap-x-6 cq-lg:grid-cols-1">
              {list.map((item, index) => (
                <li
                  key={item}
                  data-reveal=""
                  style={{ "--i": index } as CSSProperties}
                  className="flex items-start gap-3 font-semibold text-ink"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-[0.1em] grid size-6 shrink-0 place-items-center rounded-full",
                      need === "reading" ? "bg-mint text-teal" : "bg-peach text-navy",
                    )}
                  >
                    <Icon name="tick" size={15} strokeWidth={3} />
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full" data-reveal="">
            {product}
          </div>
          <div className="grid w-full gap-3" data-reveal="">
            {action}
            <p className="flex items-start gap-2 text-small font-semibold text-pretty text-body">
              <Icon name="shield" size={16} className="mt-[0.2em] shrink-0 text-teal" />
              <span>{note}</span>
            </p>
            {after}
            <p>{secondary}</p>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -z-1 size-[28rem] rounded-full opacity-60",
          tone.glow,
          mediaFirst ? "-bottom-40 -left-40" : "-bottom-40 -right-40",
        )}
      />
    </section>
  );
}

/** The media stage both chapters share: a soft gradient planet with a figure and floating proof. */
export function StoryStage({
  need,
  children,
  caption,
}: {
  need: "reading" | "feeding";
  children: ReactNode;
  caption: string;
}) {
  const tone = NEED_TONE[need];
  return (
    <figure className="relative mx-auto w-full max-w-[36rem]">
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-2xl shadow-float ring-1 ring-white",
          tone.stage,
        )}
      >
        <div
          aria-hidden="true"
          className={cn("absolute top-[8%] left-[10%] aspect-square w-[80%] rounded-full", tone.glow)}
        />
        <div
          aria-hidden="true"
          className="absolute top-[14%] left-[16%] aspect-square w-[68%] rounded-full border-2 border-dashed border-navy/10"
        />
        {children}
      </div>
      <figcaption className="mt-2 text-end text-tiny text-subtle">{caption}</figcaption>
    </figure>
  );
}
