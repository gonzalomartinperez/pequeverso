import type { AccentTitle } from "@content/es/home";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { ProductInterestLink } from "@/features/commerce/ProductInterestLink/ProductInterestLink";
import { cn } from "@/lib/utils";
import { product } from "./home-data";

/**
 * Home links lead to the product page, never to payment: navy (on light) or white (on navy)
 * pills with a shine sweep; coral stays reserved for the purchase CTA on the landing.
 */
const PILL = "pv-shine rounded-pill motion-safe:hover:-translate-y-0.5";
export const LINK_NAVY = cn(
  buttonVariants({ variant: "secondary", size: "lg" }),
  PILL,
  "shadow-[0_18px_36px_-14px_oklch(0.3175_0.1094_256.25/70%)] hover:text-gold",
);
export const LINK_WHITE = cn(
  buttonVariants({ variant: "inverse", size: "lg" }),
  PILL,
  "shadow-[0_18px_40px_-16px_oklch(0_0_0/60%)]",
);
export const LINK_OUTLINE = cn(buttonVariants({ variant: "outline", size: "sm" }), PILL, "min-h-12 px-5");
export const LINK_HEADER = cn(buttonVariants({ variant: "secondary", size: "sm" }), "rounded-pill");

/** Hub → product link (keeps acquisition params, emits PequeversoProductInterest). */
export function ProductLink({
  position,
  className,
  children,
  hash = "",
}: {
  position: string;
  className: string;
  children: ReactNode;
  hash?: string;
}) {
  return (
    <ProductInterestLink
      href={`${product.path}${hash}`}
      product={product.slug}
      position={position}
      className={className}
    >
      {children}
    </ProductInterestLink>
  );
}

const PILL_TONES = {
  white: ["bg-white text-navy shadow-[0_6px_16px_-8px_oklch(0.3175_0.1094_256.25/35%)]", "bg-teal"],
  mint: ["bg-mint text-teal-text", "bg-teal"],
  lemon: ["bg-lemon text-ink", "bg-coral"],
  gold: ["bg-gold/14 text-gold ring-1 ring-gold/25", "bg-gold"],
} as const;

/** Eyebrow pill with a dot (the redesign's kicker). */
export function Pill({
  tone = "mint",
  as: Tag = "p",
  className,
  children,
}: {
  tone?: keyof typeof PILL_TONES;
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-2 rounded-pill px-3.5 py-1.5 text-tiny font-extrabold tracking-[0.08em] text-balance uppercase",
        PILL_TONES[tone][0],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", PILL_TONES[tone][1])} />
      {children}
    </Tag>
  );
}

/** Heading text with its one gradient phrase (`text-gradient` on light, `-sky` on navy). */
export function Accent({ title, tone = "light" }: { title: AccentTitle; tone?: "light" | "dark" }) {
  return (
    <>
      {title.before}
      <span className={tone === "dark" ? "text-gradient-sky" : "text-gradient"}>{title.accent}</span>
      {title.after}
    </>
  );
}

/** Decorative four-point sparkle (brand star family). */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M12 0c.6 5.6 3.1 9 12 12-8.9 3-11.4 6.4-12 12-.6-5.6-3.1-9-12-12 8.9-3 11.4-6.4 12-12Z"
      />
    </svg>
  );
}
