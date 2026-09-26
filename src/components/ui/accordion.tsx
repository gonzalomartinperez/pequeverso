"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  );
}

/**
 * One entry. `card` (default): a separate rounded white card that lifts (floating shadow, accent
 * border) while open. `lines`: the store product-details look (hairline divider, no box).
 */
function AccordionItem({
  className,
  variant = "card",
  ...props
}: AccordionPrimitive.Item.Props & { variant?: "card" | "lines" }) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      data-variant={variant}
      className={cn(
        variant === "lines"
          ? "group/accordion-item border-b border-line-strong first:border-t"
          : "group/accordion-item on-light overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-[border-color,box-shadow] duration-(--duration) ease-out hover:border-accent/30 data-open:border-accent/40 data-open:shadow-float",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex min-h-14 flex-1 items-center justify-between gap-4 rounded-lg px-5 py-4 text-left sm:px-6 group-data-[variant=lines]/accordion-item:rounded-sm group-data-[variant=lines]/accordion-item:px-0 font-extrabold text-heading focus-visible:-outline-offset-3 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="relative grid size-9 shrink-0 place-items-center rounded-full bg-accent/12 text-secondary transition-[rotate,background-color,color] duration-(--duration) ease-out group-aria-expanded/accordion-trigger:rotate-180 group-aria-expanded/accordion-trigger:bg-secondary group-aria-expanded/accordion-trigger:text-secondary-foreground group-data-[variant=lines]/accordion-item:size-7 group-data-[variant=lines]/accordion-item:bg-transparent group-data-[variant=lines]/accordion-item:text-heading group-data-[variant=lines]/accordion-item:group-aria-expanded/accordion-trigger:bg-transparent group-data-[variant=lines]/accordion-item:group-aria-expanded/accordion-trigger:text-heading"
        >
          <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
          <span className="absolute h-3.5 w-0.5 rounded-full bg-current transition-[scale] duration-(--duration) ease-out group-aria-expanded/accordion-trigger:scale-y-0" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-(--duration) ease-out data-ending-style:h-0 data-starting-style:h-0"
      {...props}
    >
      <div
        className={cn(
          "max-w-[70ch] px-5 pt-0 pb-6 text-body sm:px-6 group-data-[variant=lines]/accordion-item:px-0 group-data-[variant=lines]/accordion-item:pr-10 group-data-[variant=lines]/accordion-item:pb-5",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
