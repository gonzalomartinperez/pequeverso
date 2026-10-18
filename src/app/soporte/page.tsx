import { soporteCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/soporte/",
  title: copy.meta.title,
  description: copy.meta.description,
});

export { default } from "@/views/soporte-view";
