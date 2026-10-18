import { homeCopy as copy } from "@content/es/home";
import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/",
  title: copy.meta.title,
  description: copy.meta.description,
});

export { default } from "@/views/home-view";
