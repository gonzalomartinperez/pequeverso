import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { type BadgeVariantProps, badgeVariants } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

/** Small uppercase label (Base UI `render` for custom elements); see `badge-variants.ts`. */
function Badge({
  className,
  variant = "chip",
  render,
  ...props
}: useRender.ComponentProps<"span"> & BadgeVariantProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(badgeVariants({ variant }), className) }, props),
    render,
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
