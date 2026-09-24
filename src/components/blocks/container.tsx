import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<"div"> & { as?: "div" | "header" | "nav" | "footer" };

/** Centred 1200 px page column with the fluid gutter (`page-container` utility). */
export function Container({ as: Tag = "div", className, ...props }: Props) {
  return <Tag data-slot="container" className={cn("page-container", className)} {...props} />;
}
