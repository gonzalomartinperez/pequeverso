import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/shared/styles/cn.ts";
import { type ButtonVariantProps, buttonVariants } from "@/shared/ui/button-variants.ts";

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
