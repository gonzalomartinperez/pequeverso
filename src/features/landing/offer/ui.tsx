import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small visual primitives shared by the post-purchase pages (offer, thank-you, support). They
 * only compose tokens and the aurora/glass utilities; no behaviour.
 */

type KickerProps = {
  tone?: "light" | "dark" | "warm" | undefined;
  as?: "p" | "span" | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/** Pill eyebrow with a leading dot (mint on paper, gold on navy, peach for the downsell). */
export function Kicker({ tone = "light", as: Tag = "p", className, children }: KickerProps) {
  return (
    <Tag
      data-slot="kicker"
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-2 rounded-pill border px-3.5 py-1.5 text-tiny leading-snug font-extrabold tracking-[0.08em] text-balance uppercase",
        "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']",
        tone === "dark" && "border-gold/35 bg-gold/12 text-gold",
        tone === "light" && "border-teal/20 bg-mint text-navy",
        tone === "warm" && "border-coral/20 bg-peach text-navy",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Splits a heading so its last clause can carry the gradient accent: "A. B." → ["A.", "B."],
 * "A: B." → ["A:", "B."]. Returns the whole text as lead when there is no clause break.
 */
export function splitAccent(text: string): [lead: string, accent: string] {
  const match = /^(.+?[.:])\s+(\S.*)$/.exec(text);
  if (!match?.[1] || !match[2]) return [text, ""];
  return [match[1], match[2]];
}

/** Heading text with the gradient accent on its final clause (navy → teal, or turquoise → gold on navy). */
export function AccentText({ text, tone = "light" }: { text: string; tone?: "light" | "dark" | undefined }) {
  const [lead, accent] = splitAccent(text);
  if (!accent) return <>{text}</>;
  return (
    <>
      {lead} <span className={tone === "dark" ? "text-gradient-sky" : "text-gradient"}>{accent}</span>
    </>
  );
}

/** Scattered star field for navy bands (pure CSS, decorative). */
export function StarField({ className }: { className?: string | undefined }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-70",
        "bg-[radial-gradient(1.5px_1.5px_at_12%_18%,white_50%,transparent_51%),radial-gradient(1px_1px_at_32%_42%,white_50%,transparent_51%),radial-gradient(1.5px_1.5px_at_58%_12%,white_50%,transparent_51%),radial-gradient(1px_1px_at_72%_64%,white_50%,transparent_51%),radial-gradient(2px_2px_at_88%_26%,white_50%,transparent_51%),radial-gradient(1px_1px_at_22%_78%,white_50%,transparent_51%),radial-gradient(1.5px_1.5px_at_46%_88%,white_50%,transparent_51%),radial-gradient(1px_1px_at_94%_82%,white_50%,transparent_51%)]",
        className,
      )}
    />
  );
}

/** Four-point gold star (decorative sparkle next to floating compositions). */
export function Sparkle({
  className,
  size = 28,
}: {
  className?: string | undefined;
  size?: number | undefined;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn(
        "pointer-events-none absolute text-gold drop-shadow-[0_0_10px_oklch(0.89_0.16_94/0.7)]",
        className,
      )}
    >
      <path
        fill="currentColor"
        d="M12 0c.6 5.6 2.4 8.4 12 12-9.6 3.6-11.4 6.4-12 12-.6-5.6-2.4-8.4-12-12C9.6 8.4 11.4 5.6 12 0Z"
      />
    </svg>
  );
}
