import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type ButtonVariantProps, buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Base UI button (client). For links styled as buttons use `buttonVariants()` on `<a>`/`<Link>`. */
function Button({
  className,
  variant = "primary",
  size = "default",
  block,
  type = "button",
  ...props
}: ButtonPrimitive.Props & ButtonVariantProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
