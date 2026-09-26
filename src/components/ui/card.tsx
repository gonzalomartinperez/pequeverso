import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Surface with border, radius and elevation. `emphasis` frames the offer, `soft` is a sky
 * panel, `navy` flips the whole content to the on-navy palette. Redesign surfaces:
 * `glass` (frosted white over aurora/photos), `glass-dark` (frosted on navy), `elevated`
 * (white, floating shadow) and `gradient` (white → celeste paper). `lift` raises the card on
 * hover (motion-safe). Each variant owns its background, so `glass` utilities never fight `bg-card`.
 */
const cardVariants = cva("grid min-w-0 content-start gap-3 border text-card-foreground", {
  variants: {
    variant: {
      default: "on-light rounded-lg border-border bg-card shadow-sm",
      emphasis: "on-light rounded-xl border-2 border-navy bg-card shadow-md",
      soft: "on-light rounded-lg border-transparent bg-sky shadow-none",
      navy: "on-navy rounded-lg border-on-navy-chip bg-navy-deep shadow-none",
      glass: "on-light glass rounded-xl shadow-float",
      "glass-dark": "on-navy glass-dark rounded-xl shadow-none",
      elevated: "on-light rounded-xl border-white bg-card shadow-float",
      gradient:
        "on-light rounded-xl border-white bg-card bg-linear-160 from-white from-35% to-celeste shadow-md",
    },
    pad: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-6 sm:p-8",
      xl: "p-6 sm:p-10",
    },
    lift: {
      true: "transition-[translate,box-shadow] duration-(--duration) ease-out hover:shadow-float motion-safe:hover:-translate-y-1",
      false: "",
    },
  },
  defaultVariants: { variant: "default", pad: "md", lift: false },
});

type CardProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof cardVariants> & {
    as?: "div" | "article" | "li" | "section" | "figure";
    /** Reveal on scroll (`data-reveal`); `"blur"` uses the blur-in variant. */
    reveal?: boolean | "blur";
    /** Stagger index (`--i`) for grouped reveals. */
    stagger?: number;
  };

function Card({
  className,
  variant,
  pad,
  lift,
  as: Tag = "div",
  reveal = false,
  stagger,
  style,
  ...props
}: CardProps) {
  const vars = stagger === undefined ? style : ({ ...style, "--i": stagger } as CSSProperties);
  return (
    <Tag
      data-slot="card"
      data-variant={variant ?? "default"}
      data-reveal={reveal === "blur" ? "blur" : reveal ? "" : undefined}
      className={cn(cardVariants({ variant, pad, lift }), className)}
      style={vars}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid gap-2", className)} {...props} />;
}

function CardTitle({
  className,
  as: Tag = "h3",
  ...props
}: ComponentProps<"h3"> & { as?: "h2" | "h3" | "h4" | "p" }) {
  return (
    <Tag data-slot="card-title" className={cn("text-h3 font-extrabold text-heading", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-small text-body", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("grid gap-3", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex flex-wrap items-center gap-3", className)} {...props} />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
