"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon } from "lucide-react";
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

/** One FAQ entry: a white card whose border turns teal while open. */
function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors duration-(--duration) data-open:border-teal",
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
          "group/accordion-trigger flex min-h-14 flex-1 items-center justify-between gap-4 px-6 py-4 text-left font-extrabold text-heading focus-visible:-outline-offset-3 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-chip text-chip-foreground transition-transform duration-(--duration) ease-out group-aria-expanded/accordion-trigger:rotate-180"
        >
          <ChevronDownIcon className="size-4" strokeWidth={2.4} />
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
      <div className={cn("max-w-[70ch] px-6 pt-0 pb-6 text-body", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
