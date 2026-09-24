import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Surface with border, radius and elevation. `emphasis` frames the offer, `soft` is a sky
 * panel, `navy` flips the whole content to the on-navy palette.
 */
const cardVariants = cva("grid min-w-0 content-start gap-3 rounded-lg border bg-card text-card-foreground", {
  variants: {
    variant: {
      default: "border-border shadow-sm",
      emphasis: "border-2 border-navy shadow-md",
      soft: "border-transparent bg-sky shadow-none",
      navy: "on-navy border-on-navy-chip bg-navy-deep shadow-none",
    },
    pad: {
      none: "p-0",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: { variant: "default", pad: "md" },
});

type CardProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof cardVariants> & {
    as?: "div" | "article" | "li" | "section" | "figure";
    /** Reveal on scroll (`data-reveal`). */
    reveal?: boolean;
    /** Stagger index (`--i`) for grouped reveals. */
    stagger?: number;
  };

function Card({
  className,
  variant,
  pad,
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
      data-reveal={reveal ? "" : undefined}
      className={cn(cardVariants({ variant, pad }), className)}
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
