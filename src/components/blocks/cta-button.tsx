import { ArrowRight, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { type ButtonVariantProps, buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type Common = ButtonVariantProps & {
  children: ReactNode;
  className?: string;
  /** Leading icon (lucide). */
  icon?: LucideIcon;
  /** Trailing icon: "arrow" for navigation, "external" for links that leave the site, or a lucide icon. */
  iconAfter?: "arrow" | "external" | LucideIcon;
};
type LinkProps = Common & { href: string; external?: boolean } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className"
  >;
type ButtonProps = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

function Content({ icon: Icon, iconAfter, children }: Pick<Common, "icon" | "iconAfter" | "children">) {
  const After = iconAfter === "arrow" ? ArrowRight : iconAfter === "external" ? ExternalLink : iconAfter;
  return (
    <>
      {Icon ? <Icon aria-hidden="true" focusable="false" strokeWidth={2.4} data-icon="inline-start" /> : null}
      <span>{children}</span>
      {After ? (
        <After
          aria-hidden="true"
          focusable="false"
          strokeWidth={2.4}
          className="size-[18px]"
          data-icon="inline-end"
        />
      ) : null}
    </>
  );
}

/**
 * Call to action styled with `buttonVariants`: a `Link` for internal paths, an `<a>` for
 * external URLs (new tab, `rel="noopener"`, external icon by default) and mail links, a
 * server-safe `<button>` otherwise. Interactive buttons with handlers use `Button` from ui.
 */
export function CTAButton(props: LinkProps | ButtonProps) {
  if (typeof props.href === "string") {
    const { href, external, variant, size, block, className, children, icon, iconAfter, ...rest } = props;
    const classes = cn(buttonVariants({ variant, size, block }), className);
    const isExternal = external || /^https?:/.test(href);
    const isMail = /^mailto:/.test(href);
    if (isExternal || isMail) {
      return (
        <a
          href={href}
          data-slot="cta-button"
          className={classes}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener" : undefined}
          {...rest}
        >
          <Content icon={icon} iconAfter={iconAfter ?? (isExternal ? "external" : undefined)}>
            {children}
          </Content>
        </a>
      );
    }
    return (
      <Link href={href} data-slot="cta-button" className={classes} {...rest}>
        <Content icon={icon} iconAfter={iconAfter}>
          {children}
        </Content>
      </Link>
    );
  }
  const { variant, size, block, className, children, type = "button", icon, iconAfter, ...rest } = props;
  return (
    <button
      type={type}
      data-slot="cta-button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...rest}
    >
      <Content icon={icon} iconAfter={iconAfter}>
        {children}
      </Content>
    </button>
  );
}
