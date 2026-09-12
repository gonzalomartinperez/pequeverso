import { ArrowRight, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "inverse" | "ghost";
type Common = {
  variant?: Variant;
  size?: "default" | "small";
  block?: boolean;
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

function classes({ variant = "primary", size = "default", block = false, className = "" }: Common): string {
  return [
    "button",
    `button--${variant}`,
    size === "small" ? "button--small" : "",
    block ? "button--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Content({ icon: Icon, iconAfter, children }: Pick<Common, "icon" | "iconAfter" | "children">) {
  const After = iconAfter === "arrow" ? ArrowRight : iconAfter === "external" ? ExternalLink : iconAfter;
  return (
    <>
      {Icon ? (
        <Icon aria-hidden="true" focusable="false" size={20} strokeWidth={2.4} className="button__icon" />
      ) : null}
      <span>{children}</span>
      {After ? (
        <After aria-hidden="true" focusable="false" size={18} strokeWidth={2.4} className="button__icon" />
      ) : null}
    </>
  );
}

/** Single button primitive: renders a Link for internal paths, <a> for external URLs, <button> otherwise. */
export function CTAButton(props: LinkProps | ButtonProps) {
  if (typeof props.href === "string") {
    const { href, external, variant, size, block, className, children, icon, iconAfter, ...rest } = props;
    const cls = classes({ variant, size, block, className, children });
    const isExternal = external || /^https?:/.test(href);
    const after = iconAfter ?? (isExternal && !/^mailto:/.test(href) ? "external" : undefined);
    if (isExternal || /^mailto:/.test(href)) {
      return (
        <a href={href} className={cls} rel={isExternal ? "noopener" : undefined} {...rest}>
          <Content icon={icon} iconAfter={after}>
            {children}
          </Content>
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        <Content icon={icon} iconAfter={iconAfter}>
          {children}
        </Content>
      </Link>
    );
  }
  const { variant, size, block, className, children, type = "button", icon, iconAfter, ...rest } = props;
  return (
    <button type={type} className={classes({ variant, size, block, className, children })} {...rest}>
      <Content icon={icon} iconAfter={iconAfter}>
        {children}
      </Content>
    </button>
  );
}
