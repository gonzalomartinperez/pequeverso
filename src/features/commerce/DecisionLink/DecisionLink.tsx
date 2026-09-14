import { MousePointerClick } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  variant?: "primary" | "secondary" | "inverse" | "ghost";
  size?: "default" | "small";
  block?: boolean;
  className?: string;
  children: ReactNode;
};

/** In-page link to the Hotmart decision block (`#gfp-decision`), never a checkout URL. */
export function DecisionLink({
  variant = "primary",
  size = "default",
  block = false,
  className,
  children,
}: Props) {
  const classes = [
    "button",
    `button--${variant}`,
    size === "small" ? "button--small" : "",
    block ? "button--block" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <a href="#gfp-decision" className={classes} data-decision-link>
      <MousePointerClick
        aria-hidden="true"
        focusable="false"
        size={20}
        strokeWidth={2.4}
        className="button__icon"
      />
      <span>{children}</span>
    </a>
  );
}
