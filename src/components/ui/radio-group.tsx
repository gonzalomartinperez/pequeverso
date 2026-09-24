"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive data-slot="radio-group" className={cn("grid w-full gap-3", className)} {...props} />
  );
}

const radioItemVariants = cva(
  "group/radio-group-item peer relative flex shrink-0 items-center justify-center transition-[background-color,border-color,color] duration-(--duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Classic 20 px dot with a 44 px hit area. */
        dot: "size-5 rounded-full border-2 border-input bg-card after:absolute after:-inset-3 data-checked:border-secondary data-checked:bg-secondary",
        /** Pill chip that fills navy when checked (age selector, filters). */
        chip: "min-h-11 gap-2 rounded-pill border-2 border-line-strong bg-card px-4 font-extrabold text-heading hover:border-secondary data-checked:border-secondary data-checked:bg-secondary data-checked:text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "dot" },
  },
);

function RadioGroupItem({
  className,
  variant = "dot",
  children,
  ...props
}: RadioPrimitive.Root.Props & VariantProps<typeof radioItemVariants>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      data-variant={variant}
      className={cn(radioItemVariants({ variant }), className)}
      {...props}
    >
      {variant === "dot" ? (
        <RadioPrimitive.Indicator
          data-slot="radio-group-indicator"
          className="flex items-center justify-center"
        >
          <span className="size-2 rounded-full bg-secondary-foreground" />
        </RadioPrimitive.Indicator>
      ) : (
        children
      )}
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem, radioItemVariants };
