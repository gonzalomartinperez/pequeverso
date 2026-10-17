"use client";

import type { ComponentProps } from "react";
import { HubProductLink } from "./hub-product-link";

type Props = Omit<ComponentProps<typeof HubProductLink>, "onBlur" | "onClickCapture">;

/**
 * Product selection that closes its popover. A real `<a href>` works before hydration and in
 * in-app browsers. Capture only adds `hidePopover()`, without cancelling navigation or adding
 * another commerce event. When focus leaves the panel, the panel closes.
 */
export function PopoverCloseLink(props: Props) {
  return (
    <HubProductLink
      {...props}
      onClickCapture={(event) => {
        const panel = event.currentTarget.closest<HTMLElement>("[popover]");
        if (panel?.matches(":popover-open")) panel.hidePopover();
      }}
      // Tab past the last card (or Shift+Tab out): close, so focus never moves behind the panel.
      onBlur={(event) => {
        const panel = event.currentTarget.closest<HTMLElement>("[popover]");
        const next = event.relatedTarget;
        if (next && panel && !panel.contains(next) && panel.matches(":popover-open")) panel.hidePopover();
      }}
    />
  );
}
