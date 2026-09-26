import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button classes shared by the Base UI `Button` (client) and by links styled as buttons
 * (`CTAButton`, `CheckoutLink`, …), which stay server-safe by importing only this module.
 * Targets are ≥ 44 px in every size; `primary` (coral pill) is reserved for the purchase action.
 * Every variant sets its own border colour (no base `border-transparent`), so the classes stay
 * correct when used without `cn` (client islands, error boundary, template-string composition).
 *
 * Premium look: every variant is a pill; `primary` paints a coral gradient that slides to the
 * deeper stop on hover (background-position, so it transitions), sweeps a `.pv-shine` highlight
 * (motion.css) and lifts on a coral shadow; the trailing icon (`data-icon="inline-end"`, the
 * arrow of `CTAButton`, `CheckoutLink`, `ProductInterestLink`) slides 4 px on hover. All motion
 * is `motion-safe` and the reduced-motion kill switch stops it. `outline` and `ghost`
 * paint with the surface roles (`--heading`, `--foreground`), so they turn white inside `on-navy`.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border-2 text-center font-sans font-extrabold leading-tight no-underline transition-[background,border-color,color,translate,box-shadow] duration-(--duration) ease-out disabled:pointer-events-none disabled:opacity-50 motion-safe:active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 *:data-[icon=inline-end]:transition-transform *:data-[icon=inline-end]:duration-(--duration) motion-safe:hover:*:data-[icon=inline-end]:translate-x-1 motion-safe:focus-visible:*:data-[icon=inline-end]:translate-x-1",
  {
    variants: {
      variant: {
        primary:
          "pv-shine rounded-pill border-transparent bg-primary bg-linear-to-b from-primary via-primary-hover to-primary-hover bg-size-[100%_200%] bg-top bg-origin-border text-primary-foreground shadow-cta hover:bg-bottom hover:text-primary-foreground hover:shadow-cta-hover motion-safe:hover:-translate-y-0.5 active:shadow-cta",
        secondary:
          "rounded-pill border-white/15 bg-secondary bg-linear-to-b from-secondary via-secondary-hover to-secondary-hover bg-size-[100%_200%] bg-top bg-origin-border text-secondary-foreground shadow-md hover:bg-bottom hover:text-secondary-foreground hover:shadow-lg motion-safe:hover:-translate-y-0.5",
        outline:
          "rounded-pill border-heading bg-transparent text-heading hover:bg-heading hover:text-background hover:shadow-md",
        inverse:
          "rounded-pill border-white bg-white text-navy shadow-md hover:border-gold hover:bg-gold hover:text-ink hover:shadow-lg motion-safe:hover:-translate-y-0.5",
        ghost:
          "rounded-pill border-foreground/25 bg-foreground/4 text-heading hover:border-foreground/60 hover:bg-foreground/8 hover:text-heading",
        link: "min-h-0 rounded-sm border-transparent px-0 text-link underline underline-offset-4 hover:text-link-hover",
      },
      size: {
        default: "min-h-14 px-8 text-[1.0625rem]",
        sm: "min-h-11 px-5 text-[1rem] [&_svg:not([class*='size-'])]:size-[18px]",
        lg: "min-h-16 px-10 text-lead",
        /** Store "add to cart" action: 60 px tall, full width, larger type (pair with `primary`). */
        xl: "min-h-15 w-full px-6 text-[1.125rem] tracking-[0.005em] [&_svg:not([class*='size-'])]:size-[22px]",
        icon: "size-11 rounded-full p-0",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
