import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/aviso-legal/",
  title: "Aviso legal",
  description:
    "Identificación del titular de pequeverso.com, condiciones de uso del sitio, propiedad intelectual, ley aplicable y jurisdicción.",
  noindex: true,
});

export { default } from "@/views/legal/aviso-legal-view";
