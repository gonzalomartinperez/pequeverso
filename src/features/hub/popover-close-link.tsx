"use client";

import type { AnchorHTMLAttributes } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "onClick" | "href"> & { href: string };

/**
 * Plain link that closes the popover it sits in. A real `<a href>` (works before hydration and in
 * in-app browsers); the click only adds `hidePopover()`, so a same-page anchor (`/#leer` on the
 * home) scrolls with the panel already gone.
 */
export function PopoverCloseLink({ href, ...props }: Props) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        const panel = event.currentTarget.closest<HTMLElement>("[popover]");
        if (panel?.matches(":popover-open")) panel.hidePopover();
      }}
    />
  );
}
