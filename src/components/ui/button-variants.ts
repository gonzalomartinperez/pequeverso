import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button classes shared by the Base UI `Button` (client) and by links styled as buttons
 * (`CTAButton`, `CheckoutLink`, …), which stay server-safe by importing only this module.
 * Targets are ≥ 44 px in every size; `primary` (coral pill) is reserved for the purchase action.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border-2 border-transparent text-center font-sans font-extrabold leading-tight no-underline transition-[background-color,border-color,color,transform,box-shadow] duration-(--duration-fast) ease-out disabled:pointer-events-none disabled:opacity-50 motion-safe:active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary:
          "rounded-pill border-primary bg-primary text-primary-foreground shadow-cta hover:border-primary-hover hover:bg-primary-hover hover:text-primary-foreground",
        secondary:
          "rounded-md border-secondary bg-secondary text-secondary-foreground hover:border-secondary-hover hover:bg-secondary-hover hover:text-secondary-foreground",
        outline:
          "rounded-md border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-secondary-foreground",
        inverse: "rounded-md border-white bg-white text-navy hover:border-gold hover:bg-gold hover:text-ink",
        ghost:
          "rounded-md border-line-strong bg-transparent text-secondary hover:border-secondary hover:bg-muted hover:text-secondary",
        link: "min-h-0 rounded-sm px-0 text-link underline underline-offset-4 hover:text-link-hover",
      },
      size: {
        default: "min-h-14 px-8 text-base",
        sm: "min-h-11 px-4 text-base [&_svg:not([class*='size-'])]:size-[18px]",
        lg: "min-h-16 px-10 text-lead",
        icon: "size-11 rounded-md p-0",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
