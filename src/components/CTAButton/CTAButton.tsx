import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "inverse" | "ghost";
type Common = {
  variant?: Variant;
  size?: "default" | "small";
  block?: boolean;
  children: ReactNode;
  className?: string;
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

/** Single button primitive: renders a Link for internal paths, <a> for external URLs, <button> otherwise. */
export function CTAButton(props: LinkProps | ButtonProps) {
  if (typeof props.href === "string") {
    const { href, external, variant, size, block, className, children, ...rest } = props;
    const cls = classes({ variant, size, block, className, children });
    if (external || /^https?:/.test(href)) {
      return (
        <a href={href} className={cls} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant, size, block, className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={classes({ variant, size, block, className, children })} {...rest}>
      {children}
    </button>
  );
}
