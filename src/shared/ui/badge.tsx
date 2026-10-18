import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/shared/styles/cn.ts";
import { type BadgeVariantProps, badgeVariants } from "@/shared/ui/badge-variants.ts";

/** Small uppercase pill label (`dot` adds the eyebrow colour dot) (Base UI `render` for custom elements); see `badge-variants.ts`. */
function Badge({
  className,
  variant = "chip",
  dot = false,
  render,
  ...props
}: useRender.ComponentProps<"span"> & BadgeVariantProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(badgeVariants({ variant, dot }), className) }, props),
    render,
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
