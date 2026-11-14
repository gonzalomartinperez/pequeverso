import { accesibilidadCopy as copy } from "@content/es/legal/accesibilidad";
import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/accesibilidad/",
  title: copy.meta.title,
  description: copy.meta.description,
});

export { default } from "@/views/legal/accesibilidad-view";
