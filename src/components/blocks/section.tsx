import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WaveDivider, type WaveFill } from "@/motion/wave-divider";

export type SectionTone = "cream" | "white" | "mint" | "sky" | "lemon" | "rose" | "navy";
export type SectionDivider = "none" | "wave-top" | "wave-bottom" | "overlap";

const sectionVariants = cva("relative section-pad", {
  variants: {
    tone: {
      cream: "bg-cream",
      white: "bg-white",
      mint: "bg-mint [--chip:var(--pv-white)]",
      sky: "bg-sky",
      lemon: "bg-lemon",
      rose: "bg-rose",
      navy: "on-navy bg-navy",
    },
    divider: {
      none: "",
      "wave-top": "-mt-px pt-[calc(var(--section-pad)+var(--wave-height))]",
      "wave-bottom": "pb-[calc(var(--section-pad)+var(--wave-height))]",
      overlap: "flow-root pt-0",
    },
  },
  defaultVariants: { tone: "cream", divider: "none" },
});

type Props = {
  tone?: SectionTone | undefined;
  id?: string | undefined;
  /** Id of the heading that labels the section (aria-labelledby). */
  labelledBy?: string | undefined;
  /** Accessible name when the section has no heading. */
  label?: string | undefined;
  /** Wave edges are drawn inside the section with `dividerTone`; "overlap" pulls the content up over the previous band. */
  divider?: SectionDivider | undefined;
  /** Tone of the neighbouring band a wave divider belongs to (default cream). */
  dividerTone?: WaveFill | undefined;
  /** Skips rendering work until the section nears the viewport (content-visibility: auto). Not for overlap sections. */
  defer?: boolean | undefined;
  /** Wrap children in the centred container (default true). */
  container?: boolean | undefined;
  /** Decorative layer painted under the wave and the content (e.g. `<Universe variant="band" />`). */
  backdrop?: ReactNode | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * Page band: tone (navy re-scopes the semantic colour roles for every child), optional
 * wave/overlap edge, deferred rendering and the centred container. `data-tone` and
 * `data-slot="section"` let motion and tests address bands without classes.
 */
export function Section({
  tone = "cream",
  id,
  labelledBy,
  label,
  divider = "none",
  dividerTone = "cream",
  defer = false,
  container = true,
  backdrop,
  className,
  children,
}: Props) {
  return (
    <section
      id={id}
      data-slot="section"
      data-tone={tone}
      className={cn(
        sectionVariants({ tone, divider }),
        defer && divider !== "overlap" && "defer-render",
        className,
      )}
      aria-labelledby={labelledBy}
      aria-label={label}
    >
      {backdrop}
      {divider === "wave-top" ? (
        <WaveDivider fill={dividerTone} flip className="absolute inset-x-0 top-0" />
      ) : null}
      {container ? (
        <div
          className={cn(
            "page-container",
            backdrop && "relative",
            divider === "overlap" && "relative z-1 -mt-(--section-overlap)",
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
      {divider === "wave-bottom" ? (
        <WaveDivider fill={dividerTone} className="absolute inset-x-0 -bottom-px" />
      ) : null}
    </section>
  );
}
